import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost, apiPostMultipart } from "@/api/client"
import type {
    InventoryLedger,
    InventoryLedgerReportRow,
} from "@/features/inventory/ledger/data/schema"

export type InventoryLedgerListParams = {
    page: number
    size: number
    keyword?: string
    product_id?: number
    product_ids?: string
    warehouse_id?: number
    warehouse_ids?: string
    doc_type?: string
    doc_no?: string
    from_date?: string
    to_date?: string
    doc_text?: string
    doc_text_op?: string
    description_text?: string
    description_text_op?: string
    supplier_text?: string
    supplier_text_op?: string
    product_text?: string
    product_text_op?: string
    product_code_text?: string
    product_code_text_op?: string
    product_name_text?: string
    product_name_text_op?: string
    warehouse_code_text?: string
    warehouse_code_text_op?: string
    warehouse_name_text?: string
    warehouse_name_text_op?: string
    unit?: string
    lot_text?: string
    lot_text_op?: string
    direction?: "IN" | "OUT" | string
    show_values?: boolean
}

export type InventoryLedgerReportParams = InventoryLedgerListParams

const inventoryLedgerApi = createCrudApi<
    InventoryLedger,
    Partial<InventoryLedger>,
    InventoryLedger,
    InventoryLedgerListParams
>("/inventory/ledger")

export const listInventoryLedgers = inventoryLedgerApi.list
export const getInventoryLedger = inventoryLedgerApi.detail
export const createInventoryLedger = inventoryLedgerApi.create
export const updateInventoryLedger = inventoryLedgerApi.update
export const deleteInventoryLedger = inventoryLedgerApi.delete

export function listInventoryLedgerReport(params: InventoryLedgerReportParams) {
    return apiGet<{
        items: InventoryLedgerReportRow[]
        total: number
        current_page: number
        total_page: number
        size: number
    }>("/inventory/ledger/report", params)
}

export type SalesInventorySyncRequest = {
    from_date?: string
    to_date?: string
    user_id?: number
}

export type SalesInventorySyncError = {
    sales_transaction_id?: number | null
    document_no?: string | null
    voucher_type_code?: string | null
    product_code?: string | null
    warehouse_code?: string | null
    reason?: string | null
}

export type SalesInventorySyncVoucher = {
    voucher_id?: number | null
    voucher_no?: string | null
    voucher_type_code?: string | null
    item_count: number
}

export type SalesInventorySyncDetail = {
    sales_transaction_id?: number | null
    date?: string | null
    document_no?: string | null
    voucher_type_code?: string | null
    product_code?: string | null
    product_name?: string | null
    warehouse_code?: string | null
    warehouse_name?: string | null
    customer_name?: string | null
    unit?: string | null
    quantity?: number | string | null
    status?: "READY" | "SKIPPED" | "SUCCESS" | "ERROR" | string | null
    voucher_id?: number | null
    voucher_no?: string | null
    reason?: string | null
}

export type SalesInventorySyncResult = {
    mode: "PREVIEW" | "RUN" | string
    from_date?: string
    to_date?: string
    total_transactions: number
    total_operations: number
    ready_operations: number
    ready_export_operations: number
    ready_return_operations: number
    skipped_operations: number
    failed_operations: number
    created_vouchers: number
    errors: SalesInventorySyncError[]
    vouchers: SalesInventorySyncVoucher[]
    details: SalesInventorySyncDetail[]
}

export function previewSalesInventorySync(body: SalesInventorySyncRequest) {
    return apiPost<SalesInventorySyncResult>("/inventory/sales-sync/preview", body)
}

export function runSalesInventorySync(body: SalesInventorySyncRequest) {
    return apiPost<SalesInventorySyncResult>("/inventory/sales-sync/run", body)
}

export type ProductionCostObjectImportResult = {
    total_rows?: number
    totalRows?: number
    success: number
    failed: number
    updated: number
    already_correct?: number
    alreadyCorrect?: number
    skipped: number
    errors: Array<{ row: number; message: string }>
    skipped_doc_types?: Record<string, number>
    skippedDocTypes?: Record<string, number>
}

export async function importProductionCostObjects(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<ProductionCostObjectImportResult>(
        "/inventory/ledger/production-cost-objects/import",
        formData
    )
}

