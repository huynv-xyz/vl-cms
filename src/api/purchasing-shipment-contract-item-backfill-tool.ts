import { apiPost } from "@/api/client"

export type BackfillIssue = {
    shipment_item_id: number
    shipment_id: number
    shipment_code?: string
    contract_id: number
    contract_code?: string
    product_id: number
    product_code?: string
    contract_item_id?: number
    match_count: number
    reason: string
}

export type BackfillPreview = {
    executable: boolean
    total_items: number
    linked_count: number
    missing_count: number
    backfillable_count: number
    invalid_link_count: number
    missing_contract_item_count: number
    ambiguous_count: number
    invalid_links: BackfillIssue[]
    missing_contract_items: BackfillIssue[]
    ambiguous_items: BackfillIssue[]
}

export type BackfillResult = {
    success: boolean
    message: string
    before: BackfillPreview
    updated_count: number
    after: BackfillPreview
}

type RawBackfillPreview = Partial<BackfillPreview> & {
    totalItems?: number
    linkedCount?: number
    missingCount?: number
    backfillableCount?: number
    invalidLinkCount?: number
    missingContractItemCount?: number
    ambiguousCount?: number
    invalidLinks?: BackfillIssue[]
    missingContractItems?: BackfillIssue[]
    ambiguousItems?: BackfillIssue[]
}

type RawBackfillResult = Partial<BackfillResult> & {
    updatedCount?: number
    before?: RawBackfillPreview
    after?: RawBackfillPreview
}

function numberValue(value: unknown): number {
    return typeof value === "number" ? value : 0
}

function issueRows(value: unknown): BackfillIssue[] {
    return Array.isArray(value) ? value : []
}

function normalizePreview(raw: RawBackfillPreview): BackfillPreview {
    return {
        executable: raw.executable === true,
        total_items: numberValue(raw.total_items ?? raw.totalItems),
        linked_count: numberValue(raw.linked_count ?? raw.linkedCount),
        missing_count: numberValue(raw.missing_count ?? raw.missingCount),
        backfillable_count: numberValue(raw.backfillable_count ?? raw.backfillableCount),
        invalid_link_count: numberValue(raw.invalid_link_count ?? raw.invalidLinkCount),
        missing_contract_item_count: numberValue(
            raw.missing_contract_item_count ?? raw.missingContractItemCount
        ),
        ambiguous_count: numberValue(raw.ambiguous_count ?? raw.ambiguousCount),
        invalid_links: issueRows(raw.invalid_links ?? raw.invalidLinks),
        missing_contract_items: issueRows(raw.missing_contract_items ?? raw.missingContractItems),
        ambiguous_items: issueRows(raw.ambiguous_items ?? raw.ambiguousItems),
    }
}

function normalizeResult(raw: RawBackfillResult): BackfillResult {
    const before = normalizePreview(raw.before ?? {})
    const after = normalizePreview(raw.after ?? before)

    return {
        success: raw.success === true,
        message: raw.message || "",
        before,
        updated_count: numberValue(raw.updated_count ?? raw.updatedCount),
        after,
    }
}

export async function previewPurchasingShipmentContractItemBackfill() {
    const data = await apiPost<RawBackfillPreview>("/tools/purchasing-shipment-contract-item-backfill/preview")
    return normalizePreview(data)
}

export async function executePurchasingShipmentContractItemBackfill() {
    const data = await apiPost<RawBackfillResult>("/tools/purchasing-shipment-contract-item-backfill/execute")
    return normalizeResult(data)
}
