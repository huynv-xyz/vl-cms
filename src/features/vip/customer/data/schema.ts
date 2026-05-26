export type CustomerVip = {
    id: number
    calc_year: number
    customer_code: string
    customer_name: string
    customer_type: string
    region: string
    group_code: string
    total_vip_point: number
    tier_code: string
    tier_name: string
    reward_amount: number
    total_reward_amount: number
    private_bonus_amount: number
    final_bonus_amount: number
    next_tier_code: string
    next_tier_name: string
    missing_point_to_next: number
    missing_point_message: string
    status: number
    note: string
    created_at: string
    updated_at: string
}

export type CustomerVipDetailItem = {
    stt: number
    group_code: string
    product_group: string
    unit: string
    achieved_qty?: number | string | null
    expected_qty?: number | string | null
    point_factor?: number | null
    needed_qty_recommended?: number | null
    needed_qty_target?: number | null
    target_qty?: number | null
    target_point?: number | null
    achieved_point?: number | null
    priority?: string | null
}

export type CustomerVipDetail = CustomerVip & {
    items?: CustomerVipDetailItem[]
}
