import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    updatePayment,
    type UpdatePaymentRequest,
} from "@/api/purchasing/payment"
import {
    buildPaymentUiSchema,
    paymentSchema,
} from "./payment-form-schema"
import type { PaymentFormValues } from "./types"
import { Payment } from "../data/schema"
import { shipmentOption } from "@/lib/option-mapper"

type Props = {
    payment: Payment
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdatePaymentDialog({
    payment,
    open,
    onOpenChange,
}: Props) {
    if (!payment) return null

    const initialShipment = payment.shipment
        ? shipmentOption(payment.shipment)
        : payment.shipment_id
            ? {
                value: payment.shipment_id,
                label: `Shipment #${payment.shipment_id}`,
            }
            : undefined

    return (
        <CrudFormDialog<PaymentFormValues, UpdatePaymentRequest, unknown>
            title="Cập nhật thanh toán"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={paymentSchema}
            uiSchema={buildPaymentUiSchema(payment.shipment?.contract_id, initialShipment)}
            defaultValues={{
                shipment_id: payment.shipment_id,
                paid_at: payment.paid_at || "",
                amount: payment.amount ?? 0,
                exchange_rate: payment.exchange_rate ?? 1,
                type: payment.type ?? "DEPOSIT",
                note: payment.note || "",
            }}
            submitText="Lưu"
            loadingText="Đang lưu..."
            queryKeyToInvalidate={["payments", payment.contract_id]}
            mutationFn={updatePayment}
            mapFormToRequest={(v) => ({
                id: payment.id,
                contract_id: payment.contract_id,
                shipment_id: v.shipment_id,
                paid_at: v.paid_at,
                amount: v.amount ?? 0,
                exchange_rate: v.exchange_rate ?? 1,
                type: v.type ?? "DEPOSIT",
                note: v.note ?? "",
            })}
        />
    )
}