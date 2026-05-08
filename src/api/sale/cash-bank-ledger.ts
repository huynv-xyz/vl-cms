import { createCrudApi } from "@/api/crud"
import {
    CashBankLedger,
    CashBankLedgerDetail,
} from "@/features/sale/cash-bank-ledger/data/schema"
import { apiGet } from "@/api/client"

// ========================
// TYPES
// ========================

export type CashBankLedgerListParams = {
    page: number
    size: number

    keyword?: string
    type?: "IN" | "OUT"

    from_date?: string
    to_date?: string
}

export type CreateCashBankLedgerRequest = Partial<CashBankLedger>
export type UpdateCashBankLedgerRequest = CashBankLedger

// ========================
// CRUD API
// ========================

const ledgerApi = createCrudApi<
    CashBankLedger,
    CreateCashBankLedgerRequest,
    UpdateCashBankLedgerRequest,
    CashBankLedgerListParams
>("/sales/cash-bank-ledger")

export const listCashBankLedgers = ledgerApi.list
export const createCashBankLedger = ledgerApi.create
export const updateCashBankLedger = ledgerApi.update
export const deleteCashBankLedger = ledgerApi.delete

// ========================
// DETAIL (GIỐNG getOrder)
// ========================

export const getCashBankLedger = (id: number) =>
    apiGet<CashBankLedgerDetail>(`/sales/cash-bank-ledger/${id}`)