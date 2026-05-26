import { createFileRoute } from "@tanstack/react-router"
import VipProductMappingPage from "@/features/vip/product-mapping"

export const Route = createFileRoute("/_authenticated/vip/product-mapping/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: VipProductMappingPage,
})
