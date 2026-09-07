
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
    nature?: string
    summary_status?: string
    closing_quantity_op?: string
    closing_quantity_value?: string
    opening_quantity_op?: string
    opening_quantity_value?: string
    opening_value_op?: string
    opening_value_value?: string
    inbound_quantity_op?: string
    inbound_quantity_value?: string
    inbound_value_op?: string
    inbound_value_value?: string
    outbound_quantity_op?: string
    outbound_quantity_value?: string
    outbound_value_op?: string
    outbound_value_value?: string
    avg_issue_unit_cost_op?: string
    avg_issue_unit_cost_value?: string
    closing_value_op?: string
    closing_value_value?: string
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

export type InventorySummaryOption = { value: string; label: string }

export const listInventorySummaryNatureOptions = () =>
    apiGet<InventorySummaryOption[]>("/inventory/summary/nature-options")

export const listInventorySummaryQuoteNameOptions = () =>
    apiGet<InventorySummaryOption[]>("/inventory/summary/quote-name-options")
