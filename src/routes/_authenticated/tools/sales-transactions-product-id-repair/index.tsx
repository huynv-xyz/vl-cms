import { createFileRoute } from "@tanstack/react-router"

import SalesTransactionsProductIdRepairToolPage from "@/features/sales-transactions-product-id-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/sales-transactions-product-id-repair/")({
    component: SalesTransactionsProductIdRepairToolPage,
})
