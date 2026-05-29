import { createFileRoute } from "@tanstack/react-router"
import ReturnPage from "@/features/sale/return"

export const Route = createFileRoute("/_authenticated/sales/returns/")({
    validateSearch: (search: Record<string, unknown>) => {

        const page = Number(search.page)
        const size = Number(search.size)
        const today = todayYmd()
        const fromDate = normalizeFromDate(search.from_date, today)
        const toDate = normalizeToDate(search.to_date, fromDate, today)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 20 : size,

            keyword: typeof search.keyword === "string" ? search.keyword : "",

            status: typeof search.status === "string" ? search.status : "",

            order_id: search.order_id ? Number(search.order_id) : undefined,
            export_id: search.export_id ? Number(search.export_id) : undefined,
            customer_id: search.customer_id ? Number(search.customer_id) : undefined,
            from_date: fromDate,
            to_date: toDate,
        }
    },

    component: ReturnPage,
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
