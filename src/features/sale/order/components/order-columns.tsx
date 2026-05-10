import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Order } from "../data/schema"
import { OrderRowActions } from "./order-row-actions"
import { Link } from "@tanstack/react-router"
import { formatCurrency } from "@/lib/utils"

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { useInlineStatus } from "@/hooks/use-inline-status"
import { updateOrderStatus } from "@/api/sale/order"

const statusOptions = [
    { value: "NEW", label: "Mới" },
    { value: "CONFIRMED", label: "Xác nhận" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Huỷ" },
]

export function useOrderColumns() {

    const mutation = useInlineStatus<Order>({
        queryKey: ["orders"],
        mutationFn: updateOrderStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Order>[] = [

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
                const isLocked = status === "DONE"

                return (
                    <Select
                        value={status}
                        onValueChange={(v) =>
                            mutation.mutate({
                                row: row.original,
                                value: v,
                            })
                        }
                        disabled={mutation.isPending || isLocked}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>
                                {
                                    statusOptions.find(s => s.value === status)?.label
                                }
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {statusOptions.map((s) => (
                                <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    disabled={isLocked}
                                >
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
            renderActions: (_, row) => {
                if (row.original.status === "DONE") return null
                return <OrderRowActions row={row} />
            },
        }),
    ]

    return columns
}