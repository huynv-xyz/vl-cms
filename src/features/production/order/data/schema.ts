export type Production = {
    id: number
    production_no?: string
    production_date?: string
    status?: string
    note?: string
    created_at?: string
    updated_at?: string

    items?: ProductionItem[]
}

export type ProductionItem = {
    id: number
    production_id: number
    product_id: number
    warehouse_id: number

    bom_id?: number
    bom_version?: string
    bom_valid_from?: string

    quantity_plan?: number
    quantity_done?: number

    total_nvl_cost?: number
    total_bb_cost?: number
    processing_cost?: number
    overhead_cost?: number
    total_cost?: number
    unit_cost?: number

    check_status?: string
    fifo_status?: string

    output_lot_no?: string
    output_expiry_date?: string

    note?: string
    created_at?: string
    updated_at?: string

    product?: any
    warehouse?: any

    materials?: any[]
    extras?: any[]
    substitutions?: any[]
    outputs?: any[]
}