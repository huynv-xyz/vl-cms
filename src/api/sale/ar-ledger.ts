// api/sale/ar-ledger.ts
import { createCrudApi } from "@/api/crud"
import type { ArLedger } from "@/features/sale/ar-ledger/data/schema"

export type ArLedgerListParams = {
    page: number
    size: number
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