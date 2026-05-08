import { createFileRoute } from "@tanstack/react-router"
import ArLedgerPage from "@/features/sale/ar-ledger"

export const Route = createFileRoute("/_authenticated/sales/ar-ledgers/")({
    validateSearch: (search: Record<string, unknown>) => {

        const page = Number(search.page)
        const size = Number(search.size)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 20 : size,

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

            // ✅ date range
            from_date:
                typeof search.from_date === "string"
                    ? search.from_date
                    : undefined,

            to_date:
                typeof search.to_date === "string"
                    ? search.to_date
                    : undefined,

            // ✅ customer
            customer_id:
                search.customer_id !== undefined
                    ? Number(search.customer_id)
                    : undefined,
        }
    },

    component: ArLedgerPage,
})