
import { createCrudApi } from "@/api/crud"
import type { SalesTarget } from "@/features/sales-target/data/schema"

export type SalesTargetListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateSalesTargetRequest = Partial<SalesTarget>

export type UpdateSalesTargetRequest = SalesTarget

const salesTargetApi = createCrudApi<
    SalesTarget,
    CreateSalesTargetRequest,
    UpdateSalesTargetRequest,
    SalesTargetListParams
>("/salary/sales-targets")

export const listSalesTargets = salesTargetApi.list
export const createSalesTarget = salesTargetApi.create
export const updateSalesTarget = salesTargetApi.update
export const deleteSalesTarget = salesTargetApi.delete
