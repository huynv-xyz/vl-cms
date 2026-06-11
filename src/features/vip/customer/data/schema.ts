export type CustomerVip = {
    id: number
    calc_year: number
    from_date?: string | null
    to_date?: string | null
    as_of_date?: string | null
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
    planned_qty?: number | null
    projected_point?: number | null
    achieved_point?: number | null
    priority?: string | null
}

export type CustomerVipDetail = CustomerVip & {
    items?: CustomerVipDetailItem[]
}

export type CustomerVipPlanTier = {
    code: string
    name: string
    point: number
    sort_order?: number | null
}

export type CustomerVipPlanItem = {
    stt: number
    has_plan?: boolean
    group_code: string
    product_group?: string | null
    unit?: string | null
    achieved_qty: number
    achieved_point: number
    point_factor: number
    planned_qty: number
    projected_point: number
    total_point_after_plan: number
    baseline_qty?: number | null
    baseline_point?: number | null
    planned_total_qty?: number | null
    planned_total_point?: number | null
    actual_added_qty?: number | null
    actual_added_point?: number | null
    remaining_planned_qty?: number | null
    remaining_planned_point?: number | null
    plan_progress_qty?: number | null
    plan_progress_point?: number | null
    priority?: string | null
}

export type CustomerVipPlan = CustomerVip & {
    has_plan?: boolean
    target_id?: number | null
    plan_created_at?: string | null
    plan_updated_at?: string | null
    target_tier_code?: string | null
    target_tier_name?: string | null
    target_point: number
    planned_point: number
    projected_total_point: number
    missing_point_to_target: number
    target_status: 'NO_TARGET' | 'MISSING' | 'ACHIEVED'
    target_message: string
    available_tiers: CustomerVipPlanTier[]
    items: CustomerVipPlanItem[]
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
    from_date?: string | null
    to_date?: string | null
    as_of_date?: string | null
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
