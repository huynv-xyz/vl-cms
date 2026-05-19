import { apiGet, apiPost } from "@/api/client"
import { createCrudApi } from "@/api/crud"
import type {
    CalculatePricingRequest,
    PricingAlertConfig,
    PricingGroup,
    PricingListParams,
    PricingMarginRule,
    PricingPackagingCost,
    PricingPromotion,
    PricingSnapshot,
    PricingSnapshotItem,
    PricingSnapshotItemSource,
    PricingTransportRule,
} from "@/features/pricing/data/schema"

type WithId = { id: number }
type Create<T> = Partial<T>
type Update<T> = Partial<T> & WithId

export const pricingGroupsApi = createCrudApi<PricingGroup, Create<PricingGroup>, Update<PricingGroup>, PricingListParams>("/pricing/groups")
export const pricingMarginRulesApi = createCrudApi<PricingMarginRule, Create<PricingMarginRule>, Update<PricingMarginRule>, PricingListParams>("/pricing/margin-rules")
export const pricingTransportRulesApi = createCrudApi<PricingTransportRule, Create<PricingTransportRule>, Update<PricingTransportRule>, PricingListParams>("/pricing/transport-rules")
export const pricingPackagingCostsApi = createCrudApi<PricingPackagingCost, Create<PricingPackagingCost>, Update<PricingPackagingCost>, PricingListParams>("/pricing/packaging-costs")
export const pricingPromotionsApi = createCrudApi<PricingPromotion, Create<PricingPromotion>, Update<PricingPromotion>, PricingListParams>("/pricing/promotions")
export const pricingAlertConfigsApi = createCrudApi<PricingAlertConfig, Create<PricingAlertConfig>, Update<PricingAlertConfig>, PricingListParams>("/pricing/alert-configs")
export const pricingSnapshotsApi = createCrudApi<PricingSnapshot, Create<PricingSnapshot>, Update<PricingSnapshot>, PricingListParams>("/pricing/snapshots")
export const pricingSnapshotItemSourcesApi = createCrudApi<PricingSnapshotItemSource, Create<PricingSnapshotItemSource>, Update<PricingSnapshotItemSource>, PricingListParams>("/pricing/snapshot-item-sources")

export function calculatePricing(body: CalculatePricingRequest) {
    return apiPost<PricingSnapshot[]>("/pricing/snapshots/calculate", body)
}

export function listPricingSnapshotItems(snapshotId: number) {
    return apiGet<PricingSnapshotItem[]>(`/pricing/snapshots/${snapshotId}/items`)
}

export function listPricingSnapshotItemSources(snapshotItemId: number) {
    return apiGet<PricingSnapshotItemSource[]>(`/pricing/snapshots/items/${snapshotItemId}/sources`)
}
