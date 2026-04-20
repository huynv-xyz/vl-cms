import { createCrudApi } from "@/api/crud"
import { Warehouse } from "@/features/warehouse/data/schema"


export type WarehouseListParams = {
    page: number
    size: number
    keyword?: string
}

export type CreateWarehouseRequest = {
    name: string
    address?: string
}

export type UpdateWarehouseRequest = {
    id: number
    name?: string
    address?: string
}

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