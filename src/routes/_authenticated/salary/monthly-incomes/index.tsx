import { createFileRoute } from "@tanstack/react-router"
import { MonthlyIncomePage } from "@/features/payroll-config"

export const Route = createFileRoute("/_authenticated/salary/monthly-incomes/")({
  component: MonthlyIncomePage,
})
