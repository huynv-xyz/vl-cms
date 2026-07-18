export type InventoryLotSourceType =
    | "OPENING"
    | "PURCHASE"
    | "PRODUCTION"
    | "ADJUSTMENT"

export type InventoryLotExpiryStatus =
    | "VALID"
    | "NEAR_EXPIRY"
    | "EXPIRED"
    | "NO_EXPIRY"

// ===== ENTITY (response từ API) =====
export type InventoryLot = {
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
    purchase_unit_cost?: number
    handling_fee_total?: number
    handling_fee_unit?: number
    expiry_date?: string | null
    expiry_status?: InventoryLotExpiryStatus
    days_to_expiry?: number | null
    expiry_message?: string
    nature?: string | null

    created_at?: string
    updated_at?: string

    product?: any
    warehouse?: any
}

// ===== CREATE / UPDATE FORM =====
export type InventoryLotFormValues = {
    product_id?: number
    warehouse_id?: number

    lot_no?: string
    inbound_date: string

    source_type: InventoryLotSourceType
    source_id?: number
    source_no?: string

    quantity_in?: number
    unit_cost?: number
    purchase_unit_cost?: number
    handling_fee_total?: number
    handling_fee_unit?: number
}
