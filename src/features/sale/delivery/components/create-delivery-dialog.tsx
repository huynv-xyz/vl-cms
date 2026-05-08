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

import { createDelivery } from "@/api/sale/delivery"
import { getOrder } from "@/api/sale/order"

import { deliverySchema, deliveryUiSchema } from "./delivery-form-schema"
import { DeliveryItemsEditor } from "./delivery-items-editor"
import type { DeliveryFormItem } from "./types"

export function CreateDeliveryDialog({ open, onOpenChange }: any) {

    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const [formData, setFormData] = useState<any>({
        order_id: undefined,
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
            note: "",
        }))
    }, [orderDetail])

    const [items, setItems] = useState<DeliveryFormItem[]>([])

    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            return
        }
    }, [open])

    useEffect(() => {
        if (!open || !orderId || initializedRef.current || isLoading) return

        setItems(mappedItems)
        initializedRef.current = true
    }, [open, orderId, isLoading, mappedItems])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {

            const selectedItems = items.filter(x => x.selected)

            if (!selectedItems.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
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
            <DialogContent className="flex h-[90vh] flex-col sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Tạo phiếu giao</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">

                    <Form
                        validator={rjsfValidator}
                        schema={deliverySchema}
                        uiSchema={deliveryUiSchema}
                        formData={formData}
                        widgets={widgets}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        onChange={({ formData }) => {
                            setFormData(formData)
                            initializedRef.current = false
                        }}
                        onSubmit={() => mutate()}
                    >
                        {!orderId ? (
                            <div>Chọn đơn hàng để hiển thị sản phẩm</div>
                        ) : isLoading ? (
                            <div>Đang tải sản phẩm...</div>
                        ) : (
                            <DeliveryItemsEditor
                                orderItems={orderDetail?.items ?? []}
                                items={items}
                                warehouseId={warehouseId}
                                onChange={setItems}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={isPending}
                        >
                            {isPending ? "Đang tạo..." : "Tạo phiếu giao"}
                        </Button>
                    </Form>

                </div>
            </DialogContent>
        </Dialog>
    )
}