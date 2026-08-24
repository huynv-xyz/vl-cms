
import { createFileRoute } from "@tanstack/react-router"
import WarehousePage from "@/features/warehouse"

export const Route = createFileRoute("/_authenticated/warehouses/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        status: typeof search.status === "string" ? search.status : undefined,
        physical_warehouse_id: typeof search.physical_warehouse_id === "string" ? search.physical_warehouse_id : undefined,
        sales_inventory_visible: typeof search.sales_inventory_visible === "string" ? search.sales_inventory_visible : undefined,
    }),
    component: WarehousePage,
})
