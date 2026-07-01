import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost } from "@/api/client"
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

