export type Product = {
    id: number
    code: string
    name: string
    unit?: string
    nature?: string
    group_code?: string
    group_name?: string
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
