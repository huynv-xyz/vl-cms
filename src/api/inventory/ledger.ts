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

export type PurchaseLotChangeResult = {
    valid: boolean
    applied: boolean
    mode: "RENAME" | "MERGE" | string
    mode_label: string
    message: string
    ledger_id: number
    product_id: number
    warehouse_id: number
    product_code: string
    product_name: string
    warehouse_code?: string | null
    warehouse_name: string
    doc_no?: string | null
    doc_type?: string | null
    posting_date?: string | null
    old_lot_no: string
    new_lot_no: string
    old_lot_ids: number[]
    target_lot_ids: number[]
    target_lot_id: number
    counts: Record<string, number>
    old_stock: Record<string, number>
    target_stock: Record<string, number>
    warnings: string[]
    changes: Record<string, number>
}

export function checkPurchaseLotChange(ledgerId: number, newLotNo: string) {
    return apiPost<PurchaseLotChangeResult>(`/inventory/ledger/${ledgerId}/purchase-lot-change/check`, {
        newLotNo,
    })
}

export function applyPurchaseLotChange(ledgerId: number, newLotNo: string) {
    return apiPost<PurchaseLotChangeResult>(`/inventory/ledger/${ledgerId}/purchase-lot-change/apply`, {
        newLotNo,
    })
}

export async function importProductionCostObjects(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<ProductionCostObjectImportResult>(
        "/inventory/ledger/production-cost-objects/import",
        formData
    )
}

