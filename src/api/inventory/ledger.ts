import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost, apiPostMultipart } from "@/api/client"
import type {
    InventoryLedger,
    InventoryLedgerReportRow,
    InventoryLedgerTotals,
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
    time_sort?: "asc" | "desc" | string
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
        totals?: InventoryLedgerTotals
    }>("/inventory/ledger/report", params)
}

export type NegativeStockAuditItem = {
    lot_id?: number | null
    product_id?: number | null
    product_code?: string | null
    product_name?: string | null
    warehouse_id?: number | null
    warehouse_code?: string | null
    warehouse_name?: string | null
    lot_code?: string | null
    posting_date?: string | null
    posting_time?: string | null
    doc_no?: string | null
    doc_type?: string | null
    description?: string | null
    balance?: number | string | null
}

export type NegativeStockAuditResult = {
    ok: boolean
    checked_scope: "ALL" | "PRODUCT_CODES" | string
    requested_product_codes: string[]
    unknown_product_codes: string[]
    checked_lot_count: number
    negative_count: number
    message: string
    items: NegativeStockAuditItem[]
}

export function checkNegativeStock(productCodes: string) {
    return apiPost<NegativeStockAuditResult>("/inventory/ledger/negative-stock/check", {
        productCodes,
    })
}

export type CostingLedgerReconciliationItem = {
    period_id: number
    period_name: string
    from_date?: string | null
    to_date?: string | null
    status?: string | null
    product_code?: string | null
    product_name?: string | null
    warehouse_code?: string | null
    warehouse_name?: string | null
    diff_opening_quantity?: number | string | null
    diff_opening_value?: number | string | null
    diff_inbound_quantity?: number | string | null
    diff_inbound_value?: number | string | null
    diff_outbound_quantity?: number | string | null
    diff_outbound_value?: number | string | null
    diff_closing_quantity?: number | string | null
    diff_closing_value?: number | string | null
    missing_costed_outbound_rows?: number | string | null
}

export type CostingLedgerReconciliationResult = {
    ok: boolean
    message: string
    period_count: number
    checked_product_rows: number
    mismatch_count: number
    items: CostingLedgerReconciliationItem[]
}

export function checkCostingLedgerReconciliation() {
    return apiPost<CostingLedgerReconciliationResult>("/inventory/ledger/costing-reconciliation/check", {})
}

export type InventoryLedgerAccountRuleAuditSample = {
    id: number
    posting_date?: string | null
    posting_time?: string | null
    doc_type?: string | null
    doc_no?: string | null
    movement_side?: string | null
    product_code?: string | null
    product_name?: string | null
    quantity?: number | string | null
    current_tk_no?: string | null
    current_tk_co?: string | null
    expected_tk_no?: string | null
    expected_tk_co?: string | null
}

export type InventoryLedgerAccountRuleAuditResult = {
    ok: boolean
    applied: boolean
    updated_rows: number
    ledger_rows: number
    matched_rule_rows: number
    missing_rule_rows: number
    mismatch_rows: number
    correct_rows: number
    missing_product_account_rows: number
    message: string
    by_doc_type: Array<{
        doc_type?: string | null
        movement_side?: string | null
        ledger_rows?: number | string | null
        missing_rule_rows?: number | string | null
        mismatch_rows?: number | string | null
    }>
    samples: InventoryLedgerAccountRuleAuditSample[]
    missing_rules: Array<{
        doc_type?: string | null
        movement_side?: string | null
        ledger_rows?: number | string | null
    }>
    missing_product_accounts: Array<{
        product_id?: number | string | null
        product_code?: string | null
        product_name?: string | null
        ledger_rows?: number | string | null
    }>
}

export function checkInventoryLedgerAccountRules() {
    return apiPost<InventoryLedgerAccountRuleAuditResult>("/inventory/ledger/account-rules/check", {})
}

export function applyInventoryLedgerAccountRules() {
    return apiPost<InventoryLedgerAccountRuleAuditResult>("/inventory/ledger/account-rules/apply", {})
}

