export type PricingListParams = {
    page: number
    size: number
    keyword?: string
    active?: boolean | string
    product_id?: number | string
    product_group_id?: number | string
    region_code?: string
    match_type?: string
    misa_code?: string
    pricing_month?: string
    status?: string
    snapshot_id?: number | string
}

export type ProductPricingGroup = {
    id: number
    code: string
    name: string
    standard_unit?: "TON" | "KG" | "LIT" | string
    default_vat_rate?: number
    active?: boolean
    created_at?: string
    updated_at?: string
}

export type PricingPriceMethod = "WAVG" | "LATEST_LOT" | "MANUAL"
export type PricingMarginType = "PERCENT" | "AMOUNT"
export type PricingMatchType = "DEFAULT" | "PRODUCT_NAME" | "PRODUCT_GROUP"
export type PricingRoundingMode = "KG_STEP" | "SIGNIFICANT_3"

export type PricingPriceMovement = {
    id: number
    product_id: number
    misa_code?: string
    lot_code?: string
    source_type?: string
    source_id?: number
    source_item_id?: number
    movement_date?: string
    quantity?: number
    unit_code?: string
    unit_price_vnd?: number
    unit_price_vnd_per_kg?: number
    previous_wavg_price_vnd_per_kg?: number
    wavg_price_vnd_per_kg?: number
    note?: string
    active?: boolean
}

export type PricingSelectedPrice = {
    id: number
    pricing_month: string
    pricing_date?: string
    product_id: number
    product_group_id?: number
    misa_code?: string
    price_method?: PricingPriceMethod
    price_movement_id?: number
    source_contract_id?: number
    source_contract_item_id?: number
    source_contract_code?: string
    source_type?: "CONTRACT" | "MONTHLY_AVERAGE" | "MANUAL" | string
    manual_price_vnd_per_kg?: number
    applied_price_vnd_per_kg?: number
    previous_price_vnd_per_kg?: number
    increase_pct?: number
    warning_text?: string
    note?: string
}

export type PricingSkuPackagingProfile = {
    id: number
    product_id: number
    product_group_id?: number
    formula_code?: string
    origin?: string
    size_code?: string
    unit_text?: string
    pack_type?: string
    pack_match_key?: string
    representative_product_id?: number
    is_representative?: boolean
    size_ratio_to_kg?: number
    active?: boolean
}

export type PricingPackagingCostRule = {
    id: number
    pack_match_key: string
    pack_name?: string
    base_pack_cost_vnd_per_kg?: number
    priority?: number
    active?: boolean
}

export type PricingMasterSku = {
    id: number
    pricing_month: string
    product_id: number
    product_group_id?: number
    selected_price_id?: number
    packaging_profile_id?: number
    packaging_cost_rule_id?: number
    raw_material_price_vnd_per_unit?: number
    pack_cost_vnd_per_unit?: number
    price_with_packaging_vnd?: number
    warning_text?: string
}

export type PricingMarginRule = {
    id: number
    region_code?: string
    product_group_id: number
    margin_type?: PricingMarginType
    margin_value?: number
    warehouse_adjustment_vnd?: number
    cash_adjustment_vnd?: number
    term_8_10_adjustment_vnd?: number
    term_30_adjustment_vnd?: number
    priority?: number
    active?: boolean
}

export type PricingTransportRule = {
    id: number
    region_code?: string
    match_type?: PricingMatchType
    match_value?: string
    product_group_id?: number
    transport_cost_vnd?: number
    cash_transport_cost_vnd?: number
    term_8_10_transport_cost_vnd?: number
    term_30_transport_cost_vnd?: number
    priority?: number
    active?: boolean
}

export type PricingUnitConversionRule = {
    id: number
    product_id?: number
    unit_text?: string
    size_code?: string
    sale_unit_code: string
    sale_unit_name?: string
    conversion_factor?: number
    rounding_mode?: PricingRoundingMode
    is_default?: boolean
    active?: boolean
}

export type PricingSnapshot = {
    id: number
    code: string
    pricing_date: string
    pricing_month?: string
    region_code?: string
    product_group_id?: number
    status?: string
    note?: string
    created_at?: string
    updated_at?: string
}

export type PricingSnapshotItem = {
    id: number
    snapshot_id: number
    product_id: number
    product_group_id?: number
    master_sku_id?: number
    margin_rule_id?: number
    transport_rule_id?: number
    conversion_rule_id?: number
    product_code?: string
    product_name?: string
    representative_product_id?: number
    raw_material_price_vnd?: number
    pack_cost_vnd?: number
    price_with_packaging_vnd?: number
    margin_amount_vnd?: number
    base_price_vnd?: number
    transport_cost_vnd?: number
    warehouse_price_vnd?: number
    cash_price_vnd?: number
    term_8_10_price_vnd?: number
    term_30_price_vnd?: number
    rounding_mode?: string
    rounded_warehouse_price_vnd?: number
    rounded_cash_price_vnd?: number
    rounded_term_8_10_price_vnd?: number
    rounded_term_30_price_vnd?: number
    sale_unit_code?: string
    sale_unit_name?: string
    conversion_factor?: number
    final_warehouse_price_vnd?: number
    final_cash_price_vnd?: number
    final_term_8_10_price_vnd?: number
    final_term_30_price_vnd?: number
    warning_text?: string
    note?: string
}

export type GenerateSelectedPricesRequest = {
    pricing_month?: string
    pricing_date?: string
    product_group_id?: number
    price_method?: PricingPriceMethod
}

export type GenerateMasterSkusRequest = {
    pricing_month?: string
    product_group_id?: number
}

export type CalculatePricingRequest = {
    code?: string
    pricing_date?: string
    pricing_month?: string
    region_code?: string
    product_group_id?: number
    price_method?: PricingPriceMethod
    note?: string
}
