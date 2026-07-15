import { apiDelete, apiGet, apiPost, apiPostMultipart, apiPut, type PagedResult } from "@/api/client"

export type CostPeriod = {
    id: number
    code: string
    name: string
    from_date: string
    to_date: string
    method: string
    status: "DRAFT" | "CALCULATED" | "LOCKED" | string
    note?: string
    calculated_at?: string
    locked_at?: string
}

export type ProductPeriodCost = {
    id: number
    cost_period_id: number
    product_id: number
    product_code?: string
    product_name?: string
    warehouse_id?: number | null
    warehouse_code?: string
    warehouse_name?: string
    unit?: string
    nature?: string
    opening_quantity: number
    opening_value: number
    inbound_quantity: number
    inbound_value: number
    purchase_inbound_quantity: number
    purchase_inbound_value: number
    landed_cost_value: number
    production_inbound_quantity: number
    production_inbound_value: number
    avg_unit_cost: number
    outbound_quantity: number
    outbound_value: number
    closing_quantity: number
    closing_value: number
    lot_allocation_count?: number
    production_cost_count?: number
}

export type LandedCost = {
    id: number
    doc_no?: string
    doc_date: string
    lot_no: string
    cost_type?: string
    amount: number
    description?: string
    supplier_name?: string
    status: string
}

export type LotCostAllocation = {
    id: number
    cost_period_id: number
    lot_no: string
    inventory_lot_id?: number
    product_id: number
    product_code?: string
    product_name?: string
    unit?: string
    warehouse_id?: number
    warehouse_code?: string
    warehouse_name?: string
    inbound_date?: string
    expiry_date?: string
    quantity_basis: number
    purchase_amount: number
    landed_cost_amount: number
    purchase_unit_cost: number
    landed_unit_cost: number
    final_unit_cost: number
    final_amount: number
}

export type ProductionCostResult = {
    id: number
    cost_period_id: number
    production_id?: number
    production_no?: string
    production_date?: string
    production_item_id: number
    product_id: number
    product_code?: string
    product_name?: string
    unit?: string
    output_lot_no?: string
    warehouse_id?: number
    warehouse_code?: string
    warehouse_name?: string
    output_quantity: number
    material_cost: number
    unit_cost: number
    total_cost: number
    source_kind?: "PRODUCTION_ORDER" | "LEGACY_LEDGER"
}

export type ProductionCostMaterial = {
    material_product_id?: number
    material_product_code?: string
    material_product_name?: string
    unit?: string
    warehouse_id?: number
    warehouse_code?: string
    warehouse_name?: string
    lot_no?: string
    quantity: number
    unit_cost: number
    amount: number
    source_kind?: "PRODUCTION_ORDER" | "LEGACY_LEDGER"
}

export type ProductionCostBasis = ProductionCostResult & {
    materials?: ProductionCostMaterial[]
}

export type TransferInboundCostBasis = {
    doc_no?: string
    posting_date?: string
    from_warehouse_id?: number
    from_warehouse_code?: string
    from_warehouse_name?: string
    to_warehouse_id?: number
    to_warehouse_code?: string
    to_warehouse_name?: string
    lot_no?: string
    quantity: number
    unit_cost: number
    amount: number
}

export type CostBasis = {
    period?: CostPeriod
    summary?: ProductPeriodCost
    lot_allocations: LotCostAllocation[]
    production_costs: ProductionCostBasis[]
    transfer_inbounds: TransferInboundCostBasis[]
}

export type CostingCalculationError = {
    productionItemId?: number
    outputProductCode?: string
    outputProductName?: string
    outputWarehouse?: string
    materialProductCode?: string
    materialProductName?: string
    materialWarehouse?: string
    materialQuantity?: number
    reason?: string
}

export type CostingImportResult = {
    success: number
    failed: number
    errors: Array<{ row: number; message: string }>
}

export type CreateCostPeriodRequest = {
    name?: string
    from_date: string
    to_date: string
    note?: string
}

export type CreateLandedCostRequest = {
    doc_no?: string
    doc_date: string
    lot_no: string
    cost_type?: string
    amount: number
    description?: string
    supplier_name?: string
}

export function listCostPeriods(params: { page: number; size: number }) {
    return apiGet<PagedResult<CostPeriod>>("/inventory/costing/periods", params)
}

export function createCostPeriod(body: CreateCostPeriodRequest) {
    return apiPost<CostPeriod>("/inventory/costing/periods", body)
}

export function calculateCostPeriod(id: number) {
    return apiPost<{ period: CostPeriod; product_rows: number; lot_allocations: number; production_rows: number; production_product_count: number }>(
        `/inventory/costing/periods/${id}/calculate`,
    )
}

export function lockCostPeriod(id: number) {
    return apiPost<CostPeriod>(`/inventory/costing/periods/${id}/lock`)
}

export function listPeriodCosts(id: number, params: { page: number; size: number; keyword?: string; production_only?: boolean; lot_allocated_only?: boolean }) {
    return apiGet<PagedResult<ProductPeriodCost> & {
        period: CostPeriod
        totals?: Record<string, number>
        all_count?: number
        production_count?: number
        production_product_count?: number
        lot_allocated_count?: number
    }>(
        `/inventory/costing/periods/${id}/costs`,
        params,
    )
}

export function listLotCostAllocations(id: number, productId: number) {
    return apiGet<LotCostAllocation[]>(`/inventory/costing/periods/${id}/lot-allocations`, {
        product_id: productId,
    })
}

export function listProductionCostResults(id: number, productId: number) {
    return apiGet<ProductionCostResult[]>(`/inventory/costing/periods/${id}/production-costs`, {
        product_id: productId,
    })
}

export function getCostBasis(id: number, productId: number, warehouseId?: number | null) {
    return apiGet<CostBasis>(`/inventory/costing/periods/${id}/cost-basis`, {
        product_id: productId,
        warehouse_id: warehouseId || undefined,
    })
}

export function listLandedCosts(params: { page: number; size: number; keyword?: string; from_date?: string; to_date?: string }) {
    return apiGet<PagedResult<LandedCost> & { totals?: Record<string, number> }>("/inventory/costing/landed-costs", params)
}

export function createLandedCost(body: CreateLandedCostRequest) {
    return apiPost<LandedCost>("/inventory/costing/landed-costs", body)
}

export function updateLandedCost(id: number, body: CreateLandedCostRequest) {
    return apiPut<LandedCost>(`/inventory/costing/landed-costs/${id}`, body)
}

export function deleteLandedCost(id: number) {
    return apiDelete<boolean>(`/inventory/costing/landed-costs/${id}`)
}

export function importLandedCosts(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    return apiPostMultipart<CostingImportResult>("/inventory/costing/landed-costs/import-excel", formData)
}
