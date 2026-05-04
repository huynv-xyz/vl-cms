export type ProductionStatus =
    | "PLANNED"
    | "IN_PROGRESS"
    | "DONE"
    | "CANCELLED"

export type ProductBomItem = {
    id: number
    bom_id: number
    material_product_id: number
    quantity: number
    unit?: string
    material_product?: any
}

export type ProductBomDetail = {
    id: number
    product_id: number
    version: number
    is_active: boolean
    items: ProductBomItem[]
}

export type ProductionExtraRequest = {
    product_id?: number
    quantity?: number
    lot_id?: number
    note?: string
}

export type ProductionSubstitutionRequest = {
    original_product_id?: number
    substitute_product_id?: number
    quantity?: number
}

export type ProductionOrder = {
    id: number
    production_no: string
    product_id: number
    warehouse_id: number
    quantity_plan: number
    quantity_done: number
    unit_cost?: number
    status: ProductionStatus
    production_date: string

    product?: any
    warehouse?: any
    materials?: any[]
    outputs?: any[]
    extras?: any[]
    substitutions?: any[]
}

export type CreateProductionRequest = {
    product_id: number
    warehouse_id: number
    production_date: string
    quantity_plan: number
    quantity_done: number
    unit_cost?: number
    status?: ProductionStatus

    extras?: ProductionExtraRequest[]
    substitutions?: ProductionSubstitutionRequest[]
}

export type UpdateProductionRequest = CreateProductionRequest & {
    id: number
}