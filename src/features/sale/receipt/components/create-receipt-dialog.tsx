import { useEffect, useState } from "react"
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

import { createReceipt } from "@/api/sale/receipt"
import { getOrder } from "@/api/sale/order"

import { receiptSchema, receiptUiSchema } from "./receipt-form-schema"

export function CreateReceiptDialog({ open, onOpenChange }: any) {
    const qc = useQueryClient()

    const [formData, setFormData] = useState<any>({
        order_id: undefined,
        customer_id: undefined,
        amount: 0,
        receipt_date: new Date().toISOString().slice(0, 10),
        method: "CASH",
        status: "DONE",
        note: "",
    })

    const orderId = formData.order_id

    const { data: orderDetail } = useQuery({
        queryKey: ["order-detail", orderId],
        queryFn: () => getOrder(orderId),
        enabled: !!orderId,
    })

    // ===== auto set customer
    useEffect(() => {
        if (!orderDetail) return

        setFormData((prev: any) => ({
            ...prev,
            customer_id: orderDetail.customer_id,
        }))
    }, [orderDetail])

    // ===== create
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.order_id) {
                throw new Error("Chưa chọn đơn hàng")
            }

            if ((formData.amount ?? 0) <= 0) {
                throw new Error("Số tiền phải > 0")
            }

            return createReceipt({
                ...formData,
                customer_id: orderDetail?.customer_id,
            })
        },

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["receipts"] })
            toast.success("Tạo phiếu thu thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tạo phiếu thu</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">

                    {orderDetail?.customer && (
                        <div className="mb-2 text-sm text-muted-foreground">
                            Khách hàng:{" "}
                            <b>{orderDetail.customer.name}</b>
                        </div>
                    )}

                    <Form
                        validator={rjsfValidator}
                        schema={receiptSchema}
                        uiSchema={receiptUiSchema}
                        formData={formData}
                        widgets={widgets}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        onChange={({ formData }) => {
                            const isOrderChanged =
                                formData.order_id !== orderId

                            setFormData((prev: any) => ({
                                ...prev,
                                ...formData,
                                ...(isOrderChanged
                                    ? { customer_id: undefined }
                                    : {}),
                            }))
                        }}
                        onSubmit={() => mutate()}
                    >
                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={isPending}
                        >
                            {isPending ? "Đang tạo..." : "Tạo phiếu thu"}
                        </Button>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}