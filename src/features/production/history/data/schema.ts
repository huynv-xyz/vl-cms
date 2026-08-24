export type ProductionHistoryRow = {
    id: number
    production_id: number
    production_no?: string
    production_date?: string
    production_time?: string
    status?: string
    physical_warehouse_id?: number
    physical_warehouse_code?: string
    physical_warehouse_name?: string
    product_id?: number
    product_code?: string
    product_name?: string
    product_unit?: string
    warehouse_id?: number
    warehouse_code?: string
    warehouse_name?: string
    bom_id?: number
    bom_version?: string
    quantity_plan?: number
    quantity_done?: number
    output_lot_no?: string
    output_expiry_date?: string
    check_status?: string
    fifo_status?: string
    material_line_count?: number
    material_count?: number
    output_count?: number
    voucher_count?: number
    materials?: ProductionHistoryMaterial[]
    outputs?: ProductionHistoryOutput[]
    vouchers?: ProductionHistoryVoucher[]
}

export type ProductionHistoryMaterial = {
    id: number
    production_item_id?: number
    product_id?: number
    product_code?: string
    product_name?: string
    product_unit?: string
    warehouse_id?: number
    warehouse_code?: string
    warehouse_name?: string
    material_type?: string
    quantity_per_unit?: number
    quantity_original?: number
    quantity_required?: number
    allocated_quantity?: number
    shortage_quantity?: number
    preferred_lot_no?: string
    fifo_status?: string
    validation_message?: string
    line_no?: number
    allocations?: ProductionHistoryAllocation[]
}

export type ProductionHistoryAllocation = {
    id: number
    production_material_id?: number
    inventory_lot_id?: number
    lot_no?: string
    inbound_date?: string
    expiry_date?: string
    quantity?: number
    quantity_remaining?: number
    is_preferred_lot?: boolean
    fifo_order?: number
}

export type ProductionHistoryOutput = {
    id: number
    production_item_id?: number
    product_id?: number
    warehouse_id?: number
    warehouse_code?: string
    warehouse_name?: string
    output_date?: string
    quantity?: number
    lot_no?: string
    expiry_date?: string
    status?: string
    note?: string
}

export type ProductionHistoryVoucher = {
    id: number
    production_id?: number
    voucher_no?: string
    voucher_type_code?: string
    operation_code?: string
    posting_date?: string
    posting_time?: string
    document_date?: string
    status?: string
    description?: string
}
