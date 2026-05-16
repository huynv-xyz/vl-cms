import type { Product } from "@/features/product/data/schema"

export type ProductBomItem = {
    id: number
    bom_id: number
    material_product_id: number
    material_type: "NVL" | "BB" | string
    quantity: number
    unit?: string
    line_no: number
    note?: string
    material_product?: Product
}

export type ProductBom = {
    id: number
    product_id: number
    version: string
    valid_from: string
    valid_to?: string
    active?: boolean
    is_active?: boolean
    status?: string
    note?: string
    product?: Product
    items?: ProductBomItem[]
}

export type CreateProductBomItemRequest = {
    material_product_id?: number
    material_type: "NVL" | "BB"
    quantity: number
    unit?: string
    line_no?: number
    note?: string
}

export type CreateProductBomRequest = {
    product_id?: number
    version?: string
    valid_from: string
    valid_to?: string
    active?: boolean
    note?: string
    items: CreateProductBomItemRequest[]
}
