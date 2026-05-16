import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { ColumnDef } from "@tanstack/react-table"
import type { Payment } from "../data/schema"
import { PaymentRowActions } from "./payment-row-actions"

export const paymentColumns: ColumnDef<Payment>[] = [
    buildIndexColumn(),
    {
        id: "payment",
        header: "Thanh toán",
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="min-w-[200px] space-y-1 text-base">
                    <PaymentTypeBadge type={item.type} />
                    <div className="text-base text-muted-foreground">
                        Ngày TT: {formatDate(item.paid_at)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Lô: {item.shipment?.code ?? "-"}
                    </div>
                </div>
            )
        },
    },
    {
        id: "amount",
        header: "Số tiền",
        cell: ({ row }) => {
            const item = row.original
            const currency = item.contract?.currency?.code ?? "-"

            return (
                <div className="min-w-[160px] text-right text-base">
                    <div className="font-semibold">{formatCurrency(item.amount ?? 0)}</div>
                    <div className="text-sm text-muted-foreground">{currency}</div>
                </div>
            )
        },
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    },
    {
        id: "exchange",
        header: "Quy đổi",
        cell: ({ row }) => {
            const item = row.original
            const exchangeRate = item.exchange_rate ?? 1
            const amount = item.amount ?? 0

            return (
                <div className="min-w-[170px] text-right text-base">
                    <div className="font-semibold">{formatCurrency(amount * exchangeRate)}</div>
                    <div className="text-sm text-muted-foreground">
                        Tỷ giá {formatNumber(exchangeRate)}
                    </div>
                </div>
            )
        },
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    },
    {
        id: "note",
        header: "Ghi chú",
        cell: ({ row }) => (
            <div className="max-w-[360px] truncate text-base text-muted-foreground">
                {row.original.note || "-"}
            </div>
        ),
    },
    buildActionsColumn({
        renderActions: (_, row) => <PaymentRowActions row={row} />,
    }),
]

function PaymentTypeBadge({ type }: { type?: string }) {
    const className =
        type === "PAYMENT"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : type === "FEE"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-sky-200 bg-sky-50 text-sky-700"

    return (
        <Badge variant="outline" className={`${className} text-sm`}>
            {formatPaymentType(type)}
        </Badge>
    )
}

function formatPaymentType(type?: string) {
    switch (type) {
        case "DEPOSIT":
            return "Cọc"
        case "PAYMENT":
            return "Thanh toán"
        case "FEE":
            return "Phí"
        default:
            return type || "-"
    }
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString("vi-VN")
}
