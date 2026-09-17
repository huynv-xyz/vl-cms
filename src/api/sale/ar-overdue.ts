import { apiGet, type PagedResult } from "@/api/client"

export type ArOverdueBucket =
    | "CURRENT"
    | "OVERDUE"
    | "DAYS_1_30"
    | "DAYS_31_60"
    | "DAYS_61_90"
    | "DAYS_91_120"
    | "DAYS_121_150"
    | "DAYS_OVER_150"

export type ArOverdueReportParams = {
    page: number
    size: number
    report_date?: string
    customer_id?: string
    employee_id?: string
    overdue_bucket?: string
    total_debt_op?: string
    total_debt_value?: string
    total_overdue_debt_op?: string
    total_overdue_debt_value?: string
    current_debt_op?: string
    current_debt_value?: string
    overdue_1_30_op?: string
    overdue_1_30_value?: string
    overdue_31_60_op?: string
    overdue_31_60_value?: string
    overdue_61_90_op?: string
    overdue_61_90_value?: string
    overdue_91_120_op?: string
    overdue_91_120_value?: string
    overdue_121_150_op?: string
    overdue_121_150_value?: string
    overdue_over_150_op?: string
    overdue_over_150_value?: string
}

export type ArOverdueReportRow = {
    customer_id: number
    customer_code?: string
    customer_name?: string
    employee_code?: string
    employee_name?: string
    total_debt: number
    total_overdue_debt: number
    current_debt: number
    overdue_1_30: number
    overdue_31_60: number
    overdue_61_90: number
    overdue_91_120: number
    overdue_121_150: number
    overdue_over_150: number
}

export type ArOverdueReportTotals = Omit<
    ArOverdueReportRow,
    "customer_id" | "customer_code" | "customer_name" | "employee_code" | "employee_name"
> & {
    customer_count: number
}

export function listArOverdueReport(params: ArOverdueReportParams) {
    return apiGet<PagedResult<ArOverdueReportRow>>("/sales/ar-overdue", {
        ...params,
        limit: params.size,
    })
}

export function getArOverdueReportTotals(params: Omit<ArOverdueReportParams, "page" | "size">) {
    return apiGet<ArOverdueReportTotals>("/sales/ar-overdue/totals", params)
}
