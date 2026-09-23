import { apiPost } from "@/api/client"

export type SalesTransactionUnitRepairRow = {
    id: number
    document_date?: string | null
    document_no?: string | null
    customer_code?: string | null
    customer_name?: string | null
    product_id?: number | null
    product_code?: string | null
    product_name?: string | null
    current_unit?: string | null
    product_unit?: string | null
    base_unit_code?: string | null
    product_group_unit?: string | null
    expected_unit?: string | null
}

export type ProductUnitRepairRow = {
    id: number
    code?: string | null
    name?: string | null
    current_unit?: string | null
    base_unit_code?: string | null
    sale_unit_code?: string | null
    sale_unit_name?: string | null
    sale_unit_factor?: number | null
    product_group_unit?: string | null
    expected_unit?: string | null
}

export type SalesTransactionUnitRepairResult = {
    applied: boolean
    total_mismatch: number
    product_mismatch: number
    sales_transaction_mismatch: number
    missing_unit: number
    different_unit: number
    updated: number
    products_updated: number
    sales_transactions_updated: number
    remaining_mismatch: number
    remaining_product_mismatch: number
    remaining_sales_transaction_mismatch: number
    remaining_missing_unit: number
    remaining_different_unit: number
    product_rows: ProductUnitRepairRow[]
    rows: SalesTransactionUnitRepairRow[]
    message: string
}

function numberValue(value: unknown) {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
}

function normalizeResult(raw: any): SalesTransactionUnitRepairResult {
    const productRows = Array.isArray(raw?.product_rows) ? raw.product_rows : []
    const rows = Array.isArray(raw?.rows) ? raw.rows : []
    const productMismatch = numberValue(raw?.product_mismatch)
    const salesTransactionMismatch = numberValue(raw?.sales_transaction_mismatch ?? raw?.total_mismatch)
    const totalMismatch = numberValue(raw?.total_mismatch ?? productMismatch + salesTransactionMismatch)
    const productsUpdated = numberValue(raw?.products_updated)
    const salesTransactionsUpdated = numberValue(raw?.sales_transactions_updated ?? raw?.updated)
    const updated = numberValue(raw?.updated ?? productsUpdated + salesTransactionsUpdated)

    return {
        applied: Boolean(raw?.applied),
        total_mismatch: totalMismatch,
        product_mismatch: productMismatch,
        sales_transaction_mismatch: salesTransactionMismatch,
        missing_unit: numberValue(raw?.missing_unit),
        different_unit: numberValue(raw?.different_unit),
        updated,
        products_updated: productsUpdated,
        sales_transactions_updated: salesTransactionsUpdated,
        remaining_mismatch: numberValue(raw?.remaining_mismatch ?? totalMismatch),
        remaining_product_mismatch: numberValue(raw?.remaining_product_mismatch ?? productMismatch),
        remaining_sales_transaction_mismatch: numberValue(raw?.remaining_sales_transaction_mismatch ?? salesTransactionMismatch),
        remaining_missing_unit: numberValue(raw?.remaining_missing_unit),
        remaining_different_unit: numberValue(raw?.remaining_different_unit),
        product_rows: productRows,
        rows,
        message: raw?.message || "",
    }
}

export function checkSalesTransactionsUnitRepair() {
    return apiPost<any>("/tools/sales-transactions-unit-repair/check", {}).then(normalizeResult)
}

export function applySalesTransactionsUnitRepair() {
    return apiPost<any>("/tools/sales-transactions-unit-repair/apply", {}).then(normalizeResult)
}
