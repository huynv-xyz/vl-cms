
import { createFileRoute } from "@tanstack/react-router"
import ProductPage from "@/features/product"

export const Route = createFileRoute("/_authenticated/products/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    component: ProductPage,
})
