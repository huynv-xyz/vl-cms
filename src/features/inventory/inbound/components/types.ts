export type InboundFormValues = {
    inbound_no?: string

    inbound_date: string
    inbound_type: "OPENING" | "PURCHASE" | "PRODUCTION" | "OTHER"

    product_id: number
    warehouse_id: number

    lot_no?: string
    quantity: number
    unit_cost: number

    source_no?: string
    note?: string
}