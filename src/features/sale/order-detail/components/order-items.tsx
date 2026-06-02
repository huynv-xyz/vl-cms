import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Package, Pencil, Plus, Trash2 } from "lucide-react"

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

    const total = items.reduce((sum: number, i: any) => {
        if (i.line_type === "PROMOTION") return sum

        const quantity = Number(i.quantity || 0)
        const unitPrice = Number(i.unit_price || 0)
        return sum + Number(i.line_total ?? quantity * unitPrice)
    }, 0)

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Package className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Danh sách hàng bán</h2>
                        <p className="text-xs text-muted-foreground">
                            Theo dõi số lượng đặt, đã xuất, hàng trả và còn lại
                        </p>
                    </div>
                </div>

                {isEditable && (
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Thêm sản phẩm
                    </Button>
                )}
            </div>

            {/* EMPTY */}
            {!items?.length ? (
                <EmptyState
                    title="Chưa có sản phẩm"
                    desc="Đơn hàng này chưa có sản phẩm nào. Nhấn 'Thêm sản phẩm' để bắt đầu."
                />
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[56px] text-center text-xs font-semibold uppercase">#</TableHead>
                                <TableHead className="min-w-[280px] text-xs font-semibold uppercase">Sản phẩm</TableHead>
                                <TableHead className="min-w-[220px] text-xs font-semibold uppercase">Mô tả HH</TableHead>
                                <TableHead className="w-[120px] text-center text-xs font-semibold uppercase">Khuyến mãi</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase">SL đặt</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase">Đã xuất</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase">Đã trả</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase">Còn lại</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase">Đơn giá</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase">Thành tiền</TableHead>
                                {isEditable && <TableHead className="w-[96px]" />}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {items.map((i: any, idx: number) => {
                                const quantity = Number(i.quantity || 0)
                                const exported = Number(i.exported_quantity || 0)
                                const returned = Number(i.returned_quantity || 0)
                                const remain = Number(i.remain_quantity || 0)
                                const unitPrice = Number(i.unit_price || 0)
                                const isPromotion = i.line_type === "PROMOTION"
                                const isRowLocked = !isEditable

                                return (
                                    <TableRow key={i.id ?? `${i.product_id}-${idx}`} className="hover:bg-muted/30">
                                        <TableCell className="text-center text-sm font-semibold text-muted-foreground">
                                            {idx + 1}
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium leading-tight">
                                                    {i.product?.name ?? "-"}
                                                </span>
                                                <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                                                    {i.product?.code ?? "-"}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {i.description ? (
                                                <span className="inline-flex max-w-[260px] rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                                    {i.description}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            {isPromotion ? (
                                                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    Hàng KM
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right font-medium tabular-nums">
                                            {formatQty(quantity, i.product?.unit)}
                                        </TableCell>

                                        <TableCell className="text-right font-medium tabular-nums text-blue-600 dark:text-blue-400">
                                            {formatQty(exported, i.product?.unit)}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-rose-500">
                                            {returned > 0 ? formatQty(returned, i.product?.unit) : "—"}
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums">
                                            <span
                                                className={
                                                    remain > 0
                                                        ? "rounded-md bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                                        : "font-semibold text-emerald-600 dark:text-emerald-400"
                                                }
                                            >
                                                {formatQty(remain, i.product?.unit)}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                            {formatCurrency(unitPrice)}
                                        </TableCell>

                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {formatCurrency(isPromotion ? 0 : (i.line_total ?? quantity * unitPrice))}
                                        </TableCell>

                                        {isEditable && (
                                            <TableCell>
                                                <div className="flex justify-end gap-0.5">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => setEditRow(i)}
                                                        disabled={isRowLocked}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                                                        disabled={isPending || isRowLocked}
                                                        onClick={() => {
                                                            if (confirm("Xoá sản phẩm này?")) {
                                                                removeItem(i.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>

                        <TableFooter className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={9}
                                    className="text-right text-sm font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    Tổng cộng
                                </TableCell>
                                <TableCell className="text-right text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(total)}
                                </TableCell>
                                {isEditable && <TableCell />}
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}

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

function EmptyState({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{desc}</p>
        </div>
    )
}

function formatQty(value: number, unit?: string) {
    const text = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value || 0)
    return unit ? `${text} ${unit}` : text
}
