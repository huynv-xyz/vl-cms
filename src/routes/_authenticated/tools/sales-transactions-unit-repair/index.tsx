import { createFileRoute } from "@tanstack/react-router"

import SalesTransactionsUnitRepairToolPage from "@/features/sales-transactions-unit-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/sales-transactions-unit-repair/")({
    component: SalesTransactionsUnitRepairToolPage,
})
