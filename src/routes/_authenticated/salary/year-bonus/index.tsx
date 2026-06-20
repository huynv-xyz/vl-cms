import { createFileRoute } from "@tanstack/react-router"
import YearBonusPage from "@/features/year-bonus"

export const Route = createFileRoute("/_authenticated/salary/year-bonus/")({
  component: YearBonusPage,
})
