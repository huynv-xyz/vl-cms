import type { Employee } from "@/features/employee/data/schema"
import type { CustomerAlias } from "@/api/customer-alias"

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
    default_alias?: CustomerAlias
    alias_count?: number
    created_at?: string
    updated_at?: string
}
