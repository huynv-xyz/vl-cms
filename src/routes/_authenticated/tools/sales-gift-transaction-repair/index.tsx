import { createFileRoute } from "@tanstack/react-router"
import SalesGiftTransactionRepairToolPage from "@/features/sales-gift-transaction-repair-tool"

export const Route = createFileRoute("/_authenticated/tools/sales-gift-transaction-repair/")({
    component: SalesGiftTransactionRepairToolPage,
})
