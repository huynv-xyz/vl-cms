import { Contract } from "../../contract/data/schema"
import { Shipment } from "../../shipment/data/schema"

export type PaymentType = "DEPOSIT" | "PAYMENT" | "FEE"

export type Payment = {
    id: number

    contract_id: number
    contract?: Contract
    shipment_id?: number

    shipment?: Shipment

    type: PaymentType
    amount: number
    exchange_rate?: number
    paid_at?: string

    note?: string

    created_at?: string
    created_by?: number
}