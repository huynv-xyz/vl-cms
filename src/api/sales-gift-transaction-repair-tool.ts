import { apiPost } from "@/api/client"

export type GiftTransactionRepairRow = {
    id: number
    document_no: string
    product_code: string
    quantity: number
    unit_price: number
    revenue: number
    discount: number
    vat_amount: number
    old_source_item_id: number | null
    source_item_id: number | null
    order_item_id: number | null
    document_date: string | null
    reason: string | null
}

export type GiftTransactionRepairResult = {
    applied: boolean
    total: number
    repairable: number
    unresolved: number
    updated: number
    revenue_reduction: number
    token: string
    rows: GiftTransactionRepairRow[]
    years: number[]
}

const base = "/tools/sales-gift-transaction-repair"

export const checkGiftTransactions = () =>
    apiPost<GiftTransactionRepairResult>(`${base}/check`, {})

export const applyGiftTransactionRepair = (token: string) =>
    apiPost<GiftTransactionRepairResult>(`${base}/apply`, { token })
