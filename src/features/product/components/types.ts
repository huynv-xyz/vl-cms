export type ProductFormValues = {
    code: string
    name: string
    unit?: string
    nature?: string
    group_code?: string
    group_name?: string
    description?: string
    default_warehouse_id?: number
    inventory_account_code?: string
    status?: 0 | 1
}
