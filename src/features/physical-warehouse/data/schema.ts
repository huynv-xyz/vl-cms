export type PhysicalWarehouse = {
    id: number
    code?: string
    name: string
    address?: string
    status: "ACTIVE" | "INACTIVE" | string
    note?: string
    created_at?: string
    updated_at?: string
}
