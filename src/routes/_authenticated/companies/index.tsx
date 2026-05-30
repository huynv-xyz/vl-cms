import { createFileRoute } from "@tanstack/react-router"
import CompanyPage from "@/features/company"

export const Route = createFileRoute("/_authenticated/companies/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: CompanyPage,
})
