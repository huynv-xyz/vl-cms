export type Warehouse = {
    id: number
    name: string
    address?: string
    status: "ACTIVE" | "INACTIVE" | string
    created_at?: string
    updated_at?: string
}
