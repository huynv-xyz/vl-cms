import { apiPost } from "@/api/client"

export type LegacyConversionLotCandidate = {
    ledger_id: number
    product_id: number
    product_code: string
    product_name: string
    warehouse_id: number
    warehouse_code: string
    warehouse_name: string
    old_lot_no: string
    target_lot_no: string
    target_exists: boolean
    first_date?: string | null
    last_date?: string | null
    inbound_quantity: number
    outbound_quantity: number
    merged_remaining: number
    ledger_rows: number
    reference_rows: number
    cost_rows: number
    status: "SAFE" | "REVIEW"
    status_label: string
    reason: string
    errors: string[]
}

export type LegacyConversionLotScanResult = {
    items: LegacyConversionLotCandidate[]
    total: number
    safe: number
    review: number
    message: string
}

export type LegacyConversionLotApplyResult = {
    applied: boolean
    fixed: number
    message: string
    changes: Array<Record<string, unknown>>
}

export function scanLegacyConversionLots(payload: {
    fromDate?: string
    toDate?: string
    keyword?: string
}) {
    return apiPost<LegacyConversionLotScanResult>("/tools/legacy-conversion-lot-merge/scan", payload)
}

export function applyLegacyConversionLots(ledgerIds: number[]) {
    return apiPost<LegacyConversionLotApplyResult>("/tools/legacy-conversion-lot-merge/apply", {
        ledgerIds,
    })
}
