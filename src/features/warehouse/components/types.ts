
export type WarehouseFormValues = {
    code: string
    name: string
    address?: string
    physical_warehouse_id?: number
    status?: "ACTIVE" | "INACTIVE"
}
