export type InventorySummary = {
    id: number
    product_id: number
    warehouse_id: number

    total_quantity: number
    total_value: number

    product?: any
    warehouse?: any
}