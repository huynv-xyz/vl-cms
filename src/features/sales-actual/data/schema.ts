import { Employee } from "@/features/employee/data/schema"
import { Province } from "@/features/province/data/schema"
import { Region } from "@/features/region/data/schema"
import { SalesTarget } from "@/features/sales-target/data/schema"

export type SalesActual = {
    id: number
    employee_id: number
    period: number
    region_id?: number | null
    province_id?: number | null
    main?: number
    bon_goc?: number
    bon_la_bot?: number
    clcn?: number
    bon_la_long?: number
    debt_rate?: number
    created_at?: string
    updated_at?: string
}


export type SalesActualItem = {
    actual?: SalesActual
    target?: SalesTarget
    employee?: Employee
    region?: Region
    province?: Province
    conversion_coeff?: {
        bon_goc?: number
        bon_la_long?: number
        bon_la_bot?: number
        clcn?: number
    }
    actual_gtqd?: number
    target_gtqd_year?: number
    target_gtqd_month?: number
    completion_rate?: number
}
