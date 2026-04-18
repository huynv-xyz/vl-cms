import { apiGet, type PagedResult } from "@/api/client"
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

export const getSalesActual = salesActualCrudApi.detail