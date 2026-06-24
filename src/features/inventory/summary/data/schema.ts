export type InventorySummary = {
    id: number
    product_id: number
    warehouse_id: number

    product_code: string
    product_name: string
    unit?: string | null
    quote_name?: string | null
    nature?: string | null
    warehouse_code: string
    warehouse_name: string

    opening_quantity: number
    opening_value: number
    inbound_quantity: number
    inbound_value: number
    outbound_quantity: number
    outbound_value: number
    closing_quantity: number
    closing_value: number
}

export type InventorySummaryTotals = {
    opening_quantity: number
    opening_value: number
    inbound_quantity: number
    inbound_value: number
    outbound_quantity: number
    outbound_value: number
    closing_quantity: number
    closing_value: number
}
