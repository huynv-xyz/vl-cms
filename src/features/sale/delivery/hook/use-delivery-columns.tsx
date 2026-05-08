import { useState } from "react"
import { Delivery } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { ColumnDef } from "@tanstack/react-table"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { DeliveryDetailDialog } from "../components/delivery-detail-dialog"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { DeliveryRowActions } from "../components/delivery-row-actions"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { updateDeliveryStatus } from "@/api/sale/delivery"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const statusOptions = [
    { value: "NEW", label: "Mới" },
    { value: "DELIVERING", label: "Đang giao" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
]

export function useDeliveryColumns() {

    const [selectedId, setSelectedId] = useState<number | null>(null)

    const columns: ColumnDef<Delivery>[] = [

        buildIndexColumn(),

        buildTextColumn({
            accessorKey: "delivery_no",
            title: "Mã giao",
            render: (row) => (
                <span
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => setSelectedId(row.id)}
                >
                    {row.delivery_no}
                </span>
            ),
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

                const queryClient = useQueryClient()

                const mutation = useMutation({
                    mutationFn: (value: string) =>
                        updateDeliveryStatus(row.original.id, value),
                    onMutate: async (value) => {

                        await queryClient.cancelQueries({ queryKey: ["deliveries"] })

                        const prev = queryClient.getQueryData(["deliveries"])

                        queryClient.setQueryData(["deliveries"], (old: any) => {
                            if (!old) return old

                            return {
                                ...old,
                                items: old.items.map((x: any) =>
                                    x.id === row.original.id
                                        ? { ...x, status: value }
                                        : x
                                )
                            }
                        })

                        return { prev }
                    },

                    onError: (_, __, context) => {
                        queryClient.setQueryData(["deliveries"], context?.prev)
                        toast.error("Cập nhật thất bại")
                    },
                    onSuccess: () => {
                        toast.success("Cập nhật trạng thái thành công")
                    },

                    onSettled: () => {
                        queryClient.invalidateQueries({ queryKey: ["deliveries"] })
                    }
                })

                const isLocked = ["DONE"].includes(row.original.status)

                return (
                    <Select
                        value={row.original.status}
                        onValueChange={(v) => mutation.mutate(v)}
                        disabled={mutation.isPending}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>
                                {statusOptions.find(s => s.value === row.original.status)?.label}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {statusOptions.map((s) => (
                                <SelectItem key={s.value} value={s.value} disabled={isLocked}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            }
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