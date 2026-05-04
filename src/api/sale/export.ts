import { createCrudApi } from "@/api/crud"
import type { Export } from "@/features/sale/export/data/schema"

export type ExportListParams = {
    page: number
    size: number
    keyword?: string
    order_id?: number
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