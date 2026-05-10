import { useState, Fragment } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { deleteDelivery, updateDeliveryStatus } from "@/api/sale/delivery"
import { UpdateDeliveryDialog } from "../../delivery/components/update-delivery-dialog"
import { CreateDeliveryDialog } from "../../delivery/components/create-delivery-dialog"
import { DeliveryDetailDialog } from "../../delivery/components/delivery-detail-dialog"

const statusOptions = [
    { value: "NEW", label: "Mới" },
    { value: "DELIVERING", label: "Đang giao" },
    { value: "DONE", label: "Hoàn thành" },
    { value: "CANCELLED", label: "Hủy" },
]

export function OrderDeliveries({ order, deliveries }: any) {

    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)

    // 🔥 RULE CHÍNH
    const isEditable = order?.status === "CONFIRMED"

    // ========================
    // DELETE
    // ========================
    const { mutate: removeDelivery, isPending } = useMutation({
        mutationFn: deleteDelivery,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
            toast.success("Đã xoá phiếu giao hàng")
        },
        onError: (e: any) => toast.error(e.message || "Lỗi"),
    })

    // ========================
    // UPDATE STATUS
    // ========================
    const { mutate: changeStatus, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, status }: any) =>
            updateDeliveryStatus(id, status),

        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({
                queryKey: ["order-detail", order.id],
            })

            const prev = queryClient.getQueryData([
                "order-detail",
                order.id,
            ])

            queryClient.setQueryData(
                ["order-detail", order.id],
                (old: any) => {
                    if (!old) return old

                    return {
                        ...old,
                        deliveries: old.deliveries.map((x: any) =>
                            x.id === id
                                ? { ...x, status }
                                : x
                        ),
                    }
                }
            )

            return { prev }
        },

        onError: (_, __, context) => {
            queryClient.setQueryData(
                ["order-detail", order.id],
                context?.prev
            )
            toast.error("Cập nhật thất bại")
        },

        onSuccess: () => {
            toast.success("Cập nhật trạng thái thành công")
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
        },
    })

    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">

            {/* HEADER */}
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Giao hàng</h2>

                {isEditable && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Tạo mới
                    </Button>
                )}
            </div>

            {!deliveries?.length ? (
                <div className="text-sm text-muted-foreground">
                    Chưa có giao hàng
                </div>
            ) : (
                <table className="w-full text-sm border rounded-lg overflow-hidden">

                    <thead className="bg-muted text-xs uppercase">
                        <tr>
                            <th className="w-[70px] text-center">#</th>
                            <th className="p-2 text-left">Mã giao</th>
                            <th className="p-2 text-left">Ngày</th>
                            <th className="p-2 text-left">Kho</th>
                            <th className="p-2 text-left">Trạng thái</th>
                            <th className="p-2 w-[120px]" />
                        </tr>
                    </thead>

                    <tbody>
                        {deliveries.map((d: any, idx: number) => {
                            const isRowLocked =
                                !isEditable || d.status === "DONE"

                            return (
                                <Fragment key={d.id}>

                                    {/* HEADER */}
                                    <tr className="border-t bg-muted/20">

                                        <td className="text-center font-bold text-primary">
                                            <span className="text-2xl font-bold text-primary">
                                                #{idx + 1}
                                            </span>
                                        </td>

                                        <td className="p-2 font-medium">
                                            <span
                                                className="text-primary cursor-pointer hover:underline"
                                                onClick={() => setSelectedId(d.id)}
                                            >
                                                {d.delivery_no}
                                            </span>
                                        </td>

                                        <td className="p-2 text-muted-foreground">
                                            {d.delivery_date}
                                        </td>

                                        <td className="p-2 text-muted-foreground">
                                            {d.warehouse?.name}
                                        </td>

                                        {/* STATUS */}
                                        <td className="p-2">
                                            <Select
                                                value={d.status}
                                                onValueChange={(v) =>
                                                    changeStatus({ id: d.id, status: v })
                                                }
                                                disabled={isUpdating || isRowLocked}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue>
                                                        {
                                                            statusOptions.find(
                                                                s => s.value === d.status
                                                            )?.label
                                                        }
                                                    </SelectValue>
                                                </SelectTrigger>

                                                <SelectContent>
                                                    {statusOptions.map(s => (
                                                        <SelectItem
                                                            key={s.value}
                                                            value={s.value}
                                                            disabled={isRowLocked}
                                                        >
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>

                                        {/* ACTION */}
                                        <td className="p-2 text-right space-x-1">

                                            {!isRowLocked && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setEditRow(d)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500"
                                                        disabled={isPending}
                                                        onClick={() => {
                                                            if (confirm("Xoá phiếu giao hàng này?")) {
                                                                removeDelivery(d.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>

                                    {/* ITEMS */}
                                    <tr>
                                        <td />
                                        <td colSpan={5}>
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/30">
                                                    <tr>
                                                        <th className="p-2 text-left">Mã sản phẩm</th>
                                                        <th className="p-2 text-left">Tên sản phẩm</th>
                                                        <th className="p-2 text-left">SL</th>
                                                        <th className="p-2 text-left">ĐVT</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {d.items?.map((i: any) => (
                                                        <tr key={i.product_id} className="border-t">
                                                            <td className="p-2 text-xs text-muted-foreground">
                                                                {i.product?.code}
                                                            </td>
                                                            <td className="p-2">
                                                                {i.product?.name}
                                                            </td>
                                                            <td className="p-2 text-left font-medium">
                                                                {i.quantity}
                                                            </td>
                                                            <td className="p-2 text-left text-muted-foreground">
                                                                {i.product?.unit}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                </Fragment>
                            )
                        })}
                    </tbody>
                </table>
            )}

            {/* CREATE */}
            {isEditable && (
                <CreateDeliveryDialog
                    order={order}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                />
            )}

            {/* EDIT */}
            {editRow && (
                <UpdateDeliveryDialog
                    delivery={editRow}
                    open={!!editRow}
                    onOpenChange={(open: boolean) => {
                        if (!open) setEditRow(null)
                    }}
                />
            )}

            {/* DETAIL */}
            <DeliveryDetailDialog
                open={!!selectedId}
                id={selectedId ?? undefined}
                onClose={() => setSelectedId(null)}
            />
        </div>
    )
}