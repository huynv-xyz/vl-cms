import { createFileRoute } from "@tanstack/react-router"
import VipCustomerDetailPage from "@/features/vip/customer/detail"

export const Route = createFileRoute("/_authenticated/vip/customer/$id")({
    parseParams: (params) => ({
        id: Number(params.id),
    }),
    validateSearch: (search: Record<string, unknown>) => ({
        as_of_date: typeof search.as_of_date === "string" ? search.as_of_date : undefined,
        from_date: typeof search.from_date === "string" ? search.from_date : undefined,
        to_date: typeof search.to_date === "string" ? search.to_date : undefined,
    }),
    component: VipCustomerDetailPage,
})
