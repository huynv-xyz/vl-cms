import { createCrudApi } from "@/api/crud"
import { CustomerVip, CustomerVipDetail } from "@/features/vip/customer/data/schema"

export type CustomerVipListParams = {
    page: number
    size: number
    keyword?: string
    region?: string
    tier_code?: string
    group_code?: string
}

const customerVipApi = createCrudApi<
    CustomerVip,
    never,
    { id: number },
    CustomerVipListParams
>("/vip")

export const listCustomerVips = customerVipApi.list


export async function getCustomerVipDetail(id: number) {
    return customerVipApi.detail(id) as Promise<CustomerVipDetail>
}