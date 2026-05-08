import { createFileRoute } from "@tanstack/react-router"
import ShipmentPage from "@/features/purchasing/shipment"

export const Route = createFileRoute(
    "/_authenticated/purchasing/shipments/"
)({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string"
                ? search.keyword
                : "",

        status:
            typeof search.status === "string"
                ? search.status
                : undefined,

        supplier_id:
            search.supplier_id !== undefined &&
                !isNaN(Number(search.supplier_id))
                ? Number(search.supplier_id)
                : undefined,

        // ===== PRODUCT =====
        product_id:
            search.product_id !== undefined &&
                !isNaN(Number(search.product_id))
                ? Number(search.product_id)
                : undefined,

        // ===== PORT =====
        port_id:
            search.port_id !== undefined &&
                !isNaN(Number(search.port_id))
                ? Number(search.port_id)
                : undefined,

        // ===== ETA =====
        eta_from:
            typeof search.eta_from === "string"
                ? search.eta_from
                : undefined,

        eta_to:
            typeof search.eta_to === "string"
                ? search.eta_to
                : undefined,
    }),

    component: ShipmentPage,
})