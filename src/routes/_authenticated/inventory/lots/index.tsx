import { createFileRoute } from "@tanstack/react-router"
import InventoryLotPage from "@/features/inventory/lot"

export const Route = createFileRoute("/_authenticated/inventory/lots/")({
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

        source_type:
            typeof search.source_type === "string"
                ? search.source_type
                : undefined,

        from_date:
            typeof search.from_date === "string"
                ? search.from_date
                : undefined,

        to_date:
            typeof search.to_date === "string"
                ? search.to_date
                : undefined,

        only_remaining:
            search.only_remaining !== undefined
                ? search.only_remaining === "true"
                : undefined,
    }),
    component: InventoryLotPage,
})