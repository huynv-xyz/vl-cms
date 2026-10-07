import type { InventorySummary } from "./schema"

export function getSummaryCostStatus(row: InventorySummary) {
    const total = row.outbound_cost_total_count
    const calculated = row.outbound_cost_calculated_count
    const pending = row.outbound_cost_pending_count
    if (Number(row.outbound_quantity || 0) === 0) {
        return { kind: "empty" as const, title: "Không phát sinh xuất", total: 0, calculated: 0, pending: 0 }
    }
    if (total == null || calculated == null || pending == null || total <= 0) {
        return { kind: "pending" as const, title: "Giá bình quân chưa hoàn tất", total: null, calculated: null, pending: null }
    }
    if (pending === 0 && calculated === total) {
        return { kind: "complete" as const, title: "Đã tính đủ giá", total, calculated, pending }
    }
    return { kind: "pending" as const, title: "Giá bình quân chưa hoàn tất", total, calculated, pending }
}

export function summaryCostStatusText(row: InventorySummary) {
    const status = getSummaryCostStatus(row)
    return status.kind === "pending" && status.total != null
        ? `Chưa hoàn tất (${status.calculated}/${status.total})` : status.title
}
