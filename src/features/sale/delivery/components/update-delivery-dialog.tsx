import { useEffect, useRef, useState } from "react"
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

import { updateDelivery, getDelivery } from "@/api/sale/delivery"
import { getOrder } from "@/api/sale/order"

import { DeliveryItemsEditor } from "./delivery-items-editor"

import type { Delivery } from "../data/schema"
import type { DeliveryFormItem, DeliveryFormValues } from "./types"
import type { Order } from "../../order/data/schema"
import { normalizeDate } from "@/lib/utils"
import { DeliveryHeaderFields } from "./delivery-header-fields"

type Props = {
    order?: Order
    delivery: Delivery
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateDeliveryDialog({
    order,
    delivery,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const { data: detail, isLoading } = useQuery({
        queryKey: ["delivery-detail", delivery?.id],
        queryFn: () => getDelivery(delivery.id),
        enabled: open && !!delivery?.id,
    })

    const orderId = detail?.order_id

    const { data: orderDetail } = useQuery<Order>({
        queryKey: ["order-detail", orderId],
        queryFn: () => {
            if (!orderId) throw new Error("orderId undefined")
            return getOrder(orderId)
        },
        enabled: open && !!orderId,
    })

    const orderItems = orderDetail?.items ?? []

    const [headerFormData, setHeaderFormData] =
        useState<DeliveryFormValues>({
            order_id: 0,
            delivery_date: "",
            delivery_address: "",
            status: "NEW",
            note: "",
        })

    const [items, setItems] = useState<DeliveryFormItem[]>([])

    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            order_id: detail.order_id,

            delivery_date: normalizeDate(detail.delivery_date),

            company_id: detail.company_id ?? undefined,

            delivery_address: detail.delivery_address ?? "",

            status: detail.status ?? "NEW",
            note: detail.note ?? "",
        })
    }, [open, detail])

    // ========================
    // INIT ITEMS (merge order + delivery)
    // ========================
    useEffect(() => {
        if (!open || !orderDetail || !detail || initializedRef.current) return

        const existingMap = new Map(
            (detail.items ?? []).map((i: any) => [i.product_id, i])
        )

        const mapped: DeliveryFormItem[] = orderItems.map((o: any) => {
            const existing = existingMap.get(o.product_id)
            const existingQuantity = Number(existing?.quantity ?? 0)
            const remainingQuantity = Number(o.remain_quantity ?? o.quantity ?? 0)

            return {
                product_id: o.product_id,
                product: o.product,
                selected: !!existing,
                quantity: existingQuantity,
                remain_quantity: remainingQuantity + existingQuantity,
                warehouse_id: existing?.warehouse_id,
                note: existing?.note ?? "",
            }
        })

        setItems(mapped)
        initializedRef.current = true
    }, [open, orderDetail, detail, orderItems])

    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            setItems([])
        }
    }, [open])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const selectedItems = items.filter((x) => x.selected)

            if (!headerFormData.order_id) throw new Error("Vui lòng chọn đơn hàng")
            if (!headerFormData.delivery_date) throw new Error("Vui lòng chọn ngày giao")

            if (!selectedItems.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            for (const i of selectedItems) {
                if ((i.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng phải > 0")
                }
                if (!i.warehouse_id) {
                    throw new Error("Vui lòng chọn kho xuất cho từng sản phẩm")
                }
            }

            return updateDelivery({
                id: delivery.id,

                ...headerFormData,

                items: selectedItems.map((i) => ({
                    product_id: i.product_id,
                    warehouse_id: i.warehouse_id!,
                    quantity: i.quantity,
                    note: i.note ?? "",
                })),
            })
        },

        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["deliveries"],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["order-detail", orderId],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["exports"],
                }),
            ])
            toast.success("Cập nhật phiếu giao thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    // ========================
    // RENDER
    // ========================
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-5xl">
                <DialogHeader className="border-b px-8 py-6">
                    <DialogTitle>Cập nhật phiếu giao</DialogTitle>
                    <DialogDescription>
                        Điều chỉnh thông tin giao hàng và số lượng trên phiếu.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex-1 p-8 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
                ) : (
                    <>
                    <div className="flex-1 overflow-y-auto px-8 py-6">
                        <form
                            id="delivery-update-form"
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
                                    value={headerFormData}
                                    lockedOrder={!!order?.id}
                                    onChange={(next) =>
                                        setHeaderFormData(next as DeliveryFormValues)
                                    }
                                />
                            </div>

                            <DeliveryItemsEditor
                                orderItems={orderItems}
                                items={items}
                                onChange={setItems}
                            />

                        </form>
                    </div>
                    <DialogFooter className="border-t px-8 py-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" form="delivery-update-form" disabled={isPending}>
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
