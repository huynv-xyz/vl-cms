import type { VipRecalcJob } from "@/features/vip/recalc-job/data/schema"
import { createCrudApi } from "@/api/crud"

export type VipRecalcJobListParams = {
    page: number
    size: number
    status?: string
    calc_year?: number
}

const vipRecalcJobApi = createCrudApi<
    VipRecalcJob,
    never,
    { id: number },
    VipRecalcJobListParams
>("/vip/recalc-jobs")

export const listVipRecalcJobs = vipRecalcJobApi.list
