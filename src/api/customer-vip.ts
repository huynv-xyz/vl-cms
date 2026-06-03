import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost } from "@/api/client"
import type { CustomerVip, CustomerVipAudit, CustomerVipDetail } from "@/features/vip/customer/data/schema"

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
}

const customerVipApi = createCrudApi<
    CustomerVip,
    never,
    { id: number },
    CustomerVipListParams
>("/vip/customers")

export const listCustomerVips = customerVipApi.list

export async function getCustomerVipDetail(id: number | string) {
    return customerVipApi.detail(id) as Promise<CustomerVipDetail>
}

export async function getCustomerVipAudit(id: number | string) {
    return apiGet<CustomerVipAudit>(`/vip/customers/${id}/audit`)
}

export async function triggerVipRecalc(year?: number) {
    return apiPost<boolean>("/vip/customers/recalc", year ? { year } : {})
}
