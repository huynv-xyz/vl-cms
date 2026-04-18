import type { VipTier } from "@/features/vip/tier/data/schema"
import { createCrudApi } from "@/api/crud"

export type CreateVipTierRequest = {
    name: string
    mb_b2b_point?: number
    mb_b2b_reward?: number
    b2c_point?: number
    b2c_reward?: number
    b2b_point?: number
    b2b_reward?: number
    sort_order?: number
    status?: number
    note?: string
}

export type UpdateVipTierRequest = {
    id: number
    name: string
    mb_b2b_point?: number
    mb_b2b_reward?: number
    b2c_point?: number
    b2c_reward?: number
    b2b_point?: number
    b2b_reward?: number
    sort_order?: number
    status?: number
    note?: string
}

const vipTierApi = createCrudApi<
    VipTier,
    CreateVipTierRequest,
    UpdateVipTierRequest
>("/vip/tiers")

export const listVipTiers = vipTierApi.list
export const createVipTier = vipTierApi.create
export const updateVipTier = vipTierApi.update
export const deleteVipTier = vipTierApi.delete