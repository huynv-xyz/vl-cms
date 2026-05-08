import { createCrudApi } from "@/api/crud"
import { apiPost } from "@/api/client"
import type { Production } from "@/features/production/order/data/schema"

export type ProductionListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    warehouse_id?: number
    status?: string
    from_date?: string
    to_date?: string
}

export type CreateProductionRequest = {
    product_id: number
    warehouse_id: number
    production_date: string
    quantity_plan: number
    quantity_done?: number
    status?: string
}

export type UpdateProductionRequest = {
    id: number
    warehouse_id?: number
    production_date?: string
    packing_code?: string
    status?: string
    note?: string
    items?: {
        product_id?: number
        warehouse_id?: number
        quantity_plan?: number
        quantity_done?: number
        lot_no?: string
        expiry_date?: string
        note?: string
    }[]
}

// ===== CRUD =====
const productionApi = createCrudApi<
    Production,
    CreateProductionRequest,
    UpdateProductionRequest,
    ProductionListParams
>("/productions")

export const listProductions = productionApi.list
export const getProduction = productionApi.detail
export const createProduction = productionApi.create
export const updateProduction = productionApi.update
export const deleteProduction = productionApi.delete


export const generateProductionMaterials = (id: number) =>
    apiPost(`/productions/${id}/generate-materials`, {})

export const allocateProductionFifo = (id: number) =>
    apiPost(`/productions/${id}/allocate-fifo`, {})

export const confirmProduction = (id: number) =>
    apiPost(`/productions/${id}/confirm`, {})