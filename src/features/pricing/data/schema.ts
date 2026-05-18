export type PricingListParams = {
    page: number
    size: number
    keyword?: string
    active?: boolean | string
    region_id?: number | string
    group_id?: number | string
    product_id?: number | string
    match_type?: string
    pricing_month?: string
    status?: string
    snapshot_id?: number | string
}

export type PricingPriceMethod = "WAVG" | "LATEST" | "FIFO"
export type PricingMarginType = "PERCENT" | "AMOUNT"
export type PricingTransportMatchType = "DEFAULT" | "PRODUCT" | "GROUP"

export type PricingMarginRule = {
    id: number
    region_id?: number
    group_id: number
    margin_type?: PricingMarginType
    margin_value?: number
    warehouse_adjustment_vnd?: number
    cash_adjustment_vnd?: number
    term_8_10_adjustment_vnd?: number
    term_30_adjustment_vnd?: number
    priority?: number
    active?: boolean
    created_at?: string
    updated_at?: string
}

export type PricingTransportRule = {
    id: number
    region_id?: number
    match_type?: PricingTransportMatchType
    product_id?: number
    group_id?: number
    transport_cost_vnd?: number
    cash_transport_cost_vnd?: number
    term_8_10_transport_cost_vnd?: number
    term_30_transport_cost_vnd?: number
    priority?: number
    active?: boolean
    created_at?: string
    updated_at?: string
}

export type PricingSnapshot = {
    id: number
    code: string
    pricing_month: string
    pricing_date: string
    region_id?: number
    region?: {
        id: number
        code?: string
        name?: string
    }
    group_id?: number
    price_method?: PricingPriceMethod
    status?: string
    note?: string
    created_at?: string
    updated_at?: string
}

export type PricingSnapshotItem = {
    id: number
    snapshot_id: number
    product_id: number
    group_id?: number
    product_code?: string
    product_name?: string
    base_unit_code?: string
    sale_unit_code?: string
    sale_unit_name?: string
    sale_unit_factor?: number
    purchase_price_vnd?: number
    margin_amount_vnd?: number
    transport_cost_vnd?: number
    base_price_vnd?: number
    vat_rate?: number
    price_after_vat_vnd?: number
    rounding_mode?: string
    rounding_unit?: number
    warehouse_price_vnd?: number
    cash_price_vnd?: number
    term_8_10_price_vnd?: number
    term_30_price_vnd?: number
    source_contract_id?: number
    source_contract_item_id?: number
    source_summary?: string
    warning_text?: string
    note?: string
}

export type PricingSnapshotItemSource = {
    id: number
    snapshot_item_id: number
    contract_id: number
    contract_code?: string
    contract_item_id: number
    source_date?: string
    source_quantity?: number
    source_price_vnd?: number
    created_at?: string
}

export type CalculatePricingRequest = {
    code?: string
    pricing_date?: string
    pricing_month?: string
    region_id?: number
    group_id?: number
    price_method?: PricingPriceMethod
    note?: string
}
