export type Warehouse = {
    id: number
    code?: string
    name: string
    address?: string
    status: "ACTIVE" | "INACTIVE" | string
    created_at?: string
    updated_at?: string
}
