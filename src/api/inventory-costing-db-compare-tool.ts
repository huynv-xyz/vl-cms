import { apiPost } from "@/api/client"

export type CostingCompareStats = {
    current_rows: number
    reference_rows: number
    matched: number
    only_current: number
    only_reference: number
    quantity_mismatches: number
    value_mismatches: number
    difference_count: number
}

export type CostingComparePeriod = {
    current_period_id: number
    reference_period_id?: number
    name: string
    from_date: string
    to_date: string
    current_status: string
    status: "MATCH" | "DIFFERENT" | "REFERENCE_MISSING"
    message: string
    product_costs?: CostingCompareStats
    ledger_costs?: CostingCompareStats
}

export type CostingCompareSample = {
    type: "PRODUCT_COST" | "LEDGER"
    key: string
    reason: string
    category?: "QUANTITY_CHANGED" | "ROUNDING_DIFFERENCE" | "UNIT_COST_RECALCULATED" | "VALUE_CHANGED"
    explanation?: string
    changes?: Array<{
        column: string
        current: number | string
        reference: number | string
        difference: number | string
    }>
    current?: Record<string, unknown> | null
    reference?: Record<string, unknown> | null
}

export type CostingCompareResult = {
    reference_database: string
    periods: CostingComparePeriod[]
    totals: {
        periods_compared: number
        matching_periods: number
        different_periods: number
        product_difference_samples: number
        ledger_difference_samples: number
    }
    product_differences: CostingCompareSample[]
    ledger_differences: CostingCompareSample[]
}

export function compareInventoryCostingDatabases(periodIds: number[]) {
    return apiPost<CostingCompareResult>("/tools/inventory-costing-db-compare/check", { period_ids: periodIds })
}
