export type InventoryLotSourceType =
    | "OPENING"
    | "PURCHASE"
    | "PRODUCTION"
    | "ADJUSTMENT"

export type InventoryInbound = {
    id: number

    product_id: number
    warehouse_id: number

    lot_no?: string | null
    inbound_date: string

    source_type: InventoryLotSourceType
    source_id?: number | null
    source_no?: string | null

    quantity_in: number
    quantity_remaining: number

    unit_cost: number

    created_at?: string
    updated_at?: string

    product?: any
    warehouse?: any
}

export type InventoryInboundFormValues = {
    product_id?: number
    warehouse_id?: number

    lot_no?: string
    inbound_date: string

    source_type: InventoryLotSourceType
    source_id?: number
    source_no?: string

    quantity_in: number
    unit_cost: number
}