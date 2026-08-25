import { apiGet, apiPost, type PagedResult } from "@/api/client"
import { createCrudApi } from "@/api/crud"
import type {
    SalesActual,
    SalesActualItem,
} from "@/features/sales-actual/data/schema"

export type SalesActualListParams = {
    page: number
    size: number
    keyword?: string
    period?: number
    year?: number
    employeeId?: number
}

export type CreateSalesActualRequest = Partial<SalesActual>

export type UpdateSalesActualRequest = SalesActual

const salesActualCrudApi = createCrudApi<
    SalesActual,
    CreateSalesActualRequest,
    UpdateSalesActualRequest,
    SalesActualListParams
>("/salary/sales-actuals")

export function listSalesActuals(params: SalesActualListParams) {
    return apiGet<PagedResult<SalesActualItem>>("/salary/sales-actuals", params)
}

export type SalesActualPeriodSyncResult = {
    period: string
    source_rows: number
    missing_employees: number
    deleted: number
    inserted: number
}

export type SalesActualYearSyncResult = {
    year: number
    synced_months: number
    source_rows: number
    missing_employees: number
    deleted: number
    inserted: number
}

export type SalesActualSyncResult = SalesActualPeriodSyncResult | SalesActualYearSyncResult

export function syncSalesActualsFromTransactions(period: string) {
    return apiPost<SalesActualPeriodSyncResult>(
        `/salary/sales-actuals/sync/${period}`,
        undefined,
    )
}

export function syncSalesActualsYearFromTransactions(year: number) {
    return apiPost<SalesActualYearSyncResult>(`/salary/sales-actuals/sync-year/${year}`, undefined)
}

export const getSalesActual = salesActualCrudApi.detail
