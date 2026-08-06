import { createCrudApi } from "@/api/crud"
import { apiGet, apiPost, apiPut } from "@/api/client"
import type { DocumentPostingTimeChangeResult } from "@/api/inventory/ledger"
import type { Export } from "@/features/sale/export/data/schema"

export type ExportListParams = {
    page: number
    size: number
    keyword?: string
    order_id?: number
    customer_id?: number
    delivery_id?: number
    warehouse_id?: number
    status?: string
    from_date?: string
    to_date?: string
}

export type ExportExcelLine = {
    export_id?: number
    export_no?: string
    export_date?: string
    warehouse_code?: string
    warehouse_name?: string
    customer_code?: string
    customer_name?: string
    product_code?: string
    product_name?: string
    description?: string
    unit?: string
    quantity?: number
    status?: string
}

const exportApi = createCrudApi<
    Export,
    Partial<Export>,
    Export,
    ExportListParams
>("/sales/exports")

export const listExports = exportApi.list
export const getExport = exportApi.detail
export const createExport = exportApi.create
export const updateExport = exportApi.update
export const deleteExport = exportApi.delete

export function listExportExcelLines(params: Omit<ExportListParams, "page" | "size">) {
    return apiGet<ExportExcelLine[]>("/sales/exports/excel-lines", params)
}

export function updateExportStatus(id: number, status: string, exportTime?: string) {
    return apiPut(`/sales/exports/${id}/status`, { status, export_time: exportTime })
}

export type ExportInventoryCheckResult = {
    valid: boolean
    code: "OK" | "MISSING_WAREHOUSE" | "INSUFFICIENT_AT_POSTING_TIME" | "NEGATIVE_FUTURE_HISTORY"
    message: string
    product_id?: number
    warehouse_id?: number
    lot_code?: string
    required_quantity?: number
    available_quantity?: number
    conflict_date?: string
    conflict_time?: string
    conflict_doc_no?: string
    conflict_balance?: number
}

export function checkExportInventory(id: number, exportTime?: string) {
    return apiGet<ExportInventoryCheckResult>(`/sales/exports/${id}/inventory-check`, {
        export_time: exportTime,
    })
}

export function updateExportTime(id: number, exportTime: string) {
    return apiPut(`/sales/exports/${id}/export-time`, { export_time: exportTime })
}

export function checkExportPostingDateTimeChange(id: number, newPostingDate: string, newPostingTime: string) {
    return apiPost<DocumentPostingTimeChangeResult>(`/sales/exports/${id}/document-posting-datetime-change/check`, {
        newPostingDate,
        newPostingTime,
    })
}

export function applyExportPostingDateTimeChange(id: number, newPostingDate: string, newPostingTime: string) {
    return apiPost<DocumentPostingTimeChangeResult>(`/sales/exports/${id}/document-posting-datetime-change/apply`, {
        newPostingDate,
        newPostingTime,
    })
}

export function updateExportItemWarehouse(
    exportId: number,
    itemId: number,
    warehouseId: number
) {
    return apiPut(`/sales/exports/${exportId}/items/${itemId}/warehouse`, {
        warehouse_id: warehouseId,
    })
}

export function updateExportItemLot(
    exportId: number,
    itemId: number,
    lotCode?: string
) {
    return apiPut(`/sales/exports/${exportId}/items/${itemId}/lot`, {
        lot_code: lotCode,
    })
}
