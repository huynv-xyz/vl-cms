export type VipProductMapping = {
    id: number
    misa_code: string
    product_sub_code: string
    customer_code?: string
    group_code?: string
    product_group?: string
    product_name?: string
    unit?: string
    conversion_factor: number
    he_so_mb: number
    he_so_mn: number
    calc_point: number
    calc_reward: number
    is_promotion: number
    status: number
    note?: string
    created_at?: string
    updated_at?: string
}
