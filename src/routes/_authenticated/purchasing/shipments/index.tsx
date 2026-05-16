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

        supplier_ids:
            typeof search.supplier_ids === "string"
                ? search.supplier_ids
                : undefined,

        // ===== PRODUCT =====
        product_ids:
            typeof search.product_ids === "string"
                ? search.product_ids
                : undefined,

        // ===== PORT =====
        port_ids:
            typeof search.port_ids === "string"
                ? search.port_ids
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
