import { createCrudApi } from "@/api/crud"
import type { ArLedger } from "@/features/sale/ar-ledger/data/schema"
import { apiPostMultipart } from "@/api/client"

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


export async function importArLedgers(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>(
        "/sales/ar-ledgers/import",
        formData
    )
}
