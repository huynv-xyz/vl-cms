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
    production_time?: string
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
    production_time?: string
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

// Lui 1 buoc trong luong xu ly san xuat truoc khi nhap TP:
// MATERIAL_ISSUED -> FIFO_ALLOCATED -> MATERIAL_GENERATED.
// Khong lui qua MATERIAL_GENERATED de tranh xoa vat tu da sinh.
export const unpostProduction = (id: number, reason?: string) =>
    apiPost<Production>(`/productions/${id}/unpost`, { reason })

export type ChangeProductionDateRequest = {
    production_date: string
    production_time?: string
}

export type ProductionDateChangeResult = {
    success: boolean
    message?: string
    production_id?: number
    production_no?: string
    old_date?: string
    new_date?: string
    status?: string
    fifo_reallocated?: boolean
    issue_voucher_updated?: boolean
    receive_voucher_updated?: boolean
    allocation_rows?: number
    warnings?: string[]
    details?: ProductionDateChangeDetail[]
}

export type ProductionDateChangeDetail = {
    type?: string
    product_code?: string
    product_name?: string
    warehouse_code?: string
    warehouse_name?: string
    lot_code?: string
    input_qty?: number
    outbound_qty_before_new_date?: number
    first_outbound_date?: string
    message?: string
    required_qty?: number
    available_qty?: number
    negative_date?: string
    balance_before?: number
    quantity_in?: number
    quantity_out?: number
    balance_after?: number
    voucher_no?: string
    doc_type?: string
}

export const checkProductionDateChange = (
    id: number,
    body: ChangeProductionDateRequest
) => apiPost<ProductionDateChangeResult>(`/productions/${id}/change-date/check`, body)

export const changeProductionDate = (
    id: number,
    body: ChangeProductionDateRequest
) => apiPost<ProductionDateChangeResult>(`/productions/${id}/change-date`, body)

export type AdjustProductionRequest = {
    warehouse_id?: number
    items: {
        product_id?: number
        warehouse_id?: number
        quantity_plan?: number
        quantity_done?: number
        lot_no?: string
        expiry_date?: string
        note?: string
        materials?: {
            product_id?: number
            original_product_id?: number
            warehouse_id?: number
            material_type?: string
            source_type?: string
            source_ref_id?: number
            bom_item_id?: number
            quantity_per_unit?: number
            quantity_original?: number
            quantity?: number
            lot_id?: number
            lot_no?: string
            note?: string
        }[]
    }[]
}

export type ProductionAdjustmentResult = {
    success: boolean
    message?: string
    production_id?: number
    production_no?: string
    production_date?: string
    status?: string
    issue_voucher_found?: boolean
    receive_voucher_found?: boolean
    allocation_rows?: number
    details?: ProductionAdjustmentDetail[]
}

export type ProductionAdjustmentDetail = {
    type?: string
    category?: string
    status?: string
    message?: string
    product_code?: string
    product_name?: string
    warehouse_code?: string
    lot_code?: string
    quantity?: number
    available_quantity?: number
}

export const checkProductionAdjustment = (
    id: number,
    body: AdjustProductionRequest
) => apiPost<ProductionAdjustmentResult>(`/productions/${id}/adjust/check`, body)

export const adjustProduction = (
    id: number,
    body: AdjustProductionRequest
) => apiPost<ProductionAdjustmentResult>(`/productions/${id}/adjust`, body)

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
