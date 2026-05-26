import type { VipPrivateRule } from "@/features/vip/private-rule/data/schema"
import { createCrudApi } from "@/api/crud"

export type CreateVipPrivateRuleRequest = {
    code: string
    name: string
    amount?: number
    unit?: string
    status?: number
    note?: string | null
}

export type UpdateVipPrivateRuleRequest = {
    id: number
    code: string
    name: string
    amount?: number
    unit?: string
    status?: number
    note?: string | null
}

const vipPrivateRuleApi = createCrudApi<
    VipPrivateRule,
    CreateVipPrivateRuleRequest,
    UpdateVipPrivateRuleRequest
>("/vip/private-rules")

export const listVipPrivateRules = vipPrivateRuleApi.list
export const createVipPrivateRule = vipPrivateRuleApi.create
export const updateVipPrivateRule = vipPrivateRuleApi.update
export const deleteVipPrivateRule = vipPrivateRuleApi.delete
