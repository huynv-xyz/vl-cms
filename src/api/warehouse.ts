
import { createCrudApi } from "@/api/crud"
import type { Warehouse } from "@/features/warehouse/data/schema"

export type WarehouseListParams = {
    page: number
    size: number
    keyword?: string
    status?: string
    physical_warehouse_id?: number
}

export type CreateWarehouseRequest = Partial<Warehouse>

export type UpdateWarehouseRequest = Warehouse

const warehouseApi = createCrudApi<
    Warehouse,
    CreateWarehouseRequest,
    UpdateWarehouseRequest,
    WarehouseListParams
>("/warehouses")

export const listWarehouses = warehouseApi.list
export const getWarehouse = warehouseApi.detail
export const createWarehouse = warehouseApi.create
export const updateWarehouse = warehouseApi.update
export const deleteWarehouse = warehouseApi.delete
