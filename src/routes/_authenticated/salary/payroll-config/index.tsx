import { createFileRoute } from "@tanstack/react-router"
import PayrollConfigPage from "@/features/payroll-config"

export const Route = createFileRoute("/_authenticated/salary/payroll-config/")({
  component: PayrollConfigPage,
})
