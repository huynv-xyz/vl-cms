import { createFileRoute } from "@tanstack/react-router"
import BusinessAreaPage from "@/features/business-area"

export const Route = createFileRoute("/_authenticated/business-areas/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1), size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        area_type: typeof search.area_type === "string" ? search.area_type : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    component: BusinessAreaPage,
})
