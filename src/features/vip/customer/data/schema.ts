export type CustomerVip = {
    id: number
    calc_year: number
    customer_code: string
    customer_name: string
    customer_type: string
    region: string
    group_code: string
    total_vip_point: number
    common_group_point: number
    ma_vthh_point: number
    ma_rieng_point: number
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

export type CustomerVipAuditLine = {
    id: number
    process_month?: number | null
    document_date?: string | null
    document_no?: string | null
    customer_code?: string | null
    product_code?: string | null
    product_name?: string | null
    vthh_con?: string | null
    private_code?: string | null
    valid_code?: string | null
    hdn_status?: string | null
    region?: string | null
    sale_qty?: number | null
    return_qty?: number | null
    sl_hdn?: number | null
    sl_rieng_tl?: number | null
    eligible?: boolean
    calc_type?: string | null
    reason?: string | null
    rule_id?: number | null
    rule_code?: string | null
    factor?: number | null
    point_qty?: number | null
    point?: number | null
}

export type CustomerVipAuditGroup = {
    vthh_con?: string | null
    group_name?: string | null
    region?: string | null
    sl_hdn_total?: number | null
    rule_id?: number | null
    from_value?: number | null
    to_value?: number | null
    factor?: number | null
    point?: number | null
    line_count?: number | null
}

export type CustomerVipAuditTierThreshold = {
    tier_name?: string | null
    group_code?: string | null
    group_label?: string | null
    required_point?: number | null
    reward?: number | null
    matched?: boolean
}

export type CustomerVipAudit = {
    customer_code: string
    customer_name: string
    calc_year: number
    calc_range: string
    group_code: string
    result_total_vip_point: number
    audit_total_vip_point: number
    diff_total_vip_point: number
    result_tier_name?: string | null
    audit_tier_name?: string | null
    result_next_tier_name?: string | null
    audit_next_tier_name?: string | null
    summary: {
        total_lines?: number
        eligible_lines?: number
        excluded_lines?: number
        common_group_point?: number
        ma_vthh_point?: number
        ma_rieng_point?: number
        total_vip_point?: number
    }
    tier_thresholds?: CustomerVipAuditTierThreshold[]
    common_groups?: CustomerVipAuditGroup[]
    lines?: CustomerVipAuditLine[]
}
