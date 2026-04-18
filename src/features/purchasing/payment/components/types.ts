import { PaymentType } from "../data/schema"

export type PaymentFormValues = {
    shipment_id?: number
    type: PaymentType
    amount: number
    exchange_rate?: number
    paid_at: string
    note?: string
}