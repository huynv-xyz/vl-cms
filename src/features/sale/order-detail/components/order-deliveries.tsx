import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Trash2, Plus, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { deleteDelivery } from "@/api/sale/delivery"
import { UpdateDeliveryDialog } from "../../delivery/components/update-delivery-dialog"
import { CreateDeliveryDialog } from "../../delivery/components/create-delivery-dialog"
import { useConfirmDelivery } from "../../delivery/hook/use-confirm-delivery"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function OrderDeliveries({ order, deliveries }: any) {
    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)
    const [confirmRow, setConfirmRow] = useState<any>(null)

    const { confirmDelivery, isConfirming } = useConfirmDelivery()

    const { mutate: removeDelivery, isPending } = useMutation({
        mutationFn: (id: number) => deleteDelivery(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
            toast.success("Đã xoá phiếu giao hàng")
        },
        onError: (e: any) => toast.error(e.message || "Lỗi"),
    })

    const handleConfirmDelivery = async () => {
        if (!confirmRow?.id) return

        await confirmDelivery(confirmRow.id)

        await queryClient.invalidateQueries({
            queryKey: ["order-detail", order.id],
        })

        setConfirmRow(null)
    }

    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">Giao hàng</h2>
                    <p className="text-sm text-muted-foreground">
                        Danh sách phiếu giao hàng của đơn hàng
                    </p>
                </div>

                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Giao hàng
                </Button>
            </div>

            {!deliveries?.length ? (
                <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                    Chưa có giao hàng
                </div>
            ) : (
                <div className="space-y-3">
                    {deliveries.map((d: any) => (
                        <div key={d.id} className="overflow-hidden rounded-lg border">
                            <div className="flex items-center justify-between bg-muted/40 px-4 py-3 text-sm">
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="font-medium">{d.delivery_no}</span>
                                    <span className="text-muted-foreground">
                                        {d.delivery_date}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {d.warehouse?.name ?? "-"}
                                    </span>
                                    <span className="font-medium">{d.status}</span>
                                </div>

                                <div className="flex gap-1">
                                    {d.status !== "DONE" && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                            onClick={() => setConfirmRow(d)}
                                            title="Xác nhận giao"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    )}

                                    {d.status !== "DONE" && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => setEditRow(d)}
                                            title="Sửa"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}

                                    {d.status !== "DONE" && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-red-500 hover:text-red-600"
                                            disabled={isPending}
                                            onClick={() => {
                                                if (confirm("Xoá phiếu giao hàng này?")) {
                                                    removeDelivery(d.id)
                                                }
                                            }}
                                            title="Xoá"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/20 text-left">
                                        <th className="px-4 py-2">Sản phẩm</th>
                                        <th className="w-32 py-2 text-right">SL</th>
                                        <th className="px-4 py-2">Ghi chú</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {d.items?.map((i: any) => (
                                        <tr
                                            key={i.product_id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-2">
                                                <div className="font-medium">
                                                    {i.product?.name ?? "-"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {i.product?.code ?? ""}
                                                </div>
                                            </td>

                                            <td className="py-2 text-right font-medium">
                                                {i.quantity}
                                            </td>

                                            <td className="px-4 py-2 text-muted-foreground">
                                                {i.note || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            <CreateDeliveryDialog
                order={order}
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {editRow && (
                <UpdateDeliveryDialog
                    delivery={editRow}
                    open={!!editRow}
                    onOpenChange={(open: boolean) => {
                        if (!open) setEditRow(null)
                    }}
                />
            )}

            <AlertDialog
                open={!!confirmRow}
                onOpenChange={(open) => {
                    if (!open) setConfirmRow(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận giao hàng</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ:
                            <br />• Tạo phiếu xuất kho
                            <br />• Trừ tồn kho
                            <br />• Ghi nhận công nợ
                            <br />
                            <br />Bạn có chắc muốn tiếp tục?
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isConfirming}>
                            Huỷ
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={isConfirming}
                            onClick={(e) => {
                                e.preventDefault()
                                void handleConfirmDelivery()
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isConfirming ? "Đang xử lý..." : "Xác nhận"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}