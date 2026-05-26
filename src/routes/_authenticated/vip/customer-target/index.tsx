import { createFileRoute } from "@tanstack/react-router"
import VipCustomerTargetPage from "@/features/vip/customer-target"

export const Route = createFileRoute("/_authenticated/vip/customer-target/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",
    }),
    component: VipCustomerTargetPage,
})
