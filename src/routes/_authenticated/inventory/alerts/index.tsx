import { createFileRoute } from "@tanstack/react-router"
import InventoryAlertsPage from "@/features/inventory/alerts"

export const Route = createFileRoute("/_authenticated/inventory/alerts/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),

        keyword:
            typeof search.keyword === "string" ? search.keyword : "",

        expiry_status:
            typeof search.expiry_status === "string"
                ? search.expiry_status
                : undefined,

        warehouse_id:
            search.warehouse_id !== undefined &&
                !isNaN(Number(search.warehouse_id))
                ? Number(search.warehouse_id)
                : undefined,
    }),
    component: InventoryAlertsPage,
})
