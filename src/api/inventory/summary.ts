
import { createCrudApi } from "@/api/crud"
import { apiGet, type PagedResult } from "@/api/client"
import type { InventorySummary } from "@/features/inventory/summary/data/schema"

export type SummaryListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    product_ids?: string
    warehouse_id?: number
    warehouse_ids?: string
    physical_warehouse_id?: number
    from_date?: string
    to_date?: string
    product_text?: string
    product_text_op?: string
    product_code_text?: string
    product_code_text_op?: string
    product_name_text?: string
    product_name_text_op?: string
    warehouse_code_text?: string
    warehouse_code_text_op?: string
    warehouse_name_text?: string
    warehouse_name_text_op?: string
    quote_text?: string
    quote_text_op?: string
    unit?: string
    summary_status?: string
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

export const listInventorySummaryForSales = (params: SummaryListParams) =>
    apiGet<PagedResult<InventorySummary> & { totals?: Record<string, number> }>("/inventory/summary/sales", params)
