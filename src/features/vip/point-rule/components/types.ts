export type VipPointRuleFormValues = {
    vthh_con: string
    from_value?: number
    to_value?: number
    he_so_mb?: number
    he_so_mn?: number
    group_code?: string
    nhom_tinh_diem?: string
    unit?: string
    description?: string
    note?: string
    status?: boolean
}

export type VipPointGroupFormValues = {
    group_code: string
    group_name?: string
    unit?: string
    he_so_mb?: number
    he_so_mn?: number
    description?: string
    status?: boolean
}
