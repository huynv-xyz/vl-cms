import { Order } from "../../order/data/schema"
import { Export } from "../../export/data/schema"
import { Product } from "@/features/product/data/schema"
import { Customer } from "@/features/customer/data/schema"

export type ArLedger = {
    id: number

    posting_date: string
    customer_id: number
    customer?: Customer

    doc_type: string
    doc_no: string

    order_id?: number
    order?: Order

    export_id?: number
    export?: Export

    product_id?: number
    product?: Product

    quantity?: number

    debit_amount: number
    credit_amount: number

    created_at: string
}