import { createFileRoute } from "@tanstack/react-router"
import SalesActualPage from "@/features/sales-actual"

export const Route = createFileRoute("/_authenticated/salary/sales-actuals/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === "string" ? search.keyword : "",

        period:
            typeof search.period === "string" || typeof search.period === "number"
                ? search.period
                : undefined,

        employeeId:
            typeof search.employeeId === "string" ||
                typeof search.employeeId === "number"
                ? search.employeeId
                : undefined,
    }),
    component: SalesActualPage,
})