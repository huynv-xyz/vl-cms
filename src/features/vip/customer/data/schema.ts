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
    ma_chung: string
    nhom_hang_hoa: string
    dvt: string
    sl_dat?: number | string | null
    sl_du_kien?: number | string | null
    he_so?: number | null
    sl_can_them_khuyen_cao?: number | null
    sl_can_them_muc_tieu?: number | null
    sl_admin_nhap?: number | null
    diem_dat_admin?: number | null
    diem_dat?: number | null
    uu_tien?: string | null
}

export type CustomerVipDetail = CustomerVip & {
    items?: CustomerVipDetailItem[]
}