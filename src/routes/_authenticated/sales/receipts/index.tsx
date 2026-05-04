import { createFileRoute } from "@tanstack/react-router"
import ReceiptPage from "@/features/sale/receipt"

export const Route = createFileRoute("/_authenticated/sales/receipts/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",

        status:
            typeof search.status === "string"
                ? search.status
                : undefined,

        method:
            typeof search.method === "string"
                ? search.method
                : undefined,

        customer_id:
            typeof search.customer_id === "string"
                ? search.customer_id
                : undefined,

        order_id:
            typeof search.order_id === "string"
                ? search.order_id
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
    component: ReceiptPage,
})