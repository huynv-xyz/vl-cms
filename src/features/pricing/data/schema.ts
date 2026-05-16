export type PricingListParams = {
    page: number
    size: number
    keyword?: string
    active?: boolean | string
    pricing_group_id?: number | string
    product_id?: number | string
    region_code?: string
    pricing_month?: string
    status?: string
    snapshot_id?: number | string
}

export type ProductPricingGroup = {
    id: number
    code: string
    name: string
    vat_rate?: number
    active?: boolean
    created_at?: string
    updated_at?: string
}

export type ProductPricingConfig = {
    id: number
    product_id: number
    pricing_group_id: number
    region_code?: string
    profit_type?: "PERCENT" | "AMOUNT"
    profit_value?: number
    adjustment_amount_vnd?: number
    rounding_unit?: number
    vat_rate?: number
    display_order?: number
    active?: boolean
}

export type PricingSnapshot = {
    id: number
    code: string
    pricing_date: string
    pricing_month?: string
    region_code?: string
    pricing_group_id?: number
    price_method?: "LATEST" | "FIFO" | "MONTHLY_AVERAGE"
    status?: string
    note?: string
    created_at?: string
    updated_at?: string
}

export type PricingSnapshotItem = {
    id: number
    snapshot_id: number
    product_id: number
    pricing_group_id?: number
    product_code?: string
    display_name?: string
    specification_text?: string
    origin?: string
    sale_unit?: string
    region_code?: string
    payment_term?: string
    price_method?: string
    contract_id?: number
    contract_item_id?: number
    contract_code?: string
    contract_date?: string
    currency_code?: string
    exchange_rate?: number
    contract_quantity?: number
    foreign_unit_price?: number
    base_purchase_price_vnd?: number
    packaging_price_vnd?: number
    freight_price_vnd?: number
    import_tax_amount_vnd?: number
    handling_fee_vnd?: number
    total_cost_vnd?: number
    profit_type?: string
    profit_value?: number
    profit_amount_vnd?: number
    adjustment_amount_vnd?: number
    price_before_vat?: number
    vat_rate?: number
    price_after_vat?: number
    rounding_unit?: number
    rounded_price_before_vat?: number
    rounded_price_after_vat?: number
    warning_text?: string
    note?: string
}

export type CalculatePricingRequest = {
    code?: string
    pricing_date?: string
    pricing_month?: string
    region_code?: string
    pricing_group_id?: number
    price_method?: "LATEST" | "FIFO" | "MONTHLY_AVERAGE"
    note?: string
}
