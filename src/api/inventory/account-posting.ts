import { apiGet, type PagedResult } from "@/api/client"

export type InventoryAccountPosting = {
    account: string
    debit_amount: number
    credit_amount: number
}

export type InventoryAccountPostingTotals = {
    debit_amount: number
    credit_amount: number
    difference: number
    balanced: boolean
}

export type InventoryAccountPostingParams = {
    page: number
    size: number
    from_date?: string
    to_date?: string
    account?: string
}

export function listInventoryAccountPostings(params: InventoryAccountPostingParams) {
    return apiGet<PagedResult<InventoryAccountPosting> & { totals: InventoryAccountPostingTotals }>(
        "/inventory/account-postings",
        params,
    )
}
