import { createFileRoute } from "@tanstack/react-router"
import CurrencyPage from "@/features/purchasing/currency"

export const Route = createFileRoute("/_authenticated/currencies/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: CurrencyPage,
})
