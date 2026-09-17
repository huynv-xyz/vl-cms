import { createCrudApi } from "@/api/crud"
import { apiGet, apiPostMultipart, apiPut, type PagedResult } from "@/api/client"
import type { Transaction } from "@/features/transactions/data/schema"

export type TransactionListParams = {
    page: number
    size: number
    keyword?: string
    customer_code?: string
    customer_name?: string
    product_id?: string
    product_code?: string
    product_name?: string
    product_group_name?: string
    sale_user_name?: string
    unit?: string
    customer_type?: string
    is_gift?: string
    vthh_con?: string
    npp?: string
    process_month?: string
    hdn_status?: string
    region?: string
    time_sort?: "asc" | "desc" | string
    document_date_from?: string
    document_date_to?: string
    sale_qty_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    sale_qty_value?: string
    unit_price_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    unit_price_value?: string
    sale_revenue_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    sale_revenue_value?: string
    return_revenue_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    return_revenue_value?: string
    actual_revenue_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    actual_revenue_value?: string
    return_qty_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    return_qty_value?: string
    actual_qty_op?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | string
    actual_qty_value?: string
}

export type TransactionOptionParams = Omit<TransactionListParams, "page" | "size"> & {
    page?: number
    size?: number
    field:
        | "customer_code"
        | "customer_name"
        | "product_code"
        | "product_name"
        | "product_group_name"
        | "sale_user_name"
        | "customer_type"
        | "is_gift"
        | "region"
        | "npp"
}

export type TransactionColumnOption = {
    value: string
    label: string
}

export type ImportTransactionsResponse = {
    message: string
    file_name: string
    file_path: string
    inserted: number
}

export type TransactionUnitPriceImportPreviewRow = {
    source_row_no: number
    transaction_id?: number | null
    status: string
    message?: string | null
    document_date?: string | null
    document_no?: string | null
    customer_code?: string | null
    product_code?: string | null
    unit?: string | null
    sale_qty?: number | null
    return_qty?: number | null
    file_unit_price?: number | null
    file_sale_revenue?: number | null
    current_unit_price?: number | null
    old_revenue?: number | null
    new_unit_price?: number | null
    new_revenue?: number | null
}

export type TransactionUnitPriceImportResult = {
    applied: boolean
    total_rows: number
    matched_count: number
    updatable_count: number
    updated_count: number
    already_priced_count: number
    unmatched_count: number
    ambiguous_count: number
    out_of_scope_date_count: number
    invalid_count: number
    old_revenue_total: number
    new_revenue_total: number
    revenue_delta: number
    rows: TransactionUnitPriceImportPreviewRow[]
    message: string
}

export type TransactionSummary = {
    revenue: number
    return_revenue: number
    actual_revenue: number
    sale_qty: number
    return_qty: number
    actual_qty: number
}

const transactionApi = createCrudApi<
    Transaction,
    never,
    { id: number },
    TransactionListParams
>("/transactions")

export const listTransactions = transactionApi.list

export function getTransactionSummary(params: Omit<TransactionListParams, "page" | "size">) {
    return apiGet<TransactionSummary>("/transactions/summary", params)
}

export function listTransactionOptions(params: TransactionOptionParams) {
    return apiGet<PagedResult<TransactionColumnOption>>("/transactions/options", {
        ...params,
        limit: params.size ?? 50,
    })
}

export function importTransactionsFile(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<ImportTransactionsResponse>(
        "/transactions/import",
        formData,
        { signal: AbortSignal.timeout(120_000) }
    )
}

export const importTransactionsCsv = importTransactionsFile

export function previewTransactionUnitPriceImport(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<TransactionUnitPriceImportResult>(
        "/transactions/unit-price-import/preview",
        formData,
        { signal: AbortSignal.timeout(120_000) }
    )
}

export function applyTransactionUnitPriceImport(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<TransactionUnitPriceImportResult>(
        "/transactions/unit-price-import/apply",
        formData,
        { signal: AbortSignal.timeout(120_000) }
    )
}

export function updateTransactionUnitPrice(id: number, unitPrice: number) {
    return apiPut<Transaction>(`/transactions/${id}/unit-price`, { unitPrice })
}
