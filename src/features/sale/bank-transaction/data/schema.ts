import { Customer } from "@/features/customer/data/schema"
import { Receipt } from "../../receipt/data/schema"

export type BankTransaction = {
    id: number

    // ===== core
    txn_date: string
    amount: number

    // ===== bank info
    description?: string
    reference_no?: string
    bank_account?: string

    // ===== raw
    customer_name?: string

    // ===== system
    customer_id?: number

    // ===== matching
    matched?: boolean
    receipt_id?: number

    // ===== relations (builder trả về)
    customer?: Customer

    receipt?: Receipt

    // ===== derived (optional FE)
    status?: "NEW" | "MATCHED" | "DONE"

    // ===== audit
    created_at?: string
    updated_at?: string
}