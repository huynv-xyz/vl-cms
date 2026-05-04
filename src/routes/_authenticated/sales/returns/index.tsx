import { createFileRoute } from "@tanstack/react-router"
import ReturnPage from "@/features/sale/return"

export const Route = createFileRoute("/_authenticated/sales/returns/")({
    validateSearch: (search: Record<string, unknown>) => {

        const page = Number(search.page)
        const size = Number(search.size)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 20 : size,

            keyword: typeof search.keyword === "string" ? search.keyword : "",

            status: typeof search.status === "string" ? search.status : "",

            order_id: search.order_id ? Number(search.order_id) : undefined,
            export_id: search.export_id ? Number(search.export_id) : undefined,
        }
    },

    component: ReturnPage,
})