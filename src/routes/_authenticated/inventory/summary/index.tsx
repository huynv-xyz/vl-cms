import { createFileRoute } from "@tanstack/react-router"
import SummaryPage from "@/features/inventory/summary"

export const Route = createFileRoute("/_authenticated/inventory/summary/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string"
                ? search.keyword
                : "",

        product_id:
            search.product_id !== undefined &&
                !isNaN(Number(search.product_id))
                ? Number(search.product_id)
                : undefined,

        warehouse_id:
            search.warehouse_id !== undefined &&
                !isNaN(Number(search.warehouse_id))
                ? Number(search.warehouse_id)
                : undefined,
    }),

    component: SummaryPage,
})