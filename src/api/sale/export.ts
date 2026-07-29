import { createCrudApi } from "@/api/crud"
import { apiGet, apiPut } from "@/api/client"
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
