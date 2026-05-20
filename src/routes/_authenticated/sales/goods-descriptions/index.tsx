import { createFileRoute } from "@tanstack/react-router"
import GoodsDescriptionPage from "@/features/sale/goods-description"

export const Route = createFileRoute("/_authenticated/sales/goods-descriptions/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: GoodsDescriptionPage,
})
