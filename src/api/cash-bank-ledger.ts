import { createCrudApi } from "@/api/crud"
import { apiPostMultipart } from "@/api/client"
import type { CashBankLedger } from "@/features/sale/cash-bank-ledger/data/schema"

// ========================
// TYPES
// ========================
export type CashBankLedgerListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateCashBankLedgerRequest = Partial<CashBankLedger>

export type UpdateCashBankLedgerRequest = CashBankLedger

// ========================
// CRUD API
// ========================
const cashBankLedgerApi = createCrudApi<
    CashBankLedger,
    CreateCashBankLedgerRequest,
    UpdateCashBankLedgerRequest,
    CashBankLedgerListParams
>("/sales/cash-bank-ledger") // 🔥 fix path

export const listCashBankLedgers = cashBankLedgerApi.list
export const getCashBankLedger = cashBankLedgerApi.detail
export const createCashBankLedger = cashBankLedgerApi.create
export const updateCashBankLedger = cashBankLedgerApi.update
export const deleteCashBankLedger = cashBankLedgerApi.delete

// ========================
// IMPORT CSV
// ========================
export async function importCashBankLedgers(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<number>(
        "/sales/cash-bank-ledger/import",
        formData
    )
}