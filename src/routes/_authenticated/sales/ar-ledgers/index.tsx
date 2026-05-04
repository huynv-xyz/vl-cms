import { createFileRoute } from "@tanstack/react-router"
import ArLedgerPage from "@/features/sale/ar-ledger"

export const Route = createFileRoute("/_authenticated/sales/ar-ledgers/")({
    validateSearch: (search: Record<string, unknown>) => {

        const page = Number(search.page)
        const size = Number(search.size)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 20 : size,
            doc_type: typeof search.doc_type === "string" ? search.doc_type : "",
        }
    },

    component: ArLedgerPage,
})