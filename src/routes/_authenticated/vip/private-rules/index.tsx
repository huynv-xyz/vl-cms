import { createFileRoute } from "@tanstack/react-router"
import Page from "@/features/vip/private-rule"

export const Route = createFileRoute("/_authenticated/vip/private-rules/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: Page,
})
