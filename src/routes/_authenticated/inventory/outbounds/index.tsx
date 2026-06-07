import { createFileRoute } from "@tanstack/react-router"
import InventoryOutboundPage from "@/features/inventory/outbound"

export const Route = createFileRoute("/_authenticated/inventory/outbounds/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),

        keyword:
            typeof search.keyword === "string" ? search.keyword : "",

        voucher_type:
            typeof search.voucher_type === "string"
                ? search.voucher_type
                : undefined,

        status:
            typeof search.status === "string" ? search.status : undefined,

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

        from_date:
            typeof search.from_date === "string"
                ? search.from_date
                : undefined,

        to_date:
            typeof search.to_date === "string"
                ? search.to_date
                : undefined,
    }),
    component: InventoryOutboundPage,
})
