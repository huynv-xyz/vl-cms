import type { Employee } from "@/features/employee/data/schema"

export type Customer = {
    id: number
    code: string
    name: string
    tax_code?: string
    address?: string
    type: string
    region: string
    employee_id?: number
    employee?: Employee
    status: number
    note?: string
    created_at?: string
    updated_at?: string
}
