import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

import { deleteOrderItem } from "@/api/sale/order"
import { CreateOrderItemDialog } from "./create-order-item-dialog"
import { UpdateOrderItemDialog } from "./update-order-item-dialog"

export function OrderItems({ order, items }: any) {

    const queryClient = useQueryClient()

    const [createOpen, setCreateOpen] = useState(false)
    const [editRow, setEditRow] = useState<any>(null)

    const isEditable = order?.status === "CONFIRMED"

    const { mutate: removeItem, isPending } = useMutation({
        mutationFn: deleteOrderItem,

        onSuccess: async () => {
            toast.success("Đã xoá sản phẩm")

            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order.id],
            })
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    if (!items?.length) {
        return (
            <div className="rounded-xl border bg-white p-4 shadow-sm">

                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold">Danh sách hàng</h2>
                        <p className="text-sm text-muted-foreground">
                            Chưa có sản phẩm
                        </p>
                    </div>

                    {isEditable && (
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm
                        </Button>
                    )}
                </div>

                {isEditable && (
                    <CreateOrderItemDialog
                        order={order}
                        open={createOpen}
                        onOpenChange={setCreateOpen}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">

            {/* HEADER */}
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">Danh sách hàng</h2>
                    <p className="text-sm text-muted-foreground">
                        Chi tiết sản phẩm
                    </p>
                </div>

                {isEditable && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1 h-4 w-4" />
                        Thêm
                    </Button>
                )}
            </div>

            {/* TABLE */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">

                    <thead className="bg-muted text-xs uppercase">
                        <tr>
                            <th className="w-[60px] text-center">#</th>
                            <th className="p-2 text-left">Mã sản phẩm</th>
                            <th className="p-2 text-left">Tên sản phẩm</th>
                            <th className="p-2 text-right">SL</th>
                            <th className="p-2 text-right">ĐVT</th>
                            <th className="p-2 text-right">Đã xuất</th>
                            <th className="p-2 text-right">Còn</th>
                            <th className="p-2 text-right">Đơn giá</th>
                            <th className="p-2 text-right">Thành tiền</th>
                            {isEditable && <th className="p-2 w-[100px]" />}
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((i: any, idx: number) => {

                            const isRowLocked = !isEditable

                            return (
                                <tr key={i.product_id} className="border-t hover:bg-muted/30">

                                    <td className="text-center font-bold text-primary text-lg">
                                        #{idx + 1}
                                    </td>

                                    <td className="p-2">{i.product?.code ?? ""}</td>

                                    <td className="p-2 text-xs text-muted-foreground">
                                        {i.product?.name ?? ""}
                                    </td>

                                    <td className="p-2 text-right font-medium">
                                        {i.quantity}
                                    </td>

                                    <td className="p-2 text-right text-muted-foreground">
                                        {i.product?.unit}
                                    </td>

                                    <td className="p-2 text-right text-muted-foreground">
                                        {i.exported_quantity}
                                    </td>

                                    <td className="p-2 text-right">
                                        <span className={`font-semibold ${i.remain_quantity > 0
                                            ? "text-orange-500"
                                            : "text-emerald-600"
                                            }`}>
                                            {i.remain_quantity}
                                        </span>
                                    </td>

                                    <td className="p-2 text-right">
                                        {formatCurrency(i.unit_price)}
                                    </td>

                                    <td className="p-2 text-right font-semibold">
                                        {formatCurrency(i.line_total)}
                                    </td>

                                    <td className="p-2 text-right space-x-1">
                                        {isEditable && (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setEditRow(i)}
                                                    disabled={isRowLocked}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-red-500"
                                                    disabled={isPending || isRowLocked}
                                                    onClick={() => {
                                                        if (confirm("Xoá sản phẩm này?")) {
                                                            removeItem(i.id)
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>

                    <tfoot className="bg-muted/30">
                        <tr>
                            <td
                                colSpan={isEditable ? 9 : 8}
                                className="p-2 text-right font-semibold"
                            >
                                Tổng
                            </td>

                            <td className="p-2 text-right font-bold text-lg">
                                {formatCurrency(
                                    items.reduce(
                                        (sum: number, i: any) => sum + (i.line_total || 0),
                                        0
                                    )
                                )}
                            </td>

                            {/* nếu có action column thì cần thêm 1 td rỗng */}
                            {isEditable && <td />}
                        </tr>
                    </tfoot>

                </table>
            </div>

            {isEditable && (
                <CreateOrderItemDialog
                    order={order}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                />
            )}

            {editRow && (
                <UpdateOrderItemDialog
                    item={editRow}
                    open={!!editRow}
                    onOpenChange={(v: boolean) => {
                        if (!v) setEditRow(null)
                    }}
                />
            )}
        </div>
    )
}