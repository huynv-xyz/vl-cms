import { createFileRoute } from "@tanstack/react-router"
import VipRecalcJobPage from "@/features/vip/recalc-job"

export const Route = createFileRoute("/_authenticated/vip/recalc-job/")({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
    }),
    component: VipRecalcJobPage,
})
