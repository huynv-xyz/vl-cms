import { apiPost } from "@/api/client"

export type SalesTransactionVipValidityRepairRow = {
    id: number
    document_date?: string | null
    document_no?: string | null
    customer_code?: string | null
    customer_name?: string | null
    product_code?: string | null
    product_name?: string | null
    unit?: string | null
    sale_qty?: number | null
    return_qty?: number | null
    sl_hdn?: number | null
    status?: number | null
    is_gift?: number | null
    hdn_status?: string | null
    vthh_con?: string | null
    vthh_group_name?: string | null
    private_code?: string | null
    valid_code?: string | null
    expected_vthh_con?: string | null
    expected_vthh_group_name?: string | null
    expected_private_code?: string | null
    expected_valid_code?: string | null
    reason?: string | null
    change_type?: string | null
    repairable?: boolean
    changed?: boolean
}

export type SalesTransactionVipValidityRepairPreview = {
    executable: boolean
    total_mismatched: number
    repairable: number
    need_review: number
    by_change_type: Record<string, number>
    rows: SalesTransactionVipValidityRepairRow[]
    message: string
}

export type SalesTransactionVipValidityRepairResult = {
    success: boolean
    message: string
    before: SalesTransactionVipValidityRepairPreview
    affected: Record<string, number>
    after: SalesTransactionVipValidityRepairPreview
}

export function checkSalesTransactionsVipValidityRepair() {
    return apiPost<any>("/tools/sales-transactions-vip-validity-repair/check", {}).then(normalizePreview)
}

export function applySalesTransactionsVipValidityRepair() {
    return apiPost<any>("/tools/sales-transactions-vip-validity-repair/apply", {}).then(normalizeResult)
}

function normalizePreview(data: any): SalesTransactionVipValidityRepairPreview {
    const rows = Array.isArray(data?.rows) ? data.rows : []
    return {
        executable: Boolean(data?.executable),
        total_mismatched: Number(data?.total_mismatched ?? 0),
        repairable: Number(data?.repairable ?? 0),
        need_review: Number(data?.need_review ?? 0),
        by_change_type: normalizeCounts(data?.by_change_type),
        rows: rows.map(normalizeRow),
        message: String(data?.message ?? ""),
    }
}

function normalizeRow(row: any): SalesTransactionVipValidityRepairRow {
    return {
        id: Number(row?.id ?? 0),
        document_date: row?.document_date ?? null,
        document_no: row?.document_no ?? null,
        customer_code: row?.customer_code ?? null,
        customer_name: row?.customer_name ?? null,
        product_code: row?.product_code ?? null,
        product_name: row?.product_name ?? null,
        unit: row?.unit ?? null,
        sale_qty: numberOrNull(row?.sale_qty),
        return_qty: numberOrNull(row?.return_qty),
        sl_hdn: numberOrNull(row?.sl_hdn),
        status: numberOrNull(row?.status),
        is_gift: numberOrNull(row?.is_gift),
        hdn_status: row?.hdn_status ?? null,
        vthh_con: row?.vthh_con ?? null,
        vthh_group_name: row?.vthh_group_name ?? null,
        private_code: row?.private_code ?? null,
        valid_code: row?.valid_code ?? null,
        expected_vthh_con: row?.expected_vthh_con ?? null,
        expected_vthh_group_name: row?.expected_vthh_group_name ?? null,
        expected_private_code: row?.expected_private_code ?? null,
        expected_valid_code: row?.expected_valid_code ?? null,
        reason: row?.reason ?? null,
        change_type: row?.change_type ?? null,
        repairable: Boolean(row?.repairable),
        changed: Boolean(row?.changed),
    }
}

function normalizeResult(data: any): SalesTransactionVipValidityRepairResult {
    return {
        success: Boolean(data?.success),
        message: String(data?.message ?? ""),
        before: normalizePreview(data?.before),
        affected: data?.affected ?? {},
        after: normalizePreview(data?.after),
    }
}

function numberOrNull(value: any): number | null {
    if (value == null || value === "") return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

function normalizeCounts(value: any): Record<string, number> {
    const out: Record<string, number> = {}
    if (!value || typeof value !== "object") return out
    Object.entries(value).forEach(([key, raw]) => {
        out[key] = Number(raw ?? 0)
    })
    return out
}
