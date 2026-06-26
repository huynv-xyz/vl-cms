import type { Employee } from "@/features/employee/data/schema"
import type { Province } from "@/features/province/data/schema"
import type { Region } from "@/features/region/data/schema"

export type SalaryRole = {
    id: number
    code: string
    name: string
}

export type SalesTarget = {
    id: number
    employee_id: number
    role_id?: number | null
    region_id?: number | null
    province_id?: number | null
    period: number
    main?: number
    bon_goc?: number
    bon_la_bot?: number
    clcn?: number
    bon_la_long?: number
    employee?: Pick<Employee, "id" | "code" | "name">
    role?: SalaryRole
    region?: Pick<Region, "id" | "code" | "name">
    province?: Pick<Province, "id" | "code" | "name">
    created_at?: string
    updated_at?: string
}