export type ProductionDateSyncDetail = {
    kind: "VOUCHER" | "LEDGER" | "OUTPUT" | string
    id?: number | null
    doc_no?: string | null
    doc_type?: string | null
    current_date?: string | null
    expected_date?: string | null
}

export type ProductionDateSyncIssue = {
    production_id: number
    production_no: string
    production_date: string
    status?: string | null
    voucher_mismatch_count: number
    ledger_mismatch_count: number
    output_mismatch_count: number
    details: ProductionDateSyncDetail[]
}

export type ProductionDateSyncResult = {
    ok: boolean
    applied: boolean
    checked_count: number
    mismatch_count: number
    requested_production_nos: string[]
    issues: ProductionDateSyncIssue[]
    changes?: Record<string, number>
    negative_count: number
    negative_items: NegativeStockAuditItem[]
    message: string
}

export function checkProductionDateSync(productionNos: string) {
    return apiPost<ProductionDateSyncResult>("/inventory/ledger/production-date-sync/check", {
        productionNos,
    })
}

export function applyProductionDateSync(productionNos: string) {
    return apiPost<ProductionDateSyncResult>("/inventory/ledger/production-date-sync/apply", {
        productionNos,
    })
}

export type ProductionCostObjectImportResult = {
    total_rows?: number
    totalRows?: number
    success: number
    failed: number
    updated: number
    to_update?: number
    toUpdate?: number
    changed?: number
    already_correct?: number
    alreadyCorrect?: number
    skipped: number
    preview?: boolean
    requires_confirm?: boolean
    requiresConfirm?: boolean
    pending_changes?: Array<{
        row: number
        ledgerId?: number
        ledger_id?: number
        docNo?: string
        doc_no?: string
        postingDate?: string
        posting_date?: string
        productCode?: string
        product_code?: string
        warehouseCode?: string
        warehouse_code?: string
        lotNo?: string
        lot_no?: string
        oldCostObjectCode?: string | null
        old_cost_object_code?: string | null
        newCostObjectCode?: string
        new_cost_object_code?: string
    }>
    pendingChanges?: ProductionCostObjectImportResult["pending_changes"]
    errors: Array<{ row: number; message: string }>
    skipped_doc_types?: Record<string, number>
    skippedDocTypes?: Record<string, number>
}

export type InventoryLedgerPriceImportResult = ProductionCostObjectImportResult

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

export type SalesExportLotChangeResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    product_id: number
    warehouse_id: number
    product_code: string
    product_name: string
    warehouse_code?: string | null
    warehouse_name: string
    doc_no?: string | null
    doc_type?: string | null
    posting_date?: string | null
    posting_time?: string | null
    old_lot_id: number
    old_lot_no: string
    target_lot_id: number
    new_lot_no: string
    quantity: number
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export function checkSalesExportLotChange(ledgerId: number, newLotNo: string) {
    return apiPost<SalesExportLotChangeResult>(`/inventory/ledger/${ledgerId}/sales-export-lot-change/check`, {
        newLotNo,
    })
}

export function applySalesExportLotChange(ledgerId: number, newLotNo: string) {
    return apiPost<SalesExportLotChangeResult>(`/inventory/ledger/${ledgerId}/sales-export-lot-change/apply`, {
        newLotNo,
    })
}

export type TransferExportWarehouseChangeResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    inbound_ledger_id?: number | null
    product_id: number
    product_code: string
    product_name: string
    doc_no?: string | null
    doc_type?: string | null
    posting_date?: string | null
    posting_time?: string | null
    old_warehouse_id: number
    old_warehouse_code?: string | null
    old_warehouse_name: string
    new_warehouse_id: number
    new_warehouse_code?: string | null
    new_warehouse_name: string
    destination_warehouse_id?: number | null
    destination_warehouse_code?: string | null
    destination_warehouse_name?: string | null
    old_destination_warehouse_id?: number | null
    old_destination_warehouse_code?: string | null
    old_destination_warehouse_name?: string | null
    new_destination_warehouse_id?: number | null
    new_destination_warehouse_code?: string | null
    new_destination_warehouse_name?: string | null
    old_lot_no?: string | null
    new_lot_no: string
    old_source_lot_id: number
    new_source_lot_id: number
    old_destination_lot_id: number
    target_destination_lot_id: number
    quantity: number
    old_unit_price: number
    old_amount: number
    new_unit_price: number
    new_amount: number
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export type TransferExportWarehouseAvailableLot = {
    lot_id: number
    lot_no: string
    available_quantity: number | string
    enough: boolean
    unit_cost?: number | string | null
    expiry_date?: string | null
    preferred?: boolean
}

