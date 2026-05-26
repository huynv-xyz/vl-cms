import type { VipCustomerTarget } from "@/features/vip/customer-target/data/schema"
import { createCrudApi } from "@/api/crud"

export type CreateVipCustomerTargetRequest = {
    calc_year: number
    customer_code: string
    customer_name?: string
    target_tier_code?: string
    note?: string
    status?: number
}

export type UpdateVipCustomerTargetRequest = {
    id: number
    calc_year: number
    customer_code: string
    customer_name?: string
    target_tier_code?: string
    note?: string
    status?: number
}

export type VipCustomerTargetListParams = {
    page: number
    size: number
    keyword?: string
    calc_year?: number
}

const vipCustomerTargetApi = createCrudApi<
    VipCustomerTarget,
    CreateVipCustomerTargetRequest,
    UpdateVipCustomerTargetRequest,
    VipCustomerTargetListParams
>("/vip/customer-targets")

export const listVipCustomerTargets = vipCustomerTargetApi.list
export const createVipCustomerTarget = vipCustomerTargetApi.create
export const updateVipCustomerTarget = vipCustomerTargetApi.update
export const deleteVipCustomerTarget = vipCustomerTargetApi.delete
