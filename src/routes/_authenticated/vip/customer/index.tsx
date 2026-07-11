import { createFileRoute } from "@tanstack/react-router"
import CustomerVipPage from "@/features/vip/customer"

export const Route = createFileRoute("/_authenticated/vip/customer/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 50),
        calc_year: Number(search.calc_year ?? new Date().getFullYear()),
        keyword: typeof search.keyword === 'string' ? search.keyword : undefined,
        region: typeof search.region === 'string' ? search.region : undefined,
        tier_code: typeof search.tier_code === 'string' ? search.tier_code : undefined,
        group_code: typeof search.group_code === 'string' ? search.group_code : undefined,
        customer_type: typeof search.customer_type === 'string' ? search.customer_type : undefined,
        customer_code: typeof search.customer_code === 'string' ? search.customer_code : undefined,
        as_of_date: typeof search.as_of_date === 'string' ? search.as_of_date : undefined,
        from_date: typeof search.from_date === 'string' ? search.from_date : undefined,
        to_date: typeof search.to_date === 'string' ? search.to_date : undefined,
    }),
    component: CustomerVipPage,
})
