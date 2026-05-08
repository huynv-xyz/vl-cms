import { createFileRoute } from "@tanstack/react-router"
import CashBankLedgerPage from "@/features/sale/cash-bank-ledger"

export const Route = createFileRoute("/_authenticated/sales/cash-bank-ledger/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        type: typeof search.type === "string" ? search.type : "",
    }),
    component: CashBankLedgerPage,
})