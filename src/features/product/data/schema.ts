export type Product = {
    id: number
    code: string
    name: string
    quote_name?: string
    quote_code?: string
    misa_material_code?: string
    unit?: string
    nature?: string
    group_code?: string
    group_name?: string
    group_id?: number
    group?: {
        id: number
        code?: string
        name?: string
    } | null
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
    default_warehouse?: {
        id: number
        name: string
    } | null
    inventory_account_code?: string
    status: number
    created_at?: string
    updated_at?: string
}
