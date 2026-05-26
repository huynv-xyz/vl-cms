import { createFileRoute } from "@tanstack/react-router"
import PricingV2Page from "@/features/pricing-v2"

export const Route = createFileRoute("/_authenticated/pricing-v2/costing/")({
    component: () => <PricingV2Page initialTab="costing" />,
})
