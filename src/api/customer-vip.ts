import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost } from "@/api/client"
import type { CustomerVip, CustomerVipAudit, CustomerVipDetail, CustomerVipPlan } from "@/features/vip/customer/data/schema"

export type CustomerVipListParams = {
    page: number
    size: number
    keyword?: string
    region?: string
    tier_code?: string
    group_code?: string
    calc_year?: number
    customer_type?: string
    customer_code?: string
    as_of_date?: string
    from_date?: string
    to_date?: string
}

const customerVipApi = createCrudApi<
    CustomerVip,
    never,
    { id: number },
    CustomerVipListParams
>("/vip/customers")

export const listCustomerVips = customerVipApi.list

export type CustomerVipDateRangeParams = {
    from_date?: string
    to_date?: string
    as_of_date?: string
}

export async function getCustomerVipDetail(id: number | string, dateRange?: CustomerVipDateRangeParams) {
    return apiGet<CustomerVipDetail>(`/vip/customers/${id}`, dateRange)
}

export async function getCustomerVipAudit(id: number | string, dateRange?: CustomerVipDateRangeParams) {
    return apiGet<CustomerVipAudit>(`/vip/customers/${id}/audit`, dateRange)
}

export type SaveCustomerVipPlanRequest = {
    target_tier_code: string
    target_tier_name?: string | null
    from_date?: string
    to_date?: string
    as_of_date?: string
    note?: string
    items: {
        group_code: string
        product_group?: string | null
        unit?: string | null
        planned_qty: number
        projected_point: number
        priority?: string | null
    }[]
}

export async function getCustomerVipPlan(id: number | string, dateRange?: CustomerVipDateRangeParams) {
    return apiGet<CustomerVipPlan>(`/vip/customers/${id}/plan`, dateRange)
}

export async function saveCustomerVipPlan(id: number | string, body: SaveCustomerVipPlanRequest) {
    return apiPost<CustomerVipPlan>(`/vip/customers/${id}/plan`, body)
}

export async function triggerVipRecalc(year?: number) {
    return apiPost<boolean>("/vip/customers/recalc", year ? { year } : {})
}
