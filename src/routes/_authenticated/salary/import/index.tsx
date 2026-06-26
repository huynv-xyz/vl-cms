import { createFileRoute } from "@tanstack/react-router"
import SalaryImportPage from "@/features/salary-import"

export const Route = createFileRoute("/_authenticated/salary/import/")({
  component: SalaryImportPage,
})
