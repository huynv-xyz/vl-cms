export type Warehouse = {
    id: number
    code?: string
    name: string
    address?: string
    inventory_account_code?: string
    visible_in_sales_inventory_summary?: boolean
    physical_warehouse_id?: number
    physical_warehouse?: {
        id: number
        code?: string
        name?: string
    }
    status: "ACTIVE" | "INACTIVE" | string
    created_at?: string
    updated_at?: string
}
