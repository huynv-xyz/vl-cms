import { createFileRoute } from "@tanstack/react-router"
import OrderPage from "@/features/sale/order"

export const Route = createFileRoute("/_authenticated/sales/orders/")({
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

        customer_id:
            search.customer_id !== undefined &&
                !isNaN(Number(search.customer_id))
                ? Number(search.customer_id)
                : undefined,

        employee_id:
            search.employee_id !== undefined &&
                !isNaN(Number(search.employee_id))
                ? Number(search.employee_id)
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
    component: OrderPage,
})