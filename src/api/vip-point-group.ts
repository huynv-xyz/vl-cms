import type { VipPointGroup } from "@/features/vip/point-rule/data/schema"
import { createCrudApi, type BaseListParams } from "@/api/crud"

export type VipPointGroupListParams = BaseListParams & {
    keyword?: string
    status?: number
}

export type CreateVipPointGroupRequest = {
    group_code: string
    group_name?: string
    unit?: string
    he_so_mb?: number
    he_so_mn?: number
    description?: string
    status?: number
}

export type UpdateVipPointGroupRequest = {
    id: number
    group_code: string
    group_name?: string
    unit?: string
    he_so_mb?: number
    he_so_mn?: number
    description?: string
    status?: number
}

const vipPointGroupApi = createCrudApi<
    VipPointGroup,
    CreateVipPointGroupRequest,
    UpdateVipPointGroupRequest,
    VipPointGroupListParams
>("/vip/point-groups")

export const listVipPointGroups = vipPointGroupApi.list
export const createVipPointGroup = vipPointGroupApi.create
export const updateVipPointGroup = vipPointGroupApi.update
export const deleteVipPointGroup = vipPointGroupApi.delete
