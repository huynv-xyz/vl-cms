import { createFileRoute } from "@tanstack/react-router"
import Page from "@/features/vip/point-rule"

export const Route = createFileRoute("/_authenticated/vip/point-rules/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === 'string' ? search.keyword : '',
        group_code: typeof search.group_code === 'string' ? search.group_code : '',
    }),
    component: Page,
})
