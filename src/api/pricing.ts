import { apiGet, apiPost } from "@/api/client"
import { createCrudApi } from "@/api/crud"
import { productGroupApi } from "@/api/product-group"
import type {
    CalculatePricingRequest,
    PricingListParams,
    PricingSnapshot,
    PricingSnapshotItem,
    ProductPricingConfig,
    ProductPricingGroup,
} from "@/features/pricing/data/schema"

type WithId = { id: number }
type Create<T> = Partial<T>
type Update<T> = Partial<T> & WithId

export const pricingGroupsApi = productGroupApi as unknown as ReturnType<typeof createCrudApi<ProductPricingGroup, Create<ProductPricingGroup>, Update<ProductPricingGroup>, PricingListParams>>
export const pricingConfigsApi = createCrudApi<ProductPricingConfig, Create<ProductPricingConfig>, Update<ProductPricingConfig>, PricingListParams>("/pricing/configs")
export const pricingSnapshotsApi = createCrudApi<PricingSnapshot, Create<PricingSnapshot>, Update<PricingSnapshot>, PricingListParams>("/pricing/snapshots")
export const pricingSnapshotItemsApi = createCrudApi<PricingSnapshotItem, Create<PricingSnapshotItem>, Update<PricingSnapshotItem>, PricingListParams>("/pricing/snapshot-items")

export function calculatePricing(body: CalculatePricingRequest) {
    return apiPost<PricingSnapshot>("/pricing/snapshots/calculate", body)
}

export function listPricingSnapshotItems(snapshotId: number) {
    return apiGet<PricingSnapshotItem[]>(`/pricing/snapshots/${snapshotId}/items`)
}
