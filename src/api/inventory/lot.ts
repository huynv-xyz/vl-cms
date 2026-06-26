import { createCrudApi } from "@/api/crud"
import type { InventoryLot } from "@/features/inventory/lot/data/schema"
import { apiGet, apiPostMultipart, type PagedResult } from "../client"

export type LotTextFilterOp = "contains" | "equals" | "not_equals" | "not_contains"

export type InventoryLotListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    product_ids?: string
    warehouse_id?: number
    warehouse_ids?: string
    lot_no?: string
    source_type?: string
    expiry_status?: string
    from_date?: string
    to_date?: string
    only_remaining?: boolean
    product_text?: string
    product_text_op?: LotTextFilterOp
    product_code_text?: string
    product_code_text_op?: LotTextFilterOp
    product_name_text?: string
    product_name_text_op?: LotTextFilterOp
    warehouse_code_text?: string
    warehouse_code_text_op?: LotTextFilterOp
    warehouse_name_text?: string
    warehouse_name_text_op?: LotTextFilterOp
    quote_text?: string
    quote_text_op?: LotTextFilterOp
    unit?: string
    lot_text?: string
    lot_text_op?: LotTextFilterOp
    lot_warning?: string
}

export type InventoryLotTotals = {
    lot_count: number
    warning_count: number
    expired_count: number
    near_expiry_count: number
    stale_count: number
    opening_quantity: number
    opening_value: number
    inbound_quantity: number
    inbound_value: number
    outbound_quantity: number
    outbound_value: number
    closing_quantity: number
    closing_value: number
}

export type CreateInventoryLotRequest = {
    product_id: number
    warehouse_id: number
    inbound_date: string

    lot_no?: string
    source_type: string
    source_id?: number
    source_no?: string

    quantity_in: number
    unit_cost: number
}

export type UpdateInventoryLotRequest =
    Partial<CreateInventoryLotRequest> & {
        id: number
    }

export type StockRow = {
    product_id: number
    quantity: number
}

export type OpeningStockImportResult = {
    success: number
    failed: number
    skipped?: number
    errors: {
        row: number
        message: string
    }[]
}

const inventoryLotApi = createCrudApi<
    InventoryLot,
    CreateInventoryLotRequest,
    UpdateInventoryLotRequest,
    InventoryLotListParams
>("/inventory/lots")

export const listInventoryLots = (params: InventoryLotListParams) => {
    return apiGet<PagedResult<InventoryLot>>("/inventory/lots/report", {
        ...params,
        limit: params.size,
    })
}
export const getInventoryLot = inventoryLotApi.detail
export const createInventoryLot = inventoryLotApi.create
export const updateInventoryLot = inventoryLotApi.update
export const deleteInventoryLot = inventoryLotApi.delete

export function getInventoryLotTotals(params: Omit<InventoryLotListParams, "page" | "size">) {
    return apiGet<InventoryLotTotals>("/inventory/lots/totals", params)
}

export async function getStockLots(params: {
    warehouse_id?: number
    product_ids: number[]
}) {
    const query = new URLSearchParams()
    if (params.warehouse_id != null) {
        query.set("warehouse_id", String(params.warehouse_id))
    }
    params.product_ids.forEach((productId) => {
        query.append("product_ids", String(productId))
    })

    return apiGet<StockRow[]>(`/inventory/lots/stock?${query}`)
}

export async function importOpeningStock(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<OpeningStockImportResult>(
        "/inventory/lots/opening/import-csv",
        formData
    )
}

export async function importPurchaseStock(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<OpeningStockImportResult>(
        "/inventory/lots/purchase/import-csv",
        formData
    )
}

export async function importVthhDetail(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<OpeningStockImportResult>(
        "/inventory/lots/vthh-detail/import-csv",
        formData
    )
}
