import type { VipProductMapping } from "@/features/vip/product-mapping/data/schema"
import { createCrudApi } from "@/api/crud"

export type CreateVipProductMappingRequest = {
    product_group?: string
    ap_dung?: string
    he_so_hdn?: number
    unit?: string
    customer_code?: string
    note?: string
}

export type UpdateVipProductMappingRequest = {
    id: number
    product_group?: string
    ap_dung?: string
    he_so_hdn?: number
    unit?: string
    customer_code?: string
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
