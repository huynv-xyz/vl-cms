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

    buildTextColumn({
        accessorKey: "delivery_no",
        title: "Mã giao"
    }),

    {
        accessorKey: "order_id",
        header: "Đơn hàng",
        cell: ({ row }) =>
            row.original.order?.order_no
    },

    {
        accessorKey: "warehouse_id",
        header: "Kho",
        cell: ({ row }) =>
            row.original.warehouse?.name ??
            row.original.warehouse_id ??
            "-",
    },

    {
        accessorKey: "company_id",
        header: "Công ty",
        cell: ({ row }) =>
            row.original.company?.name ??
            row.original.company_id ??
            "-",
    },

    buildTextColumn({
        accessorKey: "delivery_date",
        title: "Ngày giao",
    }),

    buildTextColumn({
        accessorKey: "delivery_address",
        title: "Địa chỉ giao",
    }),

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