import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
import { toast } from "sonner"

import { widgets } from "@/components/rjsf/widgets"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"

import { updateOrder, getOrder } from "@/api/sale/order"

import { orderSchema, orderUiSchema } from "./order-form-schema"
import { OrderItemsEditor } from "./order-items-editor"

import type { Order } from "../data/schema"
import { normalizeDate } from "@/lib/utils"

type Props = {
    order: Order
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateOrderDialog({
    order,
    open,
    onOpenChange,
}: Props) {

    const queryClient = useQueryClient()

    // ========================
    // LOAD DETAIL
    // ========================
    const { data: detail, isLoading } = useQuery({
        queryKey: ["order-detail", order?.id],
        queryFn: () => getOrder(order.id),
        enabled: open && !!order?.id,
    })

    // ========================
    // STATE
    // ========================
    const [headerFormData, setHeaderFormData] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])

    // ========================
    // INIT DATA
    // ========================
    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            customer_id: detail.customer_id ?? undefined,
            employee_id: detail.employee_id ?? undefined,
            order_date: normalizeDate(detail.order_date), // 🔥 FIX
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

    // ========================
    // MUTATION
    // ========================
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {

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

    // ========================
    // RENDER
    // ========================
    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    setHeaderFormData(null) // reset
                    setItems([])
                }
                onOpenChange(v)
            }}
        >
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col sm:max-w-5xl">

                <DialogHeader>
                    <DialogTitle>Cập nhật đơn hàng</DialogTitle>
                </DialogHeader>

                {isLoading || !headerFormData ? (
                    <div className="p-4 text-sm">Đang tải dữ liệu...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">

                        <Form
                            key={detail?.id} // 🔥 FIX RJSF KHÔNG REFRESH
                            validator={rjsfValidator}
                            schema={orderSchema}
                            uiSchema={orderUiSchema}
                            formData={headerFormData}
                            widgets={widgets}
                            templates={{
                                FieldTemplate: ShadcnFieldTemplate,
                            }}
                            onChange={({ formData }) =>
                                setHeaderFormData(formData)
                            }
                            onSubmit={() => mutate()}
                        >

                            <OrderItemsEditor
                                items={items}
                                setItems={setItems}
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