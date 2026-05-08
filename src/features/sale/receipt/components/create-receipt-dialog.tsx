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
import { getCashBankLedger } from "@/api/sale/cash-bank-ledger"

import { receiptSchema, receiptUiSchema } from "./receipt-form-schema"

export function CreateReceiptDialog({
    open,
    onOpenChange,
}: any) {
    const qc = useQueryClient()

    const [formData, setFormData] = useState<any>({
        order_id: undefined,
        customer_id: undefined,
        amount: 0,
        receipt_date: new Date().toISOString().slice(0, 10),
        method: "CASH",
        status: "DONE",
        note: "",
        cash_bank_ledger_id: undefined,
    })

    const orderId = formData.order_id
    const ledgerId = formData.cash_bank_ledger_id

    // ===== load order
    const { data: orderDetail } = useQuery({
        queryKey: ["order-detail", orderId],
        queryFn: () => getOrder(orderId),
        enabled: !!orderId,
    })

    // ===== load ledger
    const { data: selectedLedger } = useQuery({
        queryKey: ["ledger-detail", ledgerId],
        queryFn: () => getCashBankLedger(ledgerId),
        enabled: !!ledgerId,
    })

    const isLedgerMode = !!selectedLedger

    // ===== auto fill từ ledger
    useEffect(() => {
        if (!selectedLedger) return

        const amount =
            selectedLedger.debit_amount && selectedLedger.debit_amount > 0
                ? selectedLedger.debit_amount
                : selectedLedger.credit_amount

        setFormData((prev: any) => ({
            ...prev,
            amount: amount,
            receipt_date: selectedLedger.doc_date,
            method: "BANK",
            note: selectedLedger.description,
        }))
    }, [selectedLedger])

    // ===== clear nếu bỏ chọn ledger
    useEffect(() => {
        if (ledgerId) return

        setFormData((prev: any) => ({
            ...prev,
            amount: 0,
        }))
    }, [ledgerId])

    // ===== auto set customer theo order
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
            await qc.invalidateQueries({ queryKey: ["cash-bank-ledger"] })
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

                    {/* ===== LEDGER INFO */}
                    {selectedLedger && (
                        <div className="mb-3 p-3 border rounded bg-blue-50 text-sm">
                            <div className="font-medium mb-1">
                                Giao dịch tiền
                            </div>
                            <div>Ngày: {selectedLedger.doc_date}</div>
                            <div>
                                Số tiền:{" "}
                                {(
                                    selectedLedger.debit_amount ||
                                    selectedLedger.credit_amount
                                )?.toLocaleString()}
                            </div>
                            <div>Nội dung: {selectedLedger.description}</div>
                        </div>
                    )}

                    {/* ===== CUSTOMER */}
                    {orderDetail?.customer && (
                        <div className="mb-2 text-sm text-muted-foreground">
                            Khách hàng:{" "}
                            <b>{orderDetail.customer.name}</b>
                        </div>
                    )}

                    <Form
                        validator={rjsfValidator}
                        schema={receiptSchema}
                        uiSchema={{
                            ...receiptUiSchema,

                            amount: {
                                ...receiptUiSchema.amount,
                                "ui:disabled": isLedgerMode,
                            },

                            receipt_date: {
                                ...receiptUiSchema.receipt_date,
                                "ui:disabled": isLedgerMode,
                            },

                            method: {
                                ...receiptUiSchema.method,
                                "ui:disabled": isLedgerMode,
                            },
                        }}
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
                                ...(formData.method !== "BANK"
                                    ? { cash_bank_ledger_id: undefined }
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