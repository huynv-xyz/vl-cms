import { createFileRoute } from "@tanstack/react-router"
import SalaryAuditPage from "@/features/salary-audit"

export const Route = createFileRoute("/_authenticated/salary/audit/")({
  component: SalaryAuditPage,
})
