import ArSummaryPage from "@/features/sale/ar-summary"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/sales/ar-summary/")({
    validateSearch: (search) => {
        const today = todayYmd()
        const fromDate = normalizeFromDate(search.from_date, today)
        const toDate = normalizeToDate(search.to_date, fromDate, today)

        return {
            page: Number(search.page ?? 1),
            size: Number(search.size ?? 100),
            keyword: typeof search.keyword === "string" ? search.keyword : "",
            from_date: fromDate,
            to_date: toDate,
            customer_id: typeof search.customer_id === "string" ? search.customer_id : undefined,
        }
    },
    component: ArSummaryPage,
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
    if (!validYmd(value)) return today
    return value > today ? today : value
}

function normalizeToDate(value: unknown, fromDate: string, today: string) {
    if (!validYmd(value)) return today
    return value < fromDate ? fromDate : value
}
