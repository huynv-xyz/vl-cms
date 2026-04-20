import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Delivery } from "../data/schema"
import { DeliveryRowActions } from "./delivery-row-actions"
import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const deliveryColumns: ColumnDef<Delivery>[] = [
    buildIndexColumn(),

    // ===== MÃ GIAO
    buildTextColumn({
        accessorKey: "delivery_no",
        title: "Mã giao",
        render: (row) => (
            <Link
                to="/sales/deliveries/$id"
                params={{ id: String(row.id) }}
                className="text-primary hover:underline font-medium"
            >
                {row.delivery_no}
            </Link>
        ),
    }),

    // ===== ORDER
    {
        accessorKey: "order_id",
        header: "Đơn hàng",
        cell: ({ row }) => (
            <Link
                to="/sales/orders/$id"
                params={{ id: String(row.original.order_id) }}
                className="text-primary hover:underline"
            >
                {row.original.order?.order_no ?? row.original.order_id}
            </Link>
        ),
    },

    // ===== KHO
    {
        accessorKey: "warehouse_id",
        header: "Kho",
        cell: ({ row }) =>
            row.original.warehouse?.name ??
            row.original.warehouse_id ??
            "-",
    },

    // ===== CÔNG TY
    {
        accessorKey: "company_id",
        header: "Công ty",
        cell: ({ row }) =>
            row.original.company?.name ??
            row.original.company_id ??
            "-",
    },

    // ===== NGÀY GIAO
    buildTextColumn({
        accessorKey: "delivery_date",
        title: "Ngày giao",
    }),

    // ===== ĐỊA CHỈ
    buildTextColumn({
        accessorKey: "delivery_address",
        title: "Địa chỉ giao",
    }),

    // ===== STATUS
    {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.status

            const map: any = {
                NEW: { label: "Mới", variant: "secondary" },
                DELIVERING: { label: "Đang giao", variant: "default" },
                DONE: { label: "Hoàn thành", variant: "outline" },
                CANCELLED: { label: "Hủy", variant: "destructive" },
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

    buildActionsColumn({
        renderActions: (_, row) => <DeliveryRowActions row={row} />,
    }),
]