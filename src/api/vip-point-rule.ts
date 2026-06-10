import type { VipPointRule } from "@/features/vip/point-rule/data/schema"
import { createCrudApi, type BaseListParams } from "@/api/crud"

export type VipPointRuleListParams = BaseListParams & {
    keyword?: string
    group_code?: string
}

export type CreateVipPointRuleRequest = {
    vthh_con: string
    from_value?: number
    to_value?: number
    he_so_mb?: number
    he_so_mn?: number
    group_code?: string
    nhom_tinh_diem?: string
    unit?: string
    description?: string
    status?: number
    note?: string
}

export type UpdateVipPointRuleRequest = {
    id: number
    vthh_con: string
    from_value?: number
    to_value?: number
    he_so_mb?: number
    he_so_mn?: number
    group_code?: string
    nhom_tinh_diem?: string
    unit?: string
    description?: string
    status?: number
    note?: string
}

const vipPointRuleApi = createCrudApi<
    VipPointRule,
    CreateVipPointRuleRequest,
    UpdateVipPointRuleRequest,
    VipPointRuleListParams
>("/vip/point-rules")

export const listVipPointRules = vipPointRuleApi.list
export const createVipPointRule = vipPointRuleApi.create
export const updateVipPointRule = vipPointRuleApi.update
export const deleteVipPointRule = vipPointRuleApi.delete
