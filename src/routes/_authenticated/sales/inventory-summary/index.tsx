import { createFileRoute } from "@tanstack/react-router"
import SalesInventorySummaryPage from "@/features/sale/inventory-summary"

export const Route = createFileRoute("/_authenticated/sales/inventory-summary/")({
    validateSearch: (search: Record<string, unknown>) => {
        const page = Number(search.page ?? 1)
        const size = Number(search.size ?? 20)
        const today = todayYmd()
        const fromDate = normalizeFromDate(search.from_date, today)
        const toDate = normalizeToDate(search.to_date, fromDate)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 20 : size,
            keyword: typeof search.keyword === "string" ? search.keyword : "",
            product_id:
                search.product_id !== undefined && !isNaN(Number(search.product_id))
                    ? Number(search.product_id)
                    : undefined,
            product_ids: typeof search.product_ids === "string" ? search.product_ids : undefined,
            warehouse_id:
                search.warehouse_id !== undefined && !isNaN(Number(search.warehouse_id))
                    ? Number(search.warehouse_id)
                    : undefined,
            warehouse_ids: typeof search.warehouse_ids === "string" ? search.warehouse_ids : undefined,
            from_date: fromDate,
            to_date: toDate,
            product_text: typeof search.product_text === "string" ? search.product_text : undefined,
            product_text_op: normalizeTextOp(search.product_text_op),
            product_code_text: typeof search.product_code_text === "string" ? search.product_code_text : undefined,
            product_code_text_op: normalizeTextOp(search.product_code_text_op),
            product_name_text: typeof search.product_name_text === "string" ? search.product_name_text : undefined,
            product_name_text_op: normalizeTextOp(search.product_name_text_op),
            warehouse_code_text: typeof search.warehouse_code_text === "string" ? search.warehouse_code_text : undefined,
            warehouse_code_text_op: normalizeTextOp(search.warehouse_code_text_op),
            warehouse_name_text: typeof search.warehouse_name_text === "string" ? search.warehouse_name_text : undefined,
            warehouse_name_text_op: normalizeTextOp(search.warehouse_name_text_op),
            quote_text: typeof search.quote_text === "string" ? search.quote_text : undefined,
            quote_text_op: normalizeTextOp(search.quote_text_op),
            unit: typeof search.unit === "string" ? search.unit : undefined,
            summary_status: normalizeSummaryStatus(search.summary_status),
        }
    },

    component: SalesInventorySummaryPage,
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

function normalizeFromDate(value: unknown, today: string) {
    if (!validYmd(value)) return undefined
    return value > today ? today : value
}

function normalizeToDate(value: unknown, fromDate?: string) {
    if (!validYmd(value)) return undefined
    return fromDate && value < fromDate ? fromDate : value
}

function normalizeTextOp(value: unknown) {
    return typeof value === "string" &&
        ["contains", "equals", "not_equals", "not_contains"].includes(value)
        ? value
        : undefined
}

function normalizeSummaryStatus(value: unknown) {
    return typeof value === "string" &&
        ["NEGATIVE", "OUT_OF_STOCK", "DECREASE", "INCREASE", "STABLE"].includes(value)
        ? value
        : undefined
}
