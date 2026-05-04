
import { createCrudApi } from "@/api/crud"
import type { InventorySummary } from "@/features/inventory/summary/data/schema"

export type SummaryListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateSummaryRequest = Partial<InventorySummary>

export type UpdateSummaryRequest = InventorySummary

const summaryApi = createCrudApi<
    InventorySummary,
    CreateSummaryRequest,
    UpdateSummaryRequest,
    SummaryListParams
>("/inventory/summary")

export const listInventorySummarys = summaryApi.list
export const createInventorySummary = summaryApi.create
export const updateInventorySummary = summaryApi.update
export const deleteInventorySummary = summaryApi.delete
