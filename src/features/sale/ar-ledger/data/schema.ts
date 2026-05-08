import { Customer } from "@/features/customer/data/schema"

export type ArLedger = {
    id: number

    posting_date: string
    doc_date?: string

    doc_no: string

    customer_id: number
    customer?: Customer

    customer_name?: string

    description?: string
    account_code?: string

    debit_amount: number
    credit_amount: number

    source_type?: "EXPORT" | "RECEIPT" | "ADJUST" | "IMPORT"
    source_id?: number

    created_at: string
    updated_at?: string
}