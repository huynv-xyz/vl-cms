import { createFileRoute } from "@tanstack/react-router"
import CustomerVipPage from "@/features/vip/customer"

export const Route = createFileRoute("/_authenticated/vip/customer/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === 'string' ? search.keyword : undefined,
        region: typeof search.region === 'string' ? search.region : undefined,
        tier_code: typeof search.tier_code === 'string' ? search.tier_code : undefined,
        group_code: typeof search.group_code === 'string' ? search.group_code : undefined,
        calc_year: typeof search.calc_year === 'string' ? search.calc_year : undefined,
        customer_type: typeof search.customer_type === 'string' ? search.customer_type : undefined,
        customer_code: typeof search.customer_code === 'string' ? search.customer_code : undefined,
    }),
    component: CustomerVipPage,
})
