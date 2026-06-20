import { createFileRoute } from "@tanstack/react-router"
import SalaryAdjustmentPage from "@/features/salary-adjustment"

export const Route = createFileRoute("/_authenticated/salary/adjustments/")({
  component: SalaryAdjustmentPage,
})
