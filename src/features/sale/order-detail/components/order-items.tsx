import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table"

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

    const total = items.reduce(
        (sum: number, i: any) => sum + (i.line_total || 0),
        0
    )

    // ========================
    // EMPTY
    // ========================
    if (!items?.length) {
        return (
            <div className="rounded-md border bg-muted/20 p-4">
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

    // ========================
    // MAIN
    // ========================
    return (
        <div className="rounded-md border bg-background">

            {/* HEADER */}
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                    <h2 className="font-semibold">Danh sách hàng</h2>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi số lượng đặt, đã xuất, hàng trả và số lượng còn lại.
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
            <div className="overflow-x-auto">
                <Table>

                    {/* HEADER */}
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[64px] text-center">#</TableHead>
                            <TableHead className="min-w-[280px]">Sản phẩm</TableHead>
                            <TableHead className="text-right">SL</TableHead>
                            <TableHead className="text-right">Đã xuất</TableHead>
                            <TableHead className="text-right">Đã trả</TableHead>
                            <TableHead className="text-right">Còn</TableHead>
                            <TableHead className="text-right">Đơn giá</TableHead>
                            <TableHead className="text-right">Thành tiền</TableHead>
                            {isEditable && <TableHead className="w-[100px]" />}
                        </TableRow>
                    </TableHeader>

                    {/* BODY */}
                    <TableBody>
                        {items.map((i: any, idx: number) => {

                            const quantity = Number(i.quantity || 0)
                            const exported = Number(i.exported_quantity || 0)
                            const returned = Number(i.returned_quantity || 0)
                            const remain = Number(i.remain_quantity || 0)
                            const unitPrice = Number(i.unit_price || 0)
                            const isRowLocked = !isEditable

                            return (
                                <TableRow key={i.product_id} className="hover:bg-muted/30">

                                    {/* STT */}
                                    <TableCell className="text-center font-bold text-primary text-lg">
                                        #{idx + 1}
                                    </TableCell>

                                    <TableCell>
                                        <div className="font-medium">{i.product?.code ?? "-"}</div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {i.product?.name ?? "-"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right font-medium">
                                        {formatQty(quantity, i.product?.unit)}
                                    </TableCell>

                                    {/* ✅ ĐÃ XUẤT */}
                                    <TableCell className="text-right text-blue-600 font-medium">
                                        {formatQty(exported, i.product?.unit)}
                                    </TableCell>

                                    {/* ✅ ĐÃ TRẢ */}
                                    <TableCell className="text-right text-red-500">
                                        {formatQty(returned, i.product?.unit)}
                                    </TableCell>

                                    {/* ✅ CÒN */}
                                    <TableCell className="text-right">
                                        <span className={`font-semibold ${remain > 0 ? "text-orange-500" : "text-emerald-600"
                                            }`}>
                                            {formatQty(remain, i.product?.unit)}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        {formatCurrency(i.unit_price)}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-semibold">
                                                {formatCurrency(i.line_total || quantity * unitPrice)}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {isEditable && (
                                        <TableCell className="text-right space-x-1">

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

                                        </TableCell>
                                    )}

                                </TableRow>
                            )
                        })}
                    </TableBody>

                    {/* FOOTER */}
                    <TableFooter className="bg-muted/30">
                        <TableRow>
                            <TableCell
                                colSpan={isEditable ? 7 : 7}
                                className="text-right font-semibold"
                            >
                                Tổng
                            </TableCell>

                            <TableCell className="text-right font-bold text-lg">
                                {formatCurrency(total)}
                            </TableCell>

                            {isEditable && <TableCell />}
                        </TableRow>
                    </TableFooter>

                </Table>
            </div>

            {/* CREATE */}
            {isEditable && (
                <CreateOrderItemDialog
                    order={order}
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                />
            )}

            {/* EDIT */}
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

function formatQty(value: number, unit?: string) {
    const text = new Intl.NumberFormat("vi-VN").format(value || 0)
    return unit ? `${text} ${unit}` : text
}
