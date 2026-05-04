import { createCrudApi } from "@/api/crud"
import type { InventoryLot } from "@/features/inventory/lot/data/schema"

export type InventoryLotListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    warehouse_id?: number
    lot_no?: string
    source_type?: string
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