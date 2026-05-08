import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost } from "@/api/client"
import type {
    ProductionOrder,
    CreateProductionRequest,
    UpdateProductionRequest,
    ProductBomDetail,
} from "@/features/inventory/production/data/schema"

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

const productionApi = createCrudApi<
    ProductionOrder,
    CreateProductionRequest,
    UpdateProductionRequest,
    ProductionListParams
>("/productions")

export const listProductions = productionApi.list
export const getProduction = productionApi.detail
export const createProduction = productionApi.create
export const updateProduction = productionApi.update
export const deleteProduction = productionApi.delete

export function confirmProduction(id: number) {
    return apiPost<boolean>(`/productions/${id}/confirm`)
}

export function getActiveBomByProduct(productId: number) {
    return apiGet<ProductBomDetail>(`/product-boms/by-product/${productId}`)
}