import { apiPost } from "@/api/client"

export type RollbackToolSearchRequest = {
    cutoff_date?: string
}

export type RollbackToolRollbackRequest = {
    cutoff_date?: string
    voucher_ids: number[]
}

export type RollbackToolOldDoc = {
    doc_no?: string | null
    old_from_date?: string | null
    old_to_date?: string | null
    total_qty?: number | string | null
    line_count?: number
}

export type RollbackToolLine = {
    product_id?: number | null
    product_code?: string | null
    product_name?: string | null
    warehouse_id?: number | null
    warehouse_code?: string | null
    warehouse_name?: string | null
    old_qty?: number | string | null
    new_qty?: number | string | null
}

export type RollbackToolCandidate = {
    voucher_id?: number | null
    voucher_no?: string | null
    voucher_posting_date?: string | null
    voucher_status?: string | null
    export_id?: number | null
    export_no?: string | null
    export_date?: string | null
    order_id?: number | null
    order_no?: string | null
    order_date?: string | null
    customer_code?: string | null
    customer_name?: string | null
    old_docs: RollbackToolOldDoc[]
    new_total_qty?: number | string | null
    old_total_qty?: number | string | null
    new_line_count: number
    old_line_count: number
    ambiguous: boolean
    old_match_count: number
    new_match_count: number
    lines: RollbackToolLine[]
}

export type RollbackToolSearchResult = {
    cutoff_date?: string | null
    old_doc_count: number
    new_voucher_count: number
    candidate_count: number
    ambiguous_count: number
    total_qty?: number | string | null
    candidates: RollbackToolCandidate[]
}

export type RollbackToolRollbackRow = {
    voucher_id?: number | null
    voucher_no?: string | null
    export_no?: string | null
    success: boolean
    message?: string | null
}

export type RollbackToolRollbackResult = {
    success: boolean
    message: string
    success_count: number
    failed_count: number
    rows: RollbackToolRollbackRow[]
}

export function searchSalesExportInventoryRollback(body: RollbackToolSearchRequest) {
    return apiPost<RollbackToolSearchResult>("/tools/sales-export-inventory-rollback/search", body)
}

export function rollbackSalesExportInventory(body: RollbackToolRollbackRequest) {
    return apiPost<RollbackToolRollbackResult>("/tools/sales-export-inventory-rollback/rollback", body)
}
