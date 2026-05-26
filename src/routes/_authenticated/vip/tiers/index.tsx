import z from "zod"
import { createFileRoute } from "@tanstack/react-router"
import TierVipPage from "@/features/vip/tier"

const searchSchema = z.object({
    // page trong URL: ?page=2
    page: z.coerce.number().int().positive().optional().catch(1),

    // pageSize trong URL: ?pageSize=20
    pageSize: z.coerce.number().int().positive().optional().catch(20),

    // filter text: ?filter=admin
    filter: z.string().optional().catch(""),

    // optional: filter theo status: all | active | inactive
    status: z
        .enum(["all", "active", "inactive"])
        .optional()
        .catch("all"),
})

export const Route = createFileRoute("/_authenticated/vip/tiers/")({
    validateSearch: searchSchema,
    component: TierVipPage,
})
