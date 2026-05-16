import { createFileRoute } from "@tanstack/react-router"
import NationPage from "@/features/purchasing/nation"

export const Route = createFileRoute("/_authenticated/nations/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: NationPage,
})
