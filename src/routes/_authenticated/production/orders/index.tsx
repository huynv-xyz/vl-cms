import { createFileRoute } from "@tanstack/react-router"
import ProductionOrderPage from "@/features/production/order"

export const Route = createFileRoute("/_authenticated/production/orders/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",

        product_id:
            search.product_id !== undefined && !isNaN(Number(search.product_id))
                ? Number(search.product_id)
                : undefined,

        physical_warehouse_id:
            search.physical_warehouse_id !== undefined && !isNaN(Number(search.physical_warehouse_id))
                ? Number(search.physical_warehouse_id)
                : undefined,

        status:
            typeof search.status === "string" ? search.status : undefined,

        from_date:
            typeof search.from_date === "string" ? search.from_date : undefined,

        to_date:
            typeof search.to_date === "string" ? search.to_date : undefined,
    }),
    component: ProductionOrderPage,
})
