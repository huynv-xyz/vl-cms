import { createFileRoute } from "@tanstack/react-router"
import PayrollResultPage from "@/features/payroll-result"

export const Route = createFileRoute("/_authenticated/salary/payroll-result/")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page ?? 1),
    size: Number(search.size ?? 20),
    keyword: typeof search.keyword === "string" ? search.keyword : "",
    period: typeof search.period === "string" ? search.period : undefined,
  }),
  component: PayrollResultPage,
})