export type ProductionChronologyAuditRequest = {
    from_date?: string
    to_date?: string
}

export type ProductionChronologyVoucherInfo = {
    id?: number | null
    voucher_no?: string | null
    type_code?: string | null
    posting_date?: string | null
    status?: string | null
}

export type ProductionChronologyShortageRow = {
    ledger_id: number
    voucher_id: number
    voucher_no?: string | null
    posting_date?: string | null
    voucher_status?: string | null
    production_id: number
    production_no?: string | null
    production_status?: string | null
    product_id: number
    product_code?: string | null
    product_name?: string | null
    warehouse_id: number
    warehouse_code?: string | null
    warehouse_name?: string | null
    lot_id?: number | null
    lot_code?: string | null
    required_qty?: number | string | null
    available_before?: number | string | null
    shortage_qty?: number | string | null
}

export type ProductionChronologyCandidate = {
    production_id: number
    production_no?: string | null
    production_status?: string | null
    current_date?: string | null
    issue_voucher?: ProductionChronologyVoucherInfo | null
    receive_voucher?: ProductionChronologyVoucherInfo | null
    proposed_date?: string | null
    proposed_reason?: string | null
    fixable: boolean
    shortage_rows: number
    rows: ProductionChronologyShortageRow[]
}

export type ProductionChronologyAuditResult = {
    from_date?: string | null
    to_date?: string | null
    shortage_rows: number
    production_count: number
    auto_fixable: number
    not_fixable: number
    candidates: ProductionChronologyCandidate[]
}

export type ProductionChronologyFixRequest = ProductionChronologyAuditRequest & {
    items: Array<{
        production_id: number
        new_date?: string | null
    }>
}

export type ProductionChronologyFixResult = {
    success: boolean
    message: string
    fixed_count: number
    rows: Array<{
        production_id: number
        production_no?: string | null
        old_date?: string | null
        new_date?: string | null
        success: boolean
        message?: string | null
    }>
}

export function auditProductionInventoryChronology(body: ProductionChronologyAuditRequest) {
    return apiPost<ProductionChronologyAuditResult>("/tools/production-inventory-chronology/audit", body)
}

export function fixProductionInventoryChronology(body: ProductionChronologyFixRequest) {
    return apiPost<ProductionChronologyFixResult>("/tools/production-inventory-chronology/fix", body)
}

export type ProductionFifoWarehouseAuditRequest = {
    from_date?: string
    to_date?: string
}

export type ProductionFifoWarehouseMismatchRow = {
    production_id: number
    production_no?: string | null
    production_date?: string | null
    production_status?: string | null
    issue_voucher_no?: string | null
    material_id: number
    product_code?: string | null
    product_name?: string | null
    quantity_required?: number | string | null
    preferred_warehouse_code?: string | null
    preferred_warehouse_name?: string | null
    allocated_warehouse_code?: string | null
    allocated_warehouse_name?: string | null
    lot_no?: string | null
    allocated_quantity?: number | string | null
}

export type ProductionFifoWarehouseCandidate = {
    production_id: number
    production_no?: string | null
    production_date?: string | null
    production_status?: string | null
    issue_voucher_no?: string | null
    mismatch_rows: number
    rows: ProductionFifoWarehouseMismatchRow[]
}

export type ProductionFifoWarehouseAuditResult = {
    from_date?: string | null
    to_date?: string | null
    mismatch_rows: number
    production_count: number
    candidates: ProductionFifoWarehouseCandidate[]
}

export type ProductionFifoWarehouseFixRequest = ProductionFifoWarehouseAuditRequest & {
    production_ids: number[]
}

export type ProductionFifoWarehouseFixResult = {
    success: boolean
    message: string
    fixed_count: number
    rows: Array<{
        production_id: number
        production_no?: string | null
        success: boolean
        message?: string | null
    }>
}

export function auditProductionFifoWarehouse(body: ProductionFifoWarehouseAuditRequest) {
    return apiPost<ProductionFifoWarehouseAuditResult>("/tools/production-fifo-warehouse/audit", body)
}

export function fixProductionFifoWarehouse(body: ProductionFifoWarehouseFixRequest) {
    return apiPost<ProductionFifoWarehouseFixResult>("/tools/production-fifo-warehouse/fix", body)
}

