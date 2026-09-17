import { apiPost } from "@/api/client"

export type VipPlanBackfillPreview = {
    executable: boolean
    target_count: number
    item_count: number
    targets_needing_backfill: number
    items_needing_backfill: number
    customer_years_without_primary: number
    duplicate_primary_count: number
    duplicate_plan_code_count: number
    orphan_item_count: number
    non_transactional_table_count: number
    samples: Array<Record<string, unknown>>
}

export type VipPlanBackfillResult = {
    success: boolean
    message: string
    target_updated_count: number
    target_point_updated_count: number
    item_updated_count: number
    primary_updated_count: number
    before: VipPlanBackfillPreview
    after: VipPlanBackfillPreview
}

export const checkVipCustomerPlanBackfill = () =>
    apiPost<VipPlanBackfillPreview>("/tools/vip-customer-plan-backfill/check", {})

export const applyVipCustomerPlanBackfill = () =>
    apiPost<VipPlanBackfillResult>("/tools/vip-customer-plan-backfill/apply", {})
