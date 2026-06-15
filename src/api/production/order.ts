import { createCrudApi } from "@/api/crud"
import { apiDelete, apiGet, apiPost, apiPut } from "@/api/client"
import type { Production } from "@/features/production/order/data/schema"

export type ProductionListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    warehouse_id?: number
    physical_warehouse_id?: number
    status?: string
    from_date?: string
    to_date?: string
}

export type CreateProductionRequest = {
    physical_warehouse_id: number
    warehouse_id?: number
    production_date: string
    packing_code?: string
    note?: string
    items: {
        product_id?: number
        warehouse_id?: number
        quantity_plan?: number
        quantity_done?: number
        lot_no?: string
        expiry_date?: string
        note?: string
    }[]
}

export type UpdateProductionRequest = {
    id: number
    physical_warehouse_id?: number
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

export const getProductionDetail = (id: number) =>
    apiGet<Production>(`/productions/${id}/detail`)

export const generateProductionMaterials = (id: number) =>
    apiPost<Production>(`/productions/${id}/generate-materials`, {})

export const allocateProductionFifo = (id: number) =>
    apiPost<Production>(`/productions/${id}/allocate-fifo`, {})

export type ConfirmProductionRequest = {
    outputs?: {
        production_item_id?: number
        output_id?: number
        lot_no?: string
        expiry_date?: string
        note?: string
    }[]
}

export const confirmProduction = (
    id: number,
    body: ConfirmProductionRequest = {}
) => apiPost<Production>(`/productions/${id}/confirm`, body)

export const issueProductionMaterials = (id: number) =>
    apiPost<Production>(`/productions/${id}/issue-materials`, {})

export const receiveProductionProducts = (
    id: number,
    body: ConfirmProductionRequest = {}
) => apiPost<Production>(`/productions/${id}/receive-products`, body)

export const cancelProduction = (id: number) =>
    apiPost<Production>(`/productions/${id}/cancel`, {})

/**
 * BA Spec BR-06.2 / BR-06.3 / US-06:
 * Đảo lệnh đã ghi sổ (UNPOST). Hệ thống sẽ:
 *  - Hoàn nguyên tồn lô (xóa cost_layer + cost_consumption phái sinh)
 *  - Đặt LSX về MATERIAL_GENERATED (cho phép sửa rồi POST lại)
 *  - Ghi audit log đầy đủ before/after.
 * Backend endpoint: POST /productions/{id}/unpost
 */
export const unpostProduction = (id: number, reason?: string) =>
    apiPost<Production>(`/productions/${id}/unpost`, { reason })

export type SaveProductionMaterialRequest = {
    production_item_id?: number
    product_id?: number
    warehouse_id?: number
    material_type?: string
    quantity_per_unit?: number
    quantity?: number
    note?: string
}

export const addProductionMaterial = (
    id: number,
    body: SaveProductionMaterialRequest
) => apiPost<Production>(`/productions/${id}/materials`, body)

export const updateProductionMaterial = (
    id: number,
    materialId: number,
    body: SaveProductionMaterialRequest
) => apiPut<Production>(`/productions/${id}/materials/${materialId}`, body)

export const deleteProductionMaterial = (id: number, materialId: number) =>
    apiDelete<Production>(`/productions/${id}/materials/${materialId}`)

export type SetPreferredLotRequest = {
    lot_id?: number
    lot_no?: string
}

export const setProductionPreferredLot = (
    id: number,
    materialId: number,
    body: SetPreferredLotRequest
) => apiPut<Production>(`/productions/${id}/materials/${materialId}/preferred-lot`, body)
