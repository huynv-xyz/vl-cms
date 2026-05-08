import { createCrudApi } from "@/api/crud"
import { BankTransaction } from "@/features/sale/bank-transaction/data/schema"
// ========================
// TYPES
// ========================

export type BankTransactionListParams = {
    page: number
    size: number

    keyword?: string
    type?: "IN" | "OUT"
    status?: "NEW" | "MATCHED" | "DONE"

    from_date?: string
    to_date?: string
}

export type CreateBankTransactionRequest = {
    txn_date: string
    amount: number

    description?: string
    reference_no?: string
    bank_account?: string

    customer_name?: string
    customer_id?: number
}

export type UpdateBankTransactionRequest = {
    id: number

    txn_date?: string
    amount?: number

    description?: string
    reference_no?: string
    bank_account?: string

    customer_name?: string
    customer_id?: number
}

// ========================
// CRUD API
// ========================

const bankTxnApi = createCrudApi<
    BankTransaction,
    CreateBankTransactionRequest,
    UpdateBankTransactionRequest,
    BankTransactionListParams
>("/sales/bank-transactions")

export const listBankTransactions = bankTxnApi.list
export const getBankTransaction = bankTxnApi.detail
export const createBankTransaction = bankTxnApi.create
export const updateBankTransaction = bankTxnApi.update
export const deleteBankTransaction = bankTxnApi.delete

export async function matchBankTransaction(
    id: number,
    customer_id: number
) {
    const res = await fetch(`/sales/bank-transactions/${id}/match`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer_id }),
    })

    return res.json()
}