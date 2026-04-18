import { createFileRoute } from "@tanstack/react-router"
import VipCustomerDetailPage from "@/features/vip/customer/detail"

export const Route = createFileRoute("/_authenticated/vip/customer/$id")({
    parseParams: (params) => ({
        id: Number(params.id),
    }),
    component: VipCustomerDetailPage,
})