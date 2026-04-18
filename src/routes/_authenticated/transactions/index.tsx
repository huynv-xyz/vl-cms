import { createFileRoute } from "@tanstack/react-router"
import TransactionPage from "@/features/transactions"

export const Route = createFileRoute("/_authenticated/transactions/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",

        customer_type:
            typeof search.customer_type === "string" ? search.customer_type : "",
        vthh_con:
            typeof search.vthh_con === "string" ? search.vthh_con : "",
        npp:
            typeof search.npp === "string" ? search.npp : "",
        process_month:
            typeof search.process_month === "string" ? search.process_month : "",
    }),
    component: TransactionPage,
})