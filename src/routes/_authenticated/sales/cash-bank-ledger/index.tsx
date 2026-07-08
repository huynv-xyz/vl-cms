import { createFileRoute } from "@tanstack/react-router"
import CashBankLedgerPage from "@/features/sale/cash-bank-ledger"

export const Route = createFileRoute("/_authenticated/sales/cash-bank-ledger/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        from_date: typeof search.from_date === "string" ? search.from_date : "",
        to_date: typeof search.to_date === "string" ? search.to_date : "",
        customer_id: typeof search.customer_id === "string" ? search.customer_id : "",
    }),
    component: CashBankLedgerPage,
})
