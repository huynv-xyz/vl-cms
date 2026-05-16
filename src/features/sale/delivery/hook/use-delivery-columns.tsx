import { useState } from "react"
import { Delivery } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { ColumnDef } from "@tanstack/react-table"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { DeliveryDetailDialog } from "../components/delivery-detail-dialog"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { DeliveryRowActions } from "../components/delivery-row-actions"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { updateDeliveryStatus } from "@/api/sale/delivery"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DELIVERY_STATUSES, getNextDeliveryStatuses } from "../components/delivery-status"

export function useDeliveryColumns() {

    const [selectedId, setSelectedId] = useState<number | null>(null)

    const columns: ColumnDef<Delivery>[] = [

        buildIndexColumn(),

        buildTextColumn({
            accessorKey: "delivery_no",
            title: "Mã giao",
            render: (row) => (
                <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => setSelectedId(row.id)}
                >
                    {row.delivery_no}
                    <div className="text-xs font-normal text-muted-foreground">
                        {row.order?.order_no ? `Đơn ${row.order.order_no}` : "Chưa có đơn"}
                    </div>
                </button>
            ),
        }),

        {
            accessorKey: "order_id",
            header: "Đơn hàng",
            cell: ({ row }) => row.original.order?.order_no ?? "-",
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
            title: "Địa chỉ",
            render: (row) => (
                <span className="line-clamp-2 max-w-[320px] text-sm text-muted-foreground">
                    {row.delivery_address || "-"}
                </span>
            ),
        }),

        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => <DeliveryStatusSelect delivery={row.original} />
        },
        buildActionsColumn({
            renderActions: (_, row) => {
                const status = row.original.status
                if (["DELIVERING", "DONE"].includes(status)) {
                    return null
                }
                return <DeliveryRowActions row={row} />
            },
        })
    ]

    return {
        columns,
        dialog: (
            <DeliveryDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        )
    }
}

function DeliveryStatusSelect({ delivery }: { delivery: Delivery }) {
    const queryClient = useQueryClient()
    const allowedNextStatuses = getNextDeliveryStatuses(delivery.status)
    const isLocked = allowedNextStatuses.length === 0

    const mutation = useMutation({
        mutationFn: (value: string) => updateDeliveryStatus(delivery.id, value),
        onError: () => {
            toast.error("Cập nhật trạng thái thất bại")
        },
        onSuccess: () => {
            toast.success("Cập nhật trạng thái thành công")
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
        },
    })

    return (
        <Select
            value={delivery.status}
            onValueChange={(value) => mutation.mutate(value)}
            disabled={mutation.isPending || isLocked}
        >
            <SelectTrigger className="h-9 w-[150px]">
                <SelectValue>
                    {DELIVERY_STATUSES.find((status) => status.value === delivery.status)?.label}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {DELIVERY_STATUSES.map((status) => (
                    <SelectItem
                        key={status.value}
                        value={status.value}
                        disabled={
                            status.value !== delivery.status &&
                            !allowedNextStatuses.includes(status.value)
                        }
                    >
                        {status.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
