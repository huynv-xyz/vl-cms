import { createFileRoute } from "@tanstack/react-router"
import PricingPage from "@/features/pricing"

export const Route = createFileRoute("/_authenticated/pricing/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: PricingPage,
})
