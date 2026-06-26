import { createFileRoute } from "@tanstack/react-router"
import SalarySetupPage from "@/features/salary-setup"

export const Route = createFileRoute("/_authenticated/salary/setup/")({
  component: SalarySetupPage,
})
