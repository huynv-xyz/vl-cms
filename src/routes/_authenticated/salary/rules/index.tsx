import { createFileRoute } from "@tanstack/react-router"
import SalaryRulesPage from "@/features/salary-rules"

export const Route = createFileRoute("/_authenticated/salary/rules/")({
  component: SalaryRulesPage,
})
