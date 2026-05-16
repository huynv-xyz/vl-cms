import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Save } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { updateOrder, getOrder } from "@/api/sale/order"

import { OrderItemsEditor } from "./order-items-editor"
import { OrderHeaderFields } from "./order-header-fields"

import type { Order } from "../data/schema"
import { formatCurrency, normalizeDate } from "@/lib/utils"

type Props = {
    order: Order
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateOrderDialog({ order, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()

    const { data: detail, isLoading } = useQuery({
        queryKey: ["order-detail", order?.id],
        queryFn: () => getOrder(order.id),
        enabled: open && !!order?.id,
    })

    const [headerFormData, setHeaderFormData] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            customer_id: detail.customer_id ?? undefined,
            employee_id: detail.employee_id ?? undefined,
            order_date: normalizeDate(detail.order_date),
            status: detail.status ?? "NEW",
            note: detail.note ?? "",
        })

        setItems(
            (detail.items ?? []).map((i: any) => ({
                id: i.id,
                product_id: i.product_id,
                product: i.product,
                quantity: i.quantity ?? 0,
                unit_price: i.unit_price ?? 0,
                discount: i.discount ?? 0,
                line_type: i.line_type ?? "NORMAL",
            }))
        )
    }, [open, detail])

    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalAmount = items.reduce((sum, item) => {
        const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
        return sum + Math.max(lineTotal - Number(item.discount || 0), 0)
    }, 0)

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!headerFormData.customer_id) {
                throw new Error("Chưa chọn khách hàng")
            }

            if (!items.length) {
                throw new Error("Phải có ít nhất 1 sản phẩm")
            }

            for (const i of items) {
                if (!i.product_id) {
                    throw new Error("Chưa chọn sản phẩm")
                }
                if ((i.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng phải > 0")
                }
            }

            return updateOrder({
                id: order.id,
                ...headerFormData,
                items: items.map((i) => ({
                    id: i.id,
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    discount: i.discount ?? 0,
                    line_type: i.line_type ?? "NORMAL",
                })),
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            await queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })

            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    setHeaderFormData(null)
                    setItems([])
                }
                onOpenChange(v)
            }}
        >
            <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-6xl">
                <DialogHeader className="border-b px-8 py-6">
                    <DialogTitle className="text-2xl">Cập nhật đơn hàng</DialogTitle>
                    <DialogDescription className="text-base">
                        Điều chỉnh thông tin đơn và danh sách sản phẩm bán.
                    </DialogDescription>
                </DialogHeader>

                {isLoading || !headerFormData ? (
                    <div className="flex-1 p-8 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
                ) : (
                    <>
                        <form
                            id="order-update-form"
                            className="min-h-0 flex-1 overflow-y-auto px-8 py-6"
                            onSubmit={(event) => {
                                event.preventDefault()
                                mutate()
                            }}
                        >
                            <div className="space-y-6">
                                <div className="rounded-md border bg-background p-5">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold">Thông tin đơn</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Mã đơn {detail?.order_no || "-"}.
                                        </p>
                                    </div>
                                    <OrderHeaderFields value={headerFormData} onChange={setHeaderFormData} />
                                </div>

                                <OrderItemsEditor items={items} setItems={setItems} />

                                <div className="grid gap-3 md:grid-cols-3">
                                    <SummaryBox label="Số dòng hàng" value={items.length} />
                                    <SummaryBox label="Tổng SL" value={formatNumber(totalQty)} />
                                    <SummaryBox label="Tổng tiền" value={formatCurrency(totalAmount)} strong />
                                </div>
                            </div>
                        </form>

                        <DialogFooter className="border-t px-8 py-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Hủy
                            </Button>
                            <Button type="submit" form="order-update-form" disabled={isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function SummaryBox({ label, value, strong }: { label: string; value: any; strong?: boolean }) {
    return (
        <div className="rounded-md border bg-muted/20 px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={strong ? "mt-1 text-xl font-bold" : "mt-1 text-xl font-semibold"}>
                {value}
            </div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}
