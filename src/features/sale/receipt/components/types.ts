import { Order } from "../../order/data/schema"
import { Customer } from "@/features/customer/data/schema"

export type Receipt = {
    id: number
    order_id: number
    customer_id: number

    order?: Order
    customer?: Customer

    amount: number
    receipt_date: string

    method: string
    status: string
    note?: string
}