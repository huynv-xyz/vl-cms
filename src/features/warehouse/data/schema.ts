export type Warehouse = {
    id: number
    code?: string
    name: string
    address?: string
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