export function listTransferExportWarehouseChangeLots(ledgerId: number, newWarehouseId: number) {
    return apiPost<TransferExportWarehouseAvailableLot[]>(`/inventory/ledger/${ledgerId}/transfer-export-warehouse-change/available-lots`, {
        newWarehouseId,
    })
}

export function getTransferExportWarehouseChangeContext(ledgerId: number) {
    return apiGet<TransferExportWarehouseChangeResult>(`/inventory/ledger/${ledgerId}/transfer-export-warehouse-change/context`)
}

export function checkTransferExportWarehouseChange(ledgerId: number, newWarehouseId: number, newToWarehouseId: number, newLotNo: string) {
    return apiPost<TransferExportWarehouseChangeResult>(`/inventory/ledger/${ledgerId}/transfer-export-warehouse-change/check`, {
        newWarehouseId,
        newToWarehouseId,
        newLotNo,
    })
}

export function applyTransferExportWarehouseChange(ledgerId: number, newWarehouseId: number, newToWarehouseId: number, newLotNo: string) {
    return apiPost<TransferExportWarehouseChangeResult>(`/inventory/ledger/${ledgerId}/transfer-export-warehouse-change/apply`, {
        newWarehouseId,
        newToWarehouseId,
        newLotNo,
    })
}

export type ReturnWarehouseChangeResult = {
    valid: boolean
    applied: boolean
    mode: string
    mode_label: string
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    product_id: number
    product_code: string
    product_name: string
    doc_no?: string | null
    posting_date?: string | null
    lot_no?: string | null
    old_warehouse_id: number
    old_warehouse_code?: string | null
    old_warehouse_name: string
    new_warehouse_id: number
    new_warehouse_code?: string | null
    new_warehouse_name: string
    voucher_item_count: number
    same_physical_required: boolean
    target_lot_id?: number | null
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export function checkReturnWarehouseChange(ledgerId: number, newWarehouseId: number) {
    return apiPost<ReturnWarehouseChangeResult>(`/inventory/ledger/${ledgerId}/return-warehouse-change/check`, {
        newWarehouseId,
    })
}

export function applyReturnWarehouseChange(ledgerId: number, newWarehouseId: number) {
    return apiPost<ReturnWarehouseChangeResult>(`/inventory/ledger/${ledgerId}/return-warehouse-change/apply`, {
        newWarehouseId,
    })
}

export type SalesReturnUnitPriceChangeResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    product_id: number
    product_code: string
    product_name: string
    warehouse_id: number
    warehouse_code?: string | null
    warehouse_name: string
    doc_no?: string | null
    doc_type?: string | null
    posting_date?: string | null
    posting_time?: string | null
    lot_id?: number | null
    lot_no?: string | null
    quantity: number
    current_unit_price: number
    current_amount: number
    new_unit_price: number
    new_amount: number
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export function checkSalesReturnUnitPriceChange(ledgerId: number, newUnitPrice: number) {
    return apiPost<SalesReturnUnitPriceChangeResult>(`/inventory/ledger/${ledgerId}/sales-return-unit-price-change/check`, {
        newUnitPrice,
    })
}

export function applySalesReturnUnitPriceChange(ledgerId: number, newUnitPrice: number) {
    return apiPost<SalesReturnUnitPriceChangeResult>(`/inventory/ledger/${ledgerId}/sales-return-unit-price-change/apply`, {
        newUnitPrice,
    })
}

export type PurchaseQuantityChangeResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    product_id: number
    product_code: string
    product_name: string
    warehouse_id: number
    warehouse_code?: string | null
    warehouse_name: string
    doc_no?: string | null
    doc_type?: string | null
    direction?: "IN" | "OUT" | string
    posting_date?: string | null
    lot_id?: number | null
    lot_no?: string | null
    old_quantity: number
    new_quantity: number
    signed_new_quantity?: number
    delta_quantity: number
    unit_price: number
    old_amount: number
    new_amount: number
    voucher_item_amount?: number
    delta_amount: number
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export function checkPurchaseQuantityChange(ledgerId: number, newQuantity: number) {
    return apiPost<PurchaseQuantityChangeResult>(`/inventory/ledger/${ledgerId}/purchase-quantity-change/check`, {
        newQuantity,
    })
}

export function applyPurchaseQuantityChange(ledgerId: number, newQuantity: number) {
    return apiPost<PurchaseQuantityChangeResult>(`/inventory/ledger/${ledgerId}/purchase-quantity-change/apply`, {
        newQuantity,
    })
}

export type PurchaseProductChangeResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    old_product_id: number
    old_product_code: string
    old_product_name: string
    old_unit?: string | null
    new_product_id: number
    new_product_code: string
    new_product_name: string
    new_unit?: string | null
    warehouse_id: number
    warehouse_code?: string | null
    warehouse_name: string
    doc_no?: string | null
    doc_type?: string | null
    posting_date?: string | null
    lot_id?: number | null
    lot_no?: string | null
    quantity: number
    counts: Record<string, number>
    affected_period_ids?: number[]
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export function checkPurchaseProductChange(ledgerId: number, newProductId: number) {
    return apiPost<PurchaseProductChangeResult>(`/inventory/ledger/${ledgerId}/purchase-product-change/check`, {
        newProductId,
    })
}

export function applyPurchaseProductChange(ledgerId: number, newProductId: number) {
    return apiPost<PurchaseProductChangeResult>(`/inventory/ledger/${ledgerId}/purchase-product-change/apply`, {
        newProductId,
    })
}

export type PurchasePostingDateTimeChangeResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    doc_no?: string | null
    doc_type?: string | null
    doc_type_name?: string | null
    old_posting_date?: string | null
    old_posting_time?: string | null
    new_posting_date?: string | null
    new_posting_time?: string | null
    date_changed?: boolean
    time_changed?: boolean
    line_count?: number
    affected_lot_count?: number
    lines?: Array<{
        ledger_id?: number
        product_code?: string | null
        product_name?: string | null
        warehouse_code?: string | null
        warehouse_name?: string | null
        lot_no?: string | null
        quantity?: number
    }>
    errors: string[]
    warnings: string[]
    changes: Record<string, number>
}

