import type { Product } from "@/features/product/data/schema"

/**
 * BA Spec BR-04.3: component có thể là Nguyên vật liệu, Bao bì, Thành phẩm cấp dưới
 * (cho phép BOM đa cấp), hoặc Hàng hóa (cty mua hàng nhiều mẫu mã).
 */
export type MaterialType = "NVL" | "BB" | "TP" | "HH"

export type ProductBomItem = {
    id: number
    bom_id: number
    material_product_id: number
    material_type: MaterialType | string
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
    material_type: MaterialType
    quantity: number
    unit?: string
    line_no?: number
    note?: string
}

export const MATERIAL_TYPE_OPTIONS: Array<{
    value: MaterialType
    label: string
    description: string
}> = [
    { value: "NVL", label: "Nguyên vật liệu", description: "NL chính dùng đóng TP" },
    { value: "BB", label: "Bao bì", description: "Bao, hũ, hộp, túi lồng trong…" },
    { value: "TP", label: "Thành phẩm", description: "TP cấp dưới (BOM đa cấp)" },
    { value: "HH", label: "Hàng hóa", description: "Hàng hóa mua sẵn để đóng TP" },
]

export type CreateProductBomRequest = {
    product_id?: number
    version?: string
    valid_from: string
    valid_to?: string
    active?: boolean
    note?: string
    items: CreateProductBomItemRequest[]
}
