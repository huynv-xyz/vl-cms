import { createFileRoute } from "@tanstack/react-router"
import CirculationDecisionsPage from "@/features/regulatory/circulation-decisions"

export const Route = createFileRoute("/_authenticated/regulatory/circulation-decisions/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: CirculationDecisionsPage,
})
