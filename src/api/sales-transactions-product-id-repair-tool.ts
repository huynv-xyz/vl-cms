import { apiPost } from "@/api/client"

export type SalesTransactionProductIdRepairRow = {
    id: number
    document_date?: string | null
    document_no?: string | null
    customer_code?: string | null
    customer_name?: string | null
    product_code?: string | null
    product_name?: string | null
    unit?: string | null
    mapped_product_id?: number | null
    mapped_product_code?: string | null
    mapped_product_name?: string | null
    mapped_unit?: string | null
    reason?: string | null
    manual_product_code?: string | null
    mappable?: boolean
}

export type SalesTransactionProductIdManualMapping = {
    sales_transaction_id: number
    product_code: string
}

export type SalesTransactionProductIdRepairPreview = {
    executable: boolean
    total_missing: number
    mappable: number
    unmappable: number
    rows: SalesTransactionProductIdRepairRow[]
    message: string
}

export type SalesTransactionProductIdRepairResult = {
    success: boolean
    message: string
    before: SalesTransactionProductIdRepairPreview
    affected: Record<string, number>
    after: SalesTransactionProductIdRepairPreview
}

export function checkSalesTransactionsProductIdRepair(manualMappings: SalesTransactionProductIdManualMapping[] = []) {
    return apiPost<any>("/tools/sales-transactions-product-id-repair/check", {
        manual_mappings: manualMappings,
    }).then(normalizePreview)
}

export function applySalesTransactionsProductIdRepair(
    syncSnapshots: boolean,
    manualMappings: SalesTransactionProductIdManualMapping[] = []
) {
    return apiPost<any>("/tools/sales-transactions-product-id-repair/apply", {
        sync_snapshots: syncSnapshots,
        manual_mappings: manualMappings,
    }).then(normalizeResult)
}

function normalizePreview(data: any): SalesTransactionProductIdRepairPreview {
    const rows = Array.isArray(data?.rows) ? data.rows : []
    return {
        executable: Boolean(data?.executable),
        total_missing: Number(data?.total_missing ?? 0),
        mappable: Number(data?.mappable ?? 0),
        unmappable: Number(data?.unmappable ?? 0),
        rows: rows.map(normalizeRow),
        message: String(data?.message ?? ""),
    }
}

function normalizeRow(row: any): SalesTransactionProductIdRepairRow {
    const mappedProductId = row?.mapped_product_id ?? null
    const reason = row?.reason ?? null
    return {
        id: Number(row?.id ?? 0),
        document_date: row?.document_date ?? null,
        document_no: row?.document_no ?? null,
        customer_code: row?.customer_code ?? null,
        customer_name: row?.customer_name ?? null,
        product_code: row?.product_code ?? null,
        product_name: row?.product_name ?? null,
        unit: row?.unit ?? null,
        mapped_product_id: mappedProductId,
        mapped_product_code: row?.mapped_product_code ?? null,
        mapped_product_name: row?.mapped_product_name ?? null,
        mapped_unit: row?.mapped_unit ?? null,
        reason,
        manual_product_code: row?.manual_product_code ?? null,
        mappable: row?.mappable == null ? Boolean(mappedProductId && !reason) : Boolean(row.mappable),
    }
}

function normalizeResult(data: any): SalesTransactionProductIdRepairResult {
    return {
        success: Boolean(data?.success),
        message: String(data?.message ?? ""),
        before: normalizePreview(data?.before),
        affected: data?.affected ?? {},
        after: normalizePreview(data?.after),
    }
}
