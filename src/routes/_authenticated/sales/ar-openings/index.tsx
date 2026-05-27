import ArOpeningPage from "@/features/sale/ar-opening"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/sales/ar-openings/")({
    validateSearch: (search) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        from_date: typeof search.from_date === "string" ? search.from_date : undefined,
        to_date: typeof search.to_date === "string" ? search.to_date : undefined,
        customer_id: typeof search.customer_id === "string" ? search.customer_id : undefined,
    }),
    component: ArOpeningPage,
})
