export type ProductFormValues = {
    code: string
    name: string
    quote_name?: string
    quote_code?: string
    misa_material_code?: string
    unit?: string
    nature?: string
    group_id?: number
    base_unit_code?: string
    sale_unit_code?: string
    sale_unit_name?: string
    sale_unit_factor?: number
    size_value?: number
    size_unit_code?: string
    rounding_mode?: string
    rounding_unit?: number
    vat_rate?: number
    description?: string
    default_warehouse_id?: number
    inventory_account_code?: string
    status?: 0 | 1
}
