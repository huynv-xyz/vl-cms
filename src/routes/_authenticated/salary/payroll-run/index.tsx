import { createFileRoute } from "@tanstack/react-router"
import PayrollRunPage from "@/features/payroll-run"

export const Route = createFileRoute("/_authenticated/salary/payroll-run/")({
  component: PayrollRunPage,
})
