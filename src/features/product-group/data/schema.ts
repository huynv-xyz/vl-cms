export type ProductGroup = {
    id: number
    code: string
    name: string
    description?: string
    standard_unit?: "TON" | "KG" | "LIT" | string
    default_price_method?: "LATEST" | "FIFO" | "MONTHLY_AVERAGE"
    default_vat_rate?: number
    default_margin_type?: "PERCENT" | "AMOUNT"
    default_margin_value?: number
    active?: boolean
    created_at?: string
    updated_at?: string
}
