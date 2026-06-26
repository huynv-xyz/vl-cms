import { createFileRoute } from "@tanstack/react-router"
import PayrollDetailPage from "@/features/payroll-result/detail"

export const Route = createFileRoute("/_authenticated/salary/payroll-result/$employeeId/")({
  validateSearch: (search: Record<string, unknown>) => ({
    period: typeof search.period === "string" ? search.period : "",
  }),
  component: () => {
    const { employeeId } = Route.useParams()
    const { period } = Route.useSearch()
    return <PayrollDetailPage employeeId={Number(employeeId)} period={period} />
  },
})
