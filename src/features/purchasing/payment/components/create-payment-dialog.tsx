import { CrudFormDialog } from "@/components/crud/crud-form-dialog"
import {
    createPayment,
    type CreatePaymentRequest,
} from "@/api/purchasing/payment"
import {
    buildPaymentUiSchema,
    paymentSchema,
} from "./payment-form-schema"
import type { PaymentFormValues } from "./types"
import { Contract } from "../../contract/data/schema"

type Props = {
    contract: Contract
    open: boolean
    onOpenChange: (open: boolean) => void
}


export function CreatePaymentDialog({
    contract,
    open,
    onOpenChange,
}: Props) {
    return (
        <CrudFormDialog<PaymentFormValues, CreatePaymentRequest, unknown>
            title="Thêm thanh toán"
            open={open}
            onOpenChange={onOpenChange}
            hideTrigger
            schema={paymentSchema}
            dialogClassName="max-h-[82vh] !w-[calc(100vw-32px)] !max-w-[760px]"

            uiSchema={buildPaymentUiSchema(contract.id)}

            defaultValues={{
                shipment_id: undefined,
                paid_at: "",
                amount: 0,
                exchange_rate: contract.exchange_rate ?? contract.currency?.exchange_rate ?? 1,
                type: "DEPOSIT",
                note: "",
            }}
            submitText="Tạo"
            loadingText="Đang tạo..."
            queryKeyToInvalidate={["payments", contract.id]}
            mutationFn={createPayment}
            mapFormToRequest={(v) => ({
                contract_id: contract.id,
                shipment_id: v.shipment_id,
                paid_at: v.paid_at,
                amount: v.amount ?? 0,
                type: v.type ?? "DEPOSIT",
                note: v.note ?? "",
            })}
        />
    )
}
