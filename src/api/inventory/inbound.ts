import { createCrudApi } from "@/api/crud"
import type { InventoryInbound } from "@/features/inventory/inbound/data/schema"

export type InventoryInboundListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    warehouse_id?: number
    source_type?: string
    from_date?: string
    to_date?: string
}

export type CreateInventoryInboundRequest = {
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

export type UpdateInventoryInboundRequest =
    CreateInventoryInboundRequest & {
        id: number
    }

const inventoryInboundApi = createCrudApi<
    InventoryInbound,
    CreateInventoryInboundRequest,
    UpdateInventoryInboundRequest,
    InventoryInboundListParams
>("/inventory/lots")

export const listInventoryInbounds = inventoryInboundApi.list
export const getInventoryInbound = inventoryInboundApi.detail
export const createInventoryInbound = inventoryInboundApi.create
export const updateInventoryInbound = inventoryInboundApi.update
export const deleteInventoryInbound = inventoryInboundApi.delete