import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { widgets } from "@/components/rjsf/widgets"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"

import { updateDelivery, getDelivery } from "@/api/sale/delivery"
import { getOrder } from "@/api/sale/order"

import { deliverySchema, deliveryUiSchema } from "./delivery-form-schema"
import { DeliveryItemsEditor } from "./delivery-items-editor"

import type { Delivery } from "../data/schema"
import type { DeliveryFormItem, DeliveryFormValues } from "./types"
import type { Order } from "../../order/data/schema"

type Props = {
    delivery: Delivery
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateDeliveryDialog({
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

            delivery_date: detail.delivery_date,

            warehouse_id: detail.warehouse_id ?? undefined,
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

            return {
                product_id: o.product_id,
                product: o.product,
                selected: !!existing,
                quantity: existing?.quantity ?? 0,
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

            if (!selectedItems.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            for (const i of selectedItems) {
                if ((i.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng phải > 0")
                }
            }

            return updateDelivery({
                id: delivery.id,

                ...headerFormData,

                items: selectedItems.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    note: i.note ?? "",
                })),
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["deliveries"],
            })
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
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Cập nhật phiếu giao</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-4 text-sm">Đang tải dữ liệu...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <Form
                            validator={rjsfValidator}
                            schema={deliverySchema}
                            uiSchema={deliveryUiSchema}
                            formData={headerFormData}
                            widgets={widgets}
                            templates={{
                                FieldTemplate: ShadcnFieldTemplate,
                            }}
                            onChange={({ formData }) =>
                                setHeaderFormData(formData as DeliveryFormValues)
                            }
                            onSubmit={() => mutate()}
                        >
                            <DeliveryItemsEditor
                                orderItems={orderItems}
                                items={items}
                                onChange={setItems}
                            />

                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={isPending}
                            >
                                {isPending ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </Form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}