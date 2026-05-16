import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

import { createDelivery } from "@/api/sale/delivery"
import { getOrder } from "@/api/sale/order"

import { DeliveryItemsEditor } from "./delivery-items-editor"
import type { DeliveryFormItem } from "./types"
import { DeliveryHeaderFields } from "./delivery-header-fields"

export function CreateDeliveryDialog({ order, open, onOpenChange }: any) {
    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const [formData, setFormData] = useState<any>({
        order_id: order?.id, // FIX
        delivery_date: new Date().toISOString().slice(0, 10),
        status: "NEW",
        note: "",
        delivery_address: "",
    })

    const orderId = formData.order_id
    const warehouseId = formData.warehouse_id

    const { data: orderDetail, isLoading } = useQuery({
        queryKey: ["order-detail", orderId],
        queryFn: () => getOrder(orderId),
        enabled: open && !!orderId,
    })

    const mappedItems: DeliveryFormItem[] = useMemo(() => {
        if (!orderDetail?.items) return []

        return orderDetail.items.map((i: any) => ({
            product_id: i.product_id,
            product: i.product,
            selected: false,
            quantity: 0,
            remain_quantity: i.remain_quantity ?? i.quantity,
            note: "",
        }))
    }, [orderDetail])

    const [items, setItems] = useState<DeliveryFormItem[]>([])

    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            return
        }

        if (order?.id) {
            setFormData((current: any) => ({
                ...current,
                order_id: order.id,
            }))
        }
    }, [open])

    useEffect(() => {
        if (!open || !orderId || initializedRef.current || isLoading) return

        setItems(mappedItems)
        initializedRef.current = true
    }, [open, orderId, isLoading, mappedItems])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {

            if (!formData.order_id) throw new Error("Vui lòng chọn đơn hàng")
            if (!formData.delivery_date) throw new Error("Vui lòng chọn ngày giao")
            if (!formData.warehouse_id) throw new Error("Vui lòng chọn kho xuất")

            const selectedItems = items.filter(x => x.selected)

            if (!selectedItems.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            for (const item of selectedItems) {
                if ((item.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng giao phải > 0")
                }
            }

            return createDelivery({
                ...formData,
                items: selectedItems.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    note: i.note ?? "",
                })),
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            toast.success("Tạo phiếu giao thành công")
            onOpenChange(false)
            setItems([])
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-5xl">
                <DialogHeader className="border-b px-8 py-6">
                    <DialogTitle>Tạo phiếu giao</DialogTitle>
                    <DialogDescription>
                        Chọn kho, ngày giao và các sản phẩm cần giao từ đơn hàng.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <form
                        id="delivery-create-form"
                        className="space-y-6"
                        onSubmit={(event) => {
                            event.preventDefault()
                            mutate()
                        }}
                    >
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <div className="mb-4">
                                <div className="text-base font-semibold">Thông tin giao hàng</div>
                                <div className="text-sm text-muted-foreground">
                                    Chọn đơn hàng, kho xuất và thông tin giao cho phiếu.
                                </div>
                            </div>
                            <DeliveryHeaderFields
                                value={formData}
                                lockedOrder={!!order?.id}
                                onChange={(next) => {
                                    const orderChanged = next.order_id !== formData.order_id
                                    setFormData(next)
                                    if (orderChanged) {
                                        initializedRef.current = false
                                        setItems([])
                                    }
                                }}
                            />
                        </div>

                        {!orderId ? (
                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                Chọn đơn hàng để hiển thị sản phẩm cần giao.
                            </div>
                        ) : isLoading ? (
                            <div className="rounded-lg border p-8 text-center text-muted-foreground">
                                Đang tải sản phẩm...
                            </div>
                        ) : (
                            <DeliveryItemsEditor
                                orderItems={orderDetail?.items ?? []}
                                items={items}
                                warehouseId={warehouseId}
                                onChange={setItems}
                            />
                        )}
                    </form>

                </div>

                <DialogFooter className="border-t px-8 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="submit" form="delivery-create-form" disabled={isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Đang tạo..." : "Tạo phiếu giao"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
