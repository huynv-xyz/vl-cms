import { createCrudApi } from "@/api/crud"
import { apiPut } from "@/api/client"
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

export function updateExportStatus(id: number, status: string) {
    return apiPut(`/sales/exports/${id}/status`, { status })
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
