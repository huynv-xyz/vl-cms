import { apiPost } from "@/api/client"

export type ProductMergePair = {
    oldCode?: string
    newCode?: string
}

export type ProductMergeProductInfo = {
    id: number
    code: string
    name?: string
    unit?: string
    nature?: string
    status?: number
}

export type ProductMergeUsage = {
    key: string
    label: string
    count: number
}

export type ProductMergeConflict = {
    key: string
    label: string
    count: number
}

export type ProductMergePairPreview = {
    old_code: string
    new_code: string
    old_product?: ProductMergeProductInfo
    new_product?: ProductMergeProductInfo
    valid: boolean
    errors: string[]
    usage: ProductMergeUsage[]
    conflicts: ProductMergeConflict[]
    total_rows: number
}

export type ProductMergePreview = {
    executable: boolean
    pairs: ProductMergePairPreview[]
    valid_count: number
    total_rows: number
    conflict_count: number
}

export type ProductMergeExecution = {
    old_code: string
    new_code: string
    affected: Record<string, number>
}

export type ProductMergeResult = {
    success: boolean
    message: string
    before: ProductMergePreview
    executions: ProductMergeExecution[]
    after: ProductMergePreview
}

export type DeleteOldProductRow = {
    old_code: string
    product?: ProductMergeProductInfo
    deleted: boolean
    message: string
    usage: Record<string, number>
}

export type DeleteOldProductsResult = {
    success: boolean
    message: string
    deleted_count: number
    blocked_count: number
    rows: DeleteOldProductRow[]
}

export function previewProductMerge(pairs: ProductMergePair[], updateSnapshots = true) {
    return apiPost<any>("/tools/product-merge/preview", {
        pairs: toRequestPairs(pairs),
        update_snapshots: updateSnapshots,
    }).then(normalizePreview)
}

export function executeProductMerge(pairs: ProductMergePair[], updateSnapshots = true) {
    return apiPost<any>("/tools/product-merge/execute", {
        pairs: toRequestPairs(pairs),
        update_snapshots: updateSnapshots,
    }).then(normalizeResult)
}

export function deleteOldMergedProducts(pairs: ProductMergePair[]) {
    return apiPost<any>("/tools/product-merge/delete-old", {
        pairs: toRequestPairs(pairs),
        update_snapshots: true,
    }).then(normalizeDeleteOldProductsResult)
}

function toRequestPairs(pairs: ProductMergePair[]) {
    return pairs.map((pair) => ({
        old_code: pair.oldCode,
        new_code: pair.newCode,
    }))
}

function normalizePreview(data: any): ProductMergePreview {
    const pairs = Array.isArray(data?.pairs) ? data.pairs : []
    return {
        executable: Boolean(data?.executable),
        pairs: pairs.map(normalizePairPreview),
        valid_count: Number(data?.valid_count ?? data?.validCount ?? 0),
        total_rows: Number(data?.total_rows ?? data?.totalRows ?? 0),
        conflict_count: Number(data?.conflict_count ?? data?.conflictCount ?? 0),
    }
}

function normalizePairPreview(pair: any): ProductMergePairPreview {
    return {
        old_code: String(pair?.old_code ?? pair?.oldCode ?? ""),
        new_code: String(pair?.new_code ?? pair?.newCode ?? ""),
        old_product: pair?.old_product ?? pair?.oldProduct,
        new_product: pair?.new_product ?? pair?.newProduct,
        valid: Boolean(pair?.valid),
        errors: Array.isArray(pair?.errors) ? pair.errors : [],
        usage: Array.isArray(pair?.usage) ? pair.usage : [],
        conflicts: Array.isArray(pair?.conflicts) ? pair.conflicts : [],
        total_rows: Number(pair?.total_rows ?? pair?.totalRows ?? 0),
    }
}

function normalizeResult(data: any): ProductMergeResult {
    const executions = Array.isArray(data?.executions) ? data.executions : []
    return {
        success: Boolean(data?.success),
        message: String(data?.message ?? ""),
        before: normalizePreview(data?.before),
        executions: executions.map((execution: any) => ({
            old_code: String(execution?.old_code ?? execution?.oldCode ?? ""),
            new_code: String(execution?.new_code ?? execution?.newCode ?? ""),
            affected: execution?.affected ?? {},
        })),
        after: normalizePreview(data?.after),
    }
}

function normalizeDeleteOldProductsResult(data: any): DeleteOldProductsResult {
    const rows = Array.isArray(data?.rows) ? data.rows : []
    return {
        success: Boolean(data?.success),
        message: String(data?.message ?? ""),
        deleted_count: Number(data?.deleted_count ?? data?.deletedCount ?? 0),
        blocked_count: Number(data?.blocked_count ?? data?.blockedCount ?? 0),
        rows: rows.map((row: any) => ({
            old_code: String(row?.old_code ?? row?.oldCode ?? ""),
            product: row?.product,
            deleted: Boolean(row?.deleted),
            message: String(row?.message ?? ""),
            usage: row?.usage ?? {},
        })),
    }
}
