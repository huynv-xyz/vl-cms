import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

import { createOrder } from "@/api/sale/order"
import { orderSchema, orderUiSchema } from "./order-form-schema"
import { OrderItemsEditor } from "./order-items-editor"

export function CreateOrderDialog({ open, onOpenChange }: any) {

    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        customer_id: 0,
        employee_id: undefined,
        order_date: new Date().toISOString().slice(0, 10),
        status: "NEW",
        note: "",
    })

    const [items, setItems] = useState<any[]>([])

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

            return createOrder({
                ...formData,
                items,
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Tạo đơn thành công")
            onOpenChange(false)
            setItems([])
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] flex-col sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Tạo đơn hàng</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">

                    <Form
                        validator={rjsfValidator}
                        schema={orderSchema}
                        uiSchema={orderUiSchema}
                        formData={formData}
                        widgets={widgets}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        onChange={({ formData }) => setFormData(formData)}
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
                            {isPending ? "Đang tạo..." : "Tạo đơn"}
                        </Button>
                    </Form>

                </div>
            </DialogContent>
        </Dialog>
    )
}