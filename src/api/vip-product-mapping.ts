import type { VipProductMapping } from "@/features/vip/product-mapping/data/schema"
import { createCrudApi } from "@/api/crud"

export type CreateVipProductMappingRequest = {
    misa_code: string
    product_sub_code: string
    group_code?: string
    product_group?: string
    product_name?: string
    unit?: string
    conversion_factor?: number
    calc_point?: number
    calc_reward?: number
    is_promotion?: number
    status?: number
    note?: string
}

export type UpdateVipProductMappingRequest = {
    id: number
    misa_code: string
    product_sub_code: string
    group_code?: string
    product_group?: string
    product_name?: string
    unit?: string
    conversion_factor?: number
    calc_point?: number
    calc_reward?: number
    is_promotion?: number
    status?: number
    note?: string
}

export type VipProductMappingListParams = {
    page: number
    size: number
    keyword?: string
    product_sub_code?: string
    group_code?: string
    status?: number
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
