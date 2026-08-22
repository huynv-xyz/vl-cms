import { apiGet, type PagedResult } from "@/api/client"
import type { ProductionHistoryRow } from "@/features/production/history/data/schema"

export type ProductionHistoryListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    physical_warehouse_id?: number
    warehouse_id?: number
    status?: string
    from_date?: string
    to_date?: string
    completion?: string
}

export const listProductionHistory = (params: ProductionHistoryListParams) =>
    apiGet<PagedResult<ProductionHistoryRow>>("/productions/history", {
        ...params,
        limit: params.size,
    })
