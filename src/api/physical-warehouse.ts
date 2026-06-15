import { createCrudApi } from "@/api/crud"

export type PhysicalWarehouse = {
    id: number
    code?: string
    name: string
    address?: string
    status?: "ACTIVE" | "INACTIVE" | string
    note?: string
    created_at?: string
    updated_at?: string
}

export type PhysicalWarehouseListParams = {
    page: number
    size: number
    keyword?: string
    status?: string
}

export type CreatePhysicalWarehouseRequest = Partial<PhysicalWarehouse>
export type UpdatePhysicalWarehouseRequest = PhysicalWarehouse

const physicalWarehouseApi = createCrudApi<
    PhysicalWarehouse,
    CreatePhysicalWarehouseRequest,
    UpdatePhysicalWarehouseRequest,
    PhysicalWarehouseListParams
>("/physical-warehouses")

export const listPhysicalWarehouses = physicalWarehouseApi.list
export const getPhysicalWarehouse = physicalWarehouseApi.detail
export const createPhysicalWarehouse = physicalWarehouseApi.create
export const updatePhysicalWarehouse = physicalWarehouseApi.update
export const deletePhysicalWarehouse = physicalWarehouseApi.delete
