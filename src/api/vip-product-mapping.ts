import type { VipProductMapping } from "@/features/vip/product-mapping/data/schema"
import { createCrudApi } from "@/api/crud"

export type CreateVipProductMappingRequest = {
    product_code: string
    customer_code?: string
    he_so_mb?: number
    he_so_mn?: number
    note?: string
}

export type UpdateVipProductMappingRequest = {
    id: number
    product_code: string
    customer_code?: string
    he_so_mb?: number
    he_so_mn?: number
    note?: string
}

export type VipProductMappingListParams = {
    page: number
    size: number
    keyword?: string
    group_code?: string
}

const vipProductMappingApi = createCrudApi<
    VipProductMapping,
    CreateVipProductMappingRequest,
    UpdateVipProductMappingRequest,
    VipProductMappingListParams
>("/vip/product-mappings")

export const listVipProductMappings = vipProductMappingApi.list
export const createVipProductMapping = vipProductMappingApi.create
export const updateVipProductMapping = vipProductMappingApi.update
export const deleteVipProductMapping = vipProductMappingApi.delete
