import { createFileRoute } from "@tanstack/react-router"
import ArLedgerPage from "@/features/sale/ar-ledger"

export const Route = createFileRoute("/_authenticated/sales/ar-ledgers/")({
    validateSearch: (search: Record<string, unknown>) => {

        const page = Number(search.page)
        const size = Number(search.size)
        const today = todayYmd()
        const fromDate = normalizeFromDate(search.from_date, today)
        const toDate = normalizeToDate(search.to_date, fromDate, today)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 50 : size,

            // ✅ keyword
            keyword:
                typeof search.keyword === "string"
                    ? search.keyword
                    : "",

            // ✅ multi filter
            source_type:
                typeof search.source_type === "string"
                    ? search.source_type
                    : undefined,
            activity: normalizeActivity(search.activity),

            // ✅ date range
            from_date:
                fromDate,

            to_date:
                toDate,

            // ✅ customer
            customer_id:
                search.customer_id !== undefined
                    ? Number(search.customer_id)
                    : undefined,

            return_from:
                typeof search.return_from === "string"
                    ? search.return_from
                    : undefined,
            return_page:
                search.return_page !== undefined
                    ? Number(search.return_page)
                    : undefined,
            return_size:
                search.return_size !== undefined
                    ? Number(search.return_size)
                    : undefined,
            return_keyword:
                typeof search.return_keyword === "string"
                    ? search.return_keyword
                    : undefined,
            return_from_date:
                typeof search.return_from_date === "string"
                    ? search.return_from_date
                    : undefined,
            return_to_date:
                typeof search.return_to_date === "string"
                    ? search.return_to_date
                    : undefined,
            return_customer_id:
                search.return_customer_id !== undefined
                    ? Number(search.return_customer_id)
                    : undefined,
            return_activity:
                typeof search.return_activity === "string"
                    ? search.return_activity
                    : undefined,
        }
    },

    component: ArLedgerPage,
})

function todayYmd() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function normalizeActivity(value: unknown) {
    if (typeof value !== "string") return undefined

    const allowed = new Set(["debit", "credit", "none"])
    const items = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => allowed.has(item))

    return items.length > 0 ? items.join(",") : undefined
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
