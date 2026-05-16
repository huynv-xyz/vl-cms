import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
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

import { widgets } from "@/components/rjsf/widgets"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"

import { updateReceipt, getReceipt } from "@/api/sale/receipt"
import { getOrder } from "@/api/sale/order"

import { receiptSchema, receiptUiSchema } from "./receipt-form-schema"

export function UpdateReceiptDialog({ receipt, open, onOpenChange }: any) {

    const qc = useQueryClient()

    // ===== load receipt
    const { data, isLoading } = useQuery({
        queryKey: ["receipt-detail", receipt?.id],
        queryFn: () => getReceipt(receipt.id),
        enabled: open && !!receipt?.id,
    })

    // ===== form state
    const [formData, setFormData] = useState<any>({})

    // ===== init data
    useEffect(() => {
        if (!open || !data) return

        setFormData({
            order_id: data.order_id,
            customer_id: data.customer_id,
            amount: data.amount,
            receipt_date: data.receipt_date,
            method: data.method,
            status: data.status,
            note: data.note ?? "",
        })
    }, [open, data])

    const orderId = formData.order_id

    // ===== load order detail (GIỐNG CREATE)
    const { data: orderDetail } = useQuery({
        queryKey: ["order-detail", orderId],
        queryFn: () => getOrder(orderId),
        enabled: !!orderId,
    })

    // ===== auto set customer (GIỐNG CREATE)
    useEffect(() => {
        if (!orderDetail) return

        setFormData((prev: any) => ({
            ...prev,
            customer_id: orderDetail.customer_id,
        }))
    }, [orderDetail])

    // ===== update
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {

            if (!formData.order_id) {
                throw new Error("Chưa chọn đơn hàng")
            }

            if ((formData.amount ?? 0) <= 0) {
                throw new Error("Số tiền phải > 0")
            }

            return updateReceipt({
                id: receipt.id,
                ...formData,
                customer_id: orderDetail?.customer_id, // 👈 luôn lấy từ order
            })
        },

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["receipts"] })
            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[88vh] flex-col p-0 sm:max-w-[820px]">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Cập nhật phiếu thu</DialogTitle>
                    <DialogDescription>
                        Điều chỉnh thông tin thanh toán đã ghi nhận.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* ===== SHOW CUSTOMER NAME */}
                    {orderDetail?.customer && (
                        <div className="mb-2 text-sm text-muted-foreground">
                            Khách hàng:{" "}
                            <b>{orderDetail.customer.name}</b>
                        </div>
                    )}

                    {isLoading ? (
                        <div>Đang tải...</div>
                    ) : (
                        <Form
                            id="receipt-update-form"
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
                            className="[&>div:first-child]:grid [&>div:first-child]:gap-x-5 md:[&>div:first-child]:grid-cols-2"
                        >
                            <></>
                        </Form>
                    )}
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="submit" form="receipt-update-form" disabled={isPending || isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
