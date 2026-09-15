import ArOverduePage from "@/features/sale/ar-overdue"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/sales/ar-overdue/")({
    validateSearch: (search) => {
        const today = todayYmd()
        return {
            page: Number(search.page ?? 1),
            size: Number(search.size ?? 50),
            report_date: validYmd(search.report_date) ? search.report_date : today,
            customer_id: normalizeIds(search.customer_id),
            employee_id: normalizeIds(search.employee_id),
            overdue_bucket: normalizeBuckets(search.overdue_bucket),
            total_debt_op: normalizeOp(search.total_debt_op),
            total_debt_value: normalizeNumber(search.total_debt_value),
            total_overdue_debt_op: normalizeOp(search.total_overdue_debt_op),
            total_overdue_debt_value: normalizeNumber(search.total_overdue_debt_value),
            current_debt_op: normalizeOp(search.current_debt_op),
            current_debt_value: normalizeNumber(search.current_debt_value),
            overdue_1_30_op: normalizeOp(search.overdue_1_30_op),
            overdue_1_30_value: normalizeNumber(search.overdue_1_30_value),
            overdue_31_60_op: normalizeOp(search.overdue_31_60_op),
            overdue_31_60_value: normalizeNumber(search.overdue_31_60_value),
            overdue_61_90_op: normalizeOp(search.overdue_61_90_op),
            overdue_61_90_value: normalizeNumber(search.overdue_61_90_value),
            overdue_91_120_op: normalizeOp(search.overdue_91_120_op),
            overdue_91_120_value: normalizeNumber(search.overdue_91_120_value),
            overdue_over_120_op: normalizeOp(search.overdue_over_120_op),
            overdue_over_120_value: normalizeNumber(search.overdue_over_120_value),
            unknown_debt_op: normalizeOp(search.unknown_debt_op),
            unknown_debt_value: normalizeNumber(search.unknown_debt_value),
        }
    },
    component: ArOverduePage,
})

function todayYmd() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function validYmd(value: unknown): value is string {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function normalizeIds(value: unknown) {
    if (typeof value !== "string") return undefined
    const items = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^\d+$/.test(item))

    return items.length > 0 ? items.join(",") : undefined
}

function normalizeBuckets(value: unknown) {
    if (typeof value !== "string") return undefined
    const allowed = new Set([
        "CURRENT",
        "OVERDUE",
        "DAYS_1_30",
        "DAYS_31_60",
        "DAYS_61_90",
        "DAYS_91_120",
        "DAYS_OVER_120",
        "UNKNOWN",
    ])
    const items = value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter((item) => allowed.has(item))

    return items.length > 0 ? items.join(",") : undefined
}

function normalizeOp(value: unknown) {
    return typeof value === "string" && ["eq", "ne", "lt", "lte", "gt", "gte"].includes(value) ? value : undefined
}

function normalizeNumber(value: unknown) {
    if (typeof value !== "string") return undefined
    const normalized = value.trim().replace(/,/g, "")
    return normalized !== "" && !Number.isNaN(Number(normalized)) ? normalized : undefined
}
