import { createCrudApi } from "@/api/crud"
import { apiPostMultipart } from "@/api/client"
import type { Transaction } from "@/features/transactions/data/schema"

export type TransactionListParams = {
    page: number
    size: number
    keyword?: string
    customer_type?: string
    vthh_con?: string
    npp?: string
    process_month?: string
    hdn_status?: string
    region?: string
    document_date_from?: string
    document_date_to?: string
}

export type ImportTransactionsResponse = {
    message: string
    file_name: string
    file_path: string
    inserted: number
}

const transactionApi = createCrudApi<
    Transaction,
    never,
    { id: number },
    TransactionListParams
>("/transactions")

export const listTransactions = transactionApi.list

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
