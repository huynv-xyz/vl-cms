import { createFileRoute } from "@tanstack/react-router"
import ProductBomPage from "@/features/production/bom"

export const Route = createFileRoute("/_authenticated/production/boms/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",

        product_id:
            search.product_id !== undefined && !isNaN(Number(search.product_id))
                ? Number(search.product_id)
                : undefined,

        active:
            typeof search.active === "string" ? search.active : undefined,
    }),
    component: ProductBomPage,
})
