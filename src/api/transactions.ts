import { createCrudApi } from "@/api/crud"
import { apiGet, apiPostMultipart, type PagedResult } from "@/api/client"
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
    customer_type?: string
    vthh_con?: string
    npp?: string
    process_month?: string
    hdn_status?: string
    region?: string
    document_date_from?: string
    document_date_to?: string
}

export type TransactionOptionParams = Omit<TransactionListParams, "page" | "size"> & {
    page?: number
    size?: number
    field: "customer_code" | "customer_name" | "product_code" | "product_name"
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

export type TransactionSummary = {
    revenue: number
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
