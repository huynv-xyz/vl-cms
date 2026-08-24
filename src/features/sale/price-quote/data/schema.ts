export type SalesPriceQuoteSheetType = "KHO_DL" | "TAI_KHO_VLIFE"

export type SalesPriceQuoteImport = {
    id: number
    source_file_name: string
    imported_at: string
    imported_by?: number | null
    total_rows: number
}

export type SalesPriceQuoteRow = {
    id: number
    import_id: number
    sheet_type: SalesPriceQuoteSheetType
    source_row_number: number
    display_order?: number | null
    product_sku: string
    product_name?: string | null
    usage_description?: string | null
    package_size?: string | null
    unit?: string | null
    origin_or_type?: string | null
    selling_note?: string | null
    cash_price?: number | null
    credit_price_8_10_days?: number | null
    credit_price_30_days?: number | null
    product_group_code?: string | null
    product_group_name?: string | null
}

export type SalesPriceQuoteHeader = {
    id: number
    import_id: number
    sheet_type: SalesPriceQuoteSheetType
    company_line?: string | null
    address_line?: string | null
    document_line?: string | null
    left_reference?: string | null
    right_reference?: string | null
    quote_title?: string | null
    validity_line?: string | null
    greeting_line?: string | null
    intro_line?: string | null
    price_header?: string | null
}

export type SalesPriceQuoteFooter = {
    id: number
    import_id: number
    sheet_type: SalesPriceQuoteSheetType
    product_group_name: string
    pricing_note?: string | null
    payment_note?: string | null
    thank_you_note?: string | null
    closing_note?: string | null
}
