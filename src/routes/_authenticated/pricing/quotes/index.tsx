import { createFileRoute } from "@tanstack/react-router"
import PricingV2Page from "@/features/pricing-v2"

export const Route = createFileRoute("/_authenticated/pricing/quotes/")({
    component: () => <PricingV2Page initialTab="quotes" />,
})
