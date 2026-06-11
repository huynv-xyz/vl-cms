import { createFileRoute } from "@tanstack/react-router"
import VipCustomerPlanPage from "@/features/vip/customer-plan"

export const Route = createFileRoute("/_authenticated/vip/customer-plan/")({
    validateSearch: (search: Record<string, unknown>) => ({
        customer_id: typeof search.customer_id === "string" ? search.customer_id : undefined,
        calc_year: typeof search.calc_year === "number" ? search.calc_year : typeof search.calc_year === "string" ? Number(search.calc_year) : undefined,
        from_date: typeof search.from_date === "string" ? search.from_date : undefined,
        to_date: typeof search.to_date === "string" ? search.to_date : undefined,
    }),
    component: VipCustomerPlanPage,
})
