import { createFileRoute } from "@tanstack/react-router"
import ExportPage from "@/features/sale/export"

export const Route = createFileRoute("/_authenticated/sales/exports/")({
    validateSearch: (search: Record<string, unknown>) => {

        const page = Number(search.page)
        const size = Number(search.size)

        return {
            page: Number.isNaN(page) ? 1 : page,
            size: Number.isNaN(size) ? 20 : size,
            keyword: typeof search.keyword === "string" ? search.keyword : "",
            status: typeof search.status === "string" ? search.status : "",
        }
    },

    component: ExportPage,
})