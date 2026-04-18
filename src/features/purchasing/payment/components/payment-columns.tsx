import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildCurrencyColumn } from "@/components/crud/build-currency-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { PaymentRowActions } from "./payment-row-actions"
import { Payment } from "../data/schema"
import { formatNumber } from "@/lib/utils"

const PAYMENT_TYPE_MAP: Record<string, { label: string; variant?: any }> = {
    DEPOSIT: { label: "Cọc", variant: "warning" },
    PAYMENT: { label: "Thanh toán", variant: "success" },
    FEE: { label: "Phí", variant: "secondary" },
}

export const paymentColumns: ColumnDef<Payment>[] = [
    buildIndexColumn(),
    buildTextColumn({
        id: "shipment",
        title: "Mã lô",
        accessorFn: (row) => row.shipment?.code ?? "-",
    }),

    buildTextColumn({
        accessorKey: "paid_at",
        title: "Ngày thanh toán",
    }),

    buildCurrencyColumn({
        accessorKey: "amount",
        title: "Số tiền",
        meta: {
            footer: (rows: Payment[]) => {
                const total = rows.reduce(
                    (sum, r) => sum + (r.amount ?? 0),
                    0
                )
                return formatNumber(total)
            },
        },
    }),

    {
        accessorKey: "currency_id",
        header: "Tiền tệ",
        cell: ({ row }) => row?.original.contract?.currency?.code ?? "",
    },


    buildTextColumn({
        id: "exchange_rate",
        title: "Tỷ giá",
        accessorFn: (row) => formatNumber(row.exchange_rate ?? 1),
    }),

    buildTextColumn({
        id: "amount_vnd",
        title: "VNĐ",
        accessorFn: (row) => {
            const amount = row.amount ?? 0
            const exchangeRate = row.exchange_rate ?? 1
            return formatNumber(amount * exchangeRate)
        },
    }),


    buildBadgeColumn({
        accessorKey: "type",
        title: "Loại",
        mapValueToLabel: (value) => {
            const key = String(value ?? "")
            return PAYMENT_TYPE_MAP[key]?.label ?? key
        },
        mapValueToVariant: (value) => {
            const key = String(value ?? "")
            return PAYMENT_TYPE_MAP[key]?.variant ?? "outline"
        },
    }),

    buildTextColumn({
        accessorKey: "note",
        title: "Ghi chú",
    }),

    buildActionsColumn({
        renderActions: (_, row) => <PaymentRowActions row={row} />,
    }),
]