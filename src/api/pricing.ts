import { apiGet, apiPost } from "@/api/client"
import { createCrudApi } from "@/api/crud"
import { productGroupApi } from "@/api/product-group"
import type {
    CalculatePricingRequest,
    GenerateMasterSkusRequest,
    GenerateSelectedPricesRequest,
    PricingListParams,
    PricingMarginRule,
    PricingMasterSku,
    PricingPackagingCostRule,
    PricingPriceMovement,
    PricingSelectedPrice,
    PricingSkuPackagingProfile,
    PricingSnapshot,
    PricingSnapshotItem,
    PricingTransportRule,
    PricingUnitConversionRule,
    ProductPricingGroup,
} from "@/features/pricing/data/schema"

type WithId = { id: number }
type Create<T> = Partial<T>
type Update<T> = Partial<T> & WithId

export const pricingGroupsApi = productGroupApi as unknown as ReturnType<typeof createCrudApi<ProductPricingGroup, Create<ProductPricingGroup>, Update<ProductPricingGroup>, PricingListParams>>
export const pricingPriceMovementsApi = createCrudApi<PricingPriceMovement, Create<PricingPriceMovement>, Update<PricingPriceMovement>, PricingListParams>("/pricing/price-movements")
export const pricingSelectedPricesApi = createCrudApi<PricingSelectedPrice, Create<PricingSelectedPrice>, Update<PricingSelectedPrice>, PricingListParams>("/pricing/selected-prices")
export const pricingSkuPackagingProfilesApi = createCrudApi<PricingSkuPackagingProfile, Create<PricingSkuPackagingProfile>, Update<PricingSkuPackagingProfile>, PricingListParams>("/pricing/packaging-profiles")
export const pricingPackagingCostRulesApi = createCrudApi<PricingPackagingCostRule, Create<PricingPackagingCostRule>, Update<PricingPackagingCostRule>, PricingListParams>("/pricing/packaging-cost-rules")
export const pricingMasterSkusApi = createCrudApi<PricingMasterSku, Create<PricingMasterSku>, Update<PricingMasterSku>, PricingListParams>("/pricing/master-skus")
export const pricingMarginRulesApi = createCrudApi<PricingMarginRule, Create<PricingMarginRule>, Update<PricingMarginRule>, PricingListParams>("/pricing/margin-rules")
export const pricingTransportRulesApi = createCrudApi<PricingTransportRule, Create<PricingTransportRule>, Update<PricingTransportRule>, PricingListParams>("/pricing/transport-rules")
export const pricingUnitConversionRulesApi = createCrudApi<PricingUnitConversionRule, Create<PricingUnitConversionRule>, Update<PricingUnitConversionRule>, PricingListParams>("/pricing/unit-conversion-rules")
export const pricingSnapshotsApi = createCrudApi<PricingSnapshot, Create<PricingSnapshot>, Update<PricingSnapshot>, PricingListParams>("/pricing/snapshots")

export function generateSelectedPrices(body: GenerateSelectedPricesRequest) {
    return apiPost<PricingSelectedPrice[]>("/pricing/selected-prices/generate", body)
}

export function generateMasterSkus(body: GenerateMasterSkusRequest) {
    return apiPost<PricingMasterSku[]>("/pricing/master-skus/generate", body)
}

export function calculatePricing(body: CalculatePricingRequest) {
    return apiPost<PricingSnapshot>("/pricing/snapshots/calculate", body)
}

export function listPricingSnapshotItems(snapshotId: number) {
    return apiGet<PricingSnapshotItem[]>(`/pricing/snapshots/${snapshotId}/items`)
}
