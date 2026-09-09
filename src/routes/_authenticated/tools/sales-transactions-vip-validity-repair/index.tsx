import { createFileRoute } from "@tanstack/react-router"

import SalesTransactionsVipValidityRepairToolPage from "@/features/sales-transactions-vip-validity-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/sales-transactions-vip-validity-repair/")({
    component: SalesTransactionsVipValidityRepairToolPage,
})
