import { createFileRoute } from "@tanstack/react-router"
import VipCustomerPlanBackfillToolPage from "@/features/vip-customer-plan-backfill-tool"

export const Route = createFileRoute("/_authenticated/tools/vip-customer-plan-backfill/")({
    component: VipCustomerPlanBackfillToolPage,
})
