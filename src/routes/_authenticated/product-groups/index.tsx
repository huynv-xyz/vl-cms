import { createFileRoute } from "@tanstack/react-router"
import ProductGroupPage from "@/features/product-group"

export const Route = createFileRoute("/_authenticated/product-groups/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: ProductGroupPage,
})
