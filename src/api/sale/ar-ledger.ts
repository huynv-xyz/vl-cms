import { createCrudApi } from "@/api/crud"
import type { ArLedger } from "@/features/sale/ar-ledger/data/schema"
import { apiGet, apiPostMultipart, type PagedResult } from "@/api/client"

export type ArLedgerListParams = {
    page: number
    size: number
    keyword?: string
    source_type?: string
    from_date?: string
    to_date?: string
    customer_id?: number
    order_id?: number
    export_id?: number
    doc_type?: string
}

const api = createCrudApi<
    ArLedger,
    Partial<ArLedger>,
    ArLedger,
    ArLedgerListParams
>("/sales/ar-ledgers")

export const listArLedgers = api.list
export const getArLedger = api.detail
export const createArLedger = api.create
export const updateArLedger = api.update
export const deleteArLedger = api.delete

export type ArLedgerSummary = {
    customer_id: number
    customer_code?: string
    customer_name?: string
    customer_region?: string
    opening_balance: number
    debit_amount: number
    credit_amount: number
    closing_balance: number
    // Breakdown theo nguồn phát sinh (kỳ được chọn)
    sales_amount?: number    // Doanh thu bán hàng (EXPORT debit)
    adjust_amount?: number   // Điều chỉnh công nợ (ADJUST net = debit - credit)
    payment_amount?: number  // Thanh toán (BANK + RECEIPT credit)
}

export function listArLedgerSummary(params: ArLedgerListParams) {
    return apiGet<PagedResult<ArLedgerSummary>>("/sales/ar-ledgers/summary", params)
}

export async function importArLedgers(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>(
        "/sales/ar-ledgers/import",
        formData
    )
}

export async function importBankArLedgers(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>(
        "/sales/ar-ledgers/import-bank-excel",
        formData
    )
}

export async function importOpeningArLedgers(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>(
        "/sales/ar-ledgers/import-opening-excel",
        formData
    )
}
