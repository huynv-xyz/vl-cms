export type Production = {
    id: number
    production_no?: string
    production_date?: string
    costing_period?: string
    daily_sequence?: number
    status?: string
    note?: string
    created_at?: string
    updated_at?: string

    items?: ProductionItem[]
    fifo_runs?: ProductionFifoAllocationRun[]
    warnings?: ProductionWarning[]
    action_logs?: ProductionActionLog[]
}

export type ProductionItem = {
    id: number
    production_id: number
    product_id: number
    warehouse_id: number

    bom_id?: number
    bom_version?: string
    bom_valid_from?: string
    bom_line_count?: number
    extra_line_count?: number
    material_line_count?: number

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

    materials?: ProductionMaterial[]
    extras?: ProductionExtraItem[]
    substitutions?: ProductionSubstitution[]
    outputs?: ProductionOutput[]
}

export type ProductionMaterial = {
    id: number
    production_id?: number
    production_item_id?: number
    product_id?: number
    original_product_id?: number
    warehouse_id?: number
    material_type?: string
    source_type?: string
    source_ref_id?: number
    bom_item_id?: number
    quantity_per_unit?: number
    quantity_original?: number
    quantity_required?: number
    lot_id?: number
    preferred_lot_no?: string
    check_status?: string
    fifo_status?: string
    fifo_unit_cost?: number
    fifo_total_cost?: number
    allocated_quantity?: number
    shortage_quantity?: number
    validation_message?: string
    line_no?: number
    note?: string
    product?: any
    original_product?: any
    warehouse?: any
    fifo_allocations?: ProductionFifoAllocation[]
}

export type ProductionFifoAllocation = {
    id: number
    allocation_run_id?: number
    production_material_id?: number
    inventory_lot_id?: number
    material_product_id?: number
    material_warehouse_id?: number
    lot_no?: string
    inbound_date?: string
    expiry_date?: string
    fifo_order?: number
    quantity?: number
    quantity_remaining?: number
    unit_cost?: number
    amount?: number
    is_preferred_lot?: boolean
    material_product?: any
    warehouse?: any
}

export type ProductionExtraItem = {
    id: number
    production_item_id?: number
    product_id?: number
    warehouse_id?: number
    material_type?: string
    quantity_per_unit?: number
    quantity?: number
    check_status?: string
    validation_message?: string
    line_no?: number
    note?: string
    product?: any
}

export type ProductionSubstitution = {
    id: number
    production_item_id?: number
    bom_item_id?: number
    original_product_id?: number
    substitute_product_id?: number
    quantity_original?: number
    quantity?: number
    reason?: string
    note?: string
    original_product?: any
    substitute_product?: any
}

export type ProductionOutput = {
    id: number
    production_item_id?: number
    product_id?: number
    warehouse_id?: number
    output_date?: string
    quantity?: number
    lot_no?: string
    expiry_date?: string
    unit_cost?: number
    total_cost?: number
    status?: string
    note?: string
    product?: any
    warehouse?: any
}

export type ProductionFifoAllocationRun = {
    id: number
    run_scope?: string
    status?: string
    started_at?: string
    finished_at?: string
    note?: string
}

export type ProductionWarning = {
    id: number
    warning_code?: string
    severity?: string
    message?: string
    resolved_at?: string
}

export type ProductionActionLog = {
    id: number
    entity_type?: string
    entity_id?: number
    action?: string
    note?: string
    created_at?: string
}
