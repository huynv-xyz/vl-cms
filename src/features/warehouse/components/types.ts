
export type WarehouseFormValues = {
    code: string
    name: string
    address?: string
    inventory_account_code?: string
    physical_warehouse_id?: number
    physical_warehouse?: {
        id: number
        code?: string
        name?: string
    }
    status?: "ACTIVE" | "INACTIVE"
}
