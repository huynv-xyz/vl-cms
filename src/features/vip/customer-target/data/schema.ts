export type VipCustomerTargetItem = {
    id: number
    target_id: number
    group_code: string
    product_group?: string
    unit?: string
    target_qty?: number
    target_point?: number
    priority?: string
}

export type VipCustomerTarget = {
    id: number
    calc_year: number
    customer_code: string
    customer_name?: string
    target_tier_code?: string
    target_tier_name?: string
    note?: string
    status: number
    created_at?: string
    updated_at?: string
    items?: VipCustomerTargetItem[]
}
