import type { InventoryLedgerReportRow } from "./schema"

export const ZERO_BALANCE_LIMIT = 5000

export function zeroBalanceDifference(row: InventoryLedgerReportRow) {
    return row.warehouse_balance_quantity != null && Number(row.warehouse_balance_quantity) === 0
        ? Number(row.warehouse_balance_value || 0) : 0
}

export function hasNegativeWarehouseValue(row: InventoryLedgerReportRow) {
    return Number(row.warehouse_balance_quantity || 0) > 0 && Number(row.warehouse_balance_value || 0) < 0
}

export function costSourceLabel(source?: string | null) {
    if (source === "COST_OVERRIDE_FILE_IMPORT") return "Giá vốn cố định từ file import"
    if (source === "COST_OVERRIDE_MANUAL_UI") return "Giá vốn cố định sửa trên giao diện"
    return source?.startsWith("COST_OVERRIDE_") ? "Giá vốn cố định được nhập" : "Giá vốn hệ thống"
}
