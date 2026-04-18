import { Employee } from "@/features/employee/data/schema"
import { SalesTarget } from "@/features/sales-target/data/schema"

export type SalesActual = {
    id: number
    employee_id: number
    period: number
    main?: number
    bon_goc?: number
    bon_la_bot?: number
    clcn?: number
    bon_la_long?: number
    created_at?: string
    updated_at?: string
}


export type SalesActualItem = {
    actual?: SalesActual
    target?: SalesTarget
    employee?: Employee
}