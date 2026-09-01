import { apiPost } from "@/api/client"

export type SalesExportArMissingRepairSample = {
    export_id?: number | string | null
    export_no?: string | null
    order_id?: number | string | null
    order_no?: string | null
    posting_date?: string | null
    export_done_at?: string | null
    customer_code?: string | null
    customer_name?: string | null
    export_item_id?: number | string | null
    product_code?: string | null
    product_name?: string | null
    quantity?: number | string | null
    unit_price?: number | string | null
    expected_amount?: number | string | null
}

export type SalesExportArMissingRepairResult = {
    applied: boolean
    missing_export_count: number
    missing_order_count: number
    missing_line_count: number
    missing_amount: number | string
    ledger_inserted: number
    receivables_created: number
    receivables_updated: number
    message: string
    samples: SalesExportArMissingRepairSample[]
}

export function previewSalesExportArMissingRepair() {
    return apiPost<SalesExportArMissingRepairResult>("/tools/sales-export-ar-missing-repair/preview", {})
}

export function applySalesExportArMissingRepair() {
    return apiPost<SalesExportArMissingRepairResult>("/tools/sales-export-ar-missing-repair/apply", {})
}
