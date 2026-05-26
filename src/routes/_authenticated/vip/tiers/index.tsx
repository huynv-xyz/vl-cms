import { createFileRoute } from "@tanstack/react-router"
import TierVipPage from "@/features/vip/tier"

export const Route = createFileRoute("/_authenticated/vip/tiers/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: TierVipPage,
})
