import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Order } from "../data/schema"
import { OrderRowActions } from "./order-row-actions"
import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { orderStatusMeta } from "./order-status"
import { formatCurrency } from "@/lib/utils"

export const orderColumns: ColumnDef<Order>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "order_no",
        title: "Số đơn",
        render: (row) => (
            <Link
                to="/sales/orders/$id"
                params={{ id: String(row.id) }}
                className="text-primary hover:underline font-medium"
            >
                {row.order_no}
            </Link>
        ),
    }),

    {
        accessorKey: "customer_id",
        header: "Khách hàng",
        cell: ({ row }) => row.original.customer?.name ?? "-"
    },

    {
        accessorKey: "employee_id",
        header: "Sale",
        cell: ({ row }) => row.original.employee?.name ?? "-"
    },

    buildTextColumn({
        accessorKey: "order_date",
        title: "Ngày đặt hàng",
    }),

    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.status
            const meta = orderStatusMeta[status] || {
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

    {
        accessorKey: "total_amount",
        header: "Tổng tiền",
        cell: ({ row }) => (
            <span className="font-bold">
                {formatCurrency(row.original.total_amount ?? 0)}
            </span>
        ),
    },

    buildTextColumn({
        accessorKey: "created_at",
        title: "Ngày tạo",
    }),

    buildActionsColumn({
        renderActions: (_, row) => <OrderRowActions row={row} />,
    }),
]