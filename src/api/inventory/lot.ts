import { createCrudApi } from "@/api/crud"
import type { InventoryLot } from "@/features/inventory/lot/data/schema"
import { apiGet, apiPostMultipart } from "../client"

export type InventoryLotListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    warehouse_id?: number
    lot_no?: string
    source_type?: string
    expiry_status?: string
    from_date?: string
    to_date?: string
    only_remaining?: boolean
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

export const listInventoryLots = inventoryLotApi.list
export const getInventoryLot = inventoryLotApi.detail
export const createInventoryLot = inventoryLotApi.create
export const updateInventoryLot = inventoryLotApi.update
export const deleteInventoryLot = inventoryLotApi.delete

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
