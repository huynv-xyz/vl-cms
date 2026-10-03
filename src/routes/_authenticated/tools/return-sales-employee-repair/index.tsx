import { createFileRoute } from "@tanstack/react-router"

import ReturnSalesEmployeeRepairToolPage from "@/features/return-sales-employee-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/return-sales-employee-repair/")({
    component: ReturnSalesEmployeeRepairToolPage,
})
