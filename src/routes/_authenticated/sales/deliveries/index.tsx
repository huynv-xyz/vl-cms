import { createFileRoute } from "@tanstack/react-router"
import DeliveryPage from "@/features/sale/delivery"

export const Route = createFileRoute("/_authenticated/sales/deliveries/")({
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

        order_id:
            search.order_id !== undefined &&
                !isNaN(Number(search.order_id))
                ? Number(search.order_id)
                : undefined,

        warehouse_id:
            search.warehouse_id !== undefined &&
                !isNaN(Number(search.warehouse_id))
                ? Number(search.warehouse_id)
                : undefined,

        company_id:
            search.company_id !== undefined &&
                !isNaN(Number(search.company_id))
                ? Number(search.company_id)
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
    component: DeliveryPage,
})