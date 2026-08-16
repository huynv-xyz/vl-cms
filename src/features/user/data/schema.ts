export type User = {
    id: number
    email: string
    name: string
    employee_id?: number
    employee?: { id: number; code?: string; name?: string }
    status: number
    created_at: string
    updated_at: string
}
