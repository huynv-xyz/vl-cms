import { createFileRoute } from "@tanstack/react-router"
import CustomerPage from "@/features/customer"

export const Route = createFileRoute("/_authenticated/customers/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
        type: typeof search.type === "string" ? search.type : undefined,
        region: typeof search.region === "string" ? search.region : undefined,
        status: typeof search.status === "string" ? search.status : undefined,
    }),
    component: CustomerPage,
})
