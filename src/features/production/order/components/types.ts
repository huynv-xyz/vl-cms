export type ProductionFormValues = {
    product_id: number
    warehouse_id: number
    production_date: string

    quantity_plan: number
    quantity_done?: number

    status?: "PLANNED" | "READY" | "DONE" | "CANCELLED"
}