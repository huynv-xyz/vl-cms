import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Receipt } from "../data/schema"
import { ReceiptRowActions } from "./receipt-row-actions"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const receiptColumns: ColumnDef<Receipt>[] = [
    buildIndexColumn(),

    // Đơn hàng
    {
        accessorKey: "order_id",
        header: "Đơn hàng",
        cell: ({ row }) =>
            row.original.order?.order_no ?? `#${row.original.order_id}`,
    },

    // Khách hàng
    {
        accessorKey: "customer_id",
        header: "Khách hàng",
        size: 200,

        cell: ({ row }) => {
            const name =
                row.original.customer?.name ?? `#${row.original.customer_id}`

            return (
                <div
                    className="max-w-[200px] truncate"
                    title={name}

                >
                    {name}
                </div>

            )

        },
    },

    // Ngày thu
    buildTextColumn({
        accessorKey: "receipt_date",
        title: "Ngày thu",
    }),

    // Số tiền
    {
        accessorKey: "amount",
        header: "Số tiền",
        cell: ({ row }) => (
            <span className="font-bold">
                {formatCurrency(row.original.amount ?? 0)}
            </span>
        ),
    },

    // Hình thức
    {
        accessorKey: "method",
        header: "Hình thức",
        cell: ({ row }) => {
            const method = row.original.method

            const map: any = {
                CASH: { label: "Tiền mặt", variant: "secondary" },
                BANK: { label: "Chuyển khoản", variant: "default" },
            }

            const meta = map[method] || {
                label: method,
                variant: "outline",
            }

            return (
                <Badge variant={meta.variant}>
                    {meta.label}
                </Badge>
            )
        },
    },

    // Trạng thái
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.status

            const map: any = {
                DONE: { label: "Hoàn thành", variant: "outline" },
                CANCELLED: { label: "Huỷ", variant: "destructive" },
            }

            const meta = map[status] || {
                label: status,
                variant: "outline",
            }

            return (
                <Badge variant={meta.variant}>
                    {meta.label}
                </Badge>
            )
        },
    },

    buildTextColumn({
        accessorKey: "note",
        title: "Ghi chú",
    }),

    // Actions
    buildActionsColumn({
        renderActions: (_, row) => <ReceiptRowActions row={row} />,
    }),
]