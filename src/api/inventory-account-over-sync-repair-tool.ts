import { apiPost } from "@/api/client"

export type AccountRepairWarehouse = {
    warehouse_code?: string | null
    warehouse_name?: string | null
    account_code?: string | null
    warehouse_id?: number | string | null
    warehouse_current_account?: string | null
}

export type AccountRepairProductSample = {
    product_id?: number | string | null
    product_code?: string | null
    product_name?: string | null
    warehouse_code?: string | null
    current_account?: string | null
    snapshot_account?: string | null
    target_account?: string | null
}

export type AccountRepairLedgerSample = {
    ledger_id?: number | string | null
    doc_no?: string | null
    doc_type?: string | null
    warehouse_code?: string | null
    product_code?: string | null
    current_tk_no?: string | null
    snapshot_tk_no?: string | null
    current_tk_co?: string | null
    snapshot_tk_co?: string | null
    target_tk_no?: string | null
    target_tk_co?: string | null
}

export type AccountRepairResult = {
    applied: boolean
    snapshot_db: string
    mapped_warehouse_count: number
    missing_warehouse_count: number
    product_restore_candidates: number
    ledger_restore_candidates: number
    product_mapping_candidates: number
    ledger_mapping_candidates: number
    product_final_candidates?: number
    ledger_final_candidates?: number
    products_restored: number
    ledger_restored: number
    products_applied: number
    ledger_applied: number
    products_updated?: number
    ledger_updated?: number
    message: string
    warehouses: AccountRepairWarehouse[]
    missing_warehouses: AccountRepairWarehouse[]
    product_restore_samples: AccountRepairProductSample[]
    ledger_restore_samples: AccountRepairLedgerSample[]
    ledger_apply_samples: AccountRepairLedgerSample[]
}

export function checkInventoryAccountOverSyncRepair() {
    return apiPost<AccountRepairResult>("/tools/inventory-account-over-sync-repair/check", {})
}

export function applyInventoryAccountOverSyncRepair() {
    return apiPost<AccountRepairResult>("/tools/inventory-account-over-sync-repair/apply", {})
}