export function checkPurchasePostingDateTimeChange(ledgerId: number, newPostingDate: string, newPostingTime: string) {
    return apiPost<PurchasePostingDateTimeChangeResult>(`/inventory/ledger/${ledgerId}/purchase-posting-datetime-change/check`, {
        newPostingDate,
        newPostingTime,
    })
}

export function applyPurchasePostingDateTimeChange(ledgerId: number, newPostingDate: string, newPostingTime: string) {
    return apiPost<PurchasePostingDateTimeChangeResult>(`/inventory/ledger/${ledgerId}/purchase-posting-datetime-change/apply`, {
        newPostingDate,
        newPostingTime,
    })
}

export type DocumentPostingTimeChangeResult = PurchasePostingDateTimeChangeResult & {
    flow?: "OTHER_INBOUND" | "OTHER_EXPORT" | "SALES_EXPORT" | "PRODUCTION"
    source_id?: number | null
    export_no?: string | null
    delivery_no?: string | null
    order_no?: string | null
}

export type InventoryLedgerStaticParametersPayload = {
    description?: string | null
    tk_no?: string | null
    tk_co?: string | null
    supplier_name?: string | null
}

export type InventoryLedgerStaticParametersResult = InventoryLedgerStaticParametersPayload & {
    id: number
    updated: boolean
}

export function updateInventoryLedgerStaticParameters(
    ledgerId: number,
    body: InventoryLedgerStaticParametersPayload,
) {
    return apiPost<InventoryLedgerStaticParametersResult>(`/inventory/ledger/${ledgerId}/static-parameters`, {
        description: body.description,
        tkNo: body.tk_no,
        tkCo: body.tk_co,
        supplierName: body.supplier_name,
    })
}

export function checkDocumentPostingTimeChange(ledgerId: number, newPostingTime: string, newPostingDate?: string) {
    return apiPost<DocumentPostingTimeChangeResult>(`/inventory/ledger/${ledgerId}/document-posting-time-change/check`, {
        newPostingDate,
        newPostingTime,
    })
}

export function applyDocumentPostingTimeChange(ledgerId: number, newPostingTime: string, newPostingDate?: string) {
    return apiPost<DocumentPostingTimeChangeResult>(`/inventory/ledger/${ledgerId}/document-posting-time-change/apply`, {
        newPostingDate,
        newPostingTime,
    })
}

export type OtherExportLineDeleteResult = {
    valid: boolean
    applied: boolean
    message: string
    ledger_id: number
    voucher_id?: number | null
    voucher_item_id?: number | null
    product_id?: number | null
    product_code?: string | null
    product_name?: string | null
    warehouse_id?: number | null
    warehouse_code?: string | null
    warehouse_name?: string | null
    doc_no?: string | null
    doc_type?: string | null
    posting_date?: string | null
    lot_id?: number | null
    lot_no?: string | null
    quantity?: number | null
    unit_price?: number | null
    amount?: number | null
    operation_code?: string | null
    voucher_item_count?: number
    delete_voucher?: boolean
    counts?: Record<string, number>
    affected_period_ids?: number[]
    errors?: string[]
    warnings?: string[]
    changes?: Record<string, number>
}

export function checkOtherExportLineDelete(ledgerId: number) {
    return apiPost<OtherExportLineDeleteResult>(`/inventory/ledger/${ledgerId}/other-export-line-delete/check`, {})
}

export function applyOtherExportLineDelete(ledgerId: number) {
    return apiPost<OtherExportLineDeleteResult>(`/inventory/ledger/${ledgerId}/other-export-line-delete/apply`, {})
}

export async function importProductionCostObjects(file: File, confirm = false) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<ProductionCostObjectImportResult>(
        `/inventory/ledger/production-cost-objects/import${confirm ? "?confirm=true" : ""}`,
        formData
    )
}

export async function importInventoryLedgerPrices(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<InventoryLedgerPriceImportResult>(
        "/inventory/ledger/prices/import",
        formData
    )
}

export async function importPurchaseBasePrices(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<InventoryLedgerPriceImportResult>(
        "/inventory/ledger/purchase-base-prices/import",
        formData
    )
}

export type OpeningCostNormalizationRun = {
    id: number
    status: string
    file_name?: string | null
    opening_date?: string | null
    import_rows?: number
    error_message?: string | null
    check?: Record<string, any>
    impact?: Record<string, any>
    snapshot?: Record<string, any>
    apply?: Record<string, any>
    downstream?: Record<string, any>
    recalc?: Record<string, any>
    audit?: Record<string, any>
    verify?: Record<string, any>
}

export async function uploadOpeningCostNormalization(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiPostMultipart<OpeningCostNormalizationRun>(
        "/inventory/ledger/opening-cost-normalization/upload",
        formData
    )
}

export function getOpeningCostNormalization(runId: number) {
    return apiGet<OpeningCostNormalizationRun>(`/inventory/ledger/opening-cost-normalization/${runId}`)
}

export function runOpeningCostNormalizationStep(
    runId: number,
    step:
        | "check"
        | "impact"
        | "snapshot"
        | "apply-opening"
        | "normalize-downstream"
        | "mark-recalculate"
        | "recalculate"
        | "audit-costing"
        | "verify"
        | "rollback",
) {
    return apiPost<OpeningCostNormalizationRun>(`/inventory/ledger/opening-cost-normalization/${runId}/${step}`, {})
}

