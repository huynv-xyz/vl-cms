import { Product } from "@/features/product/data/schema"
import { Shipment } from "../../shipment/data/schema"

export type ContractItem = {
    id: number
    contract_id: number

    shipment?: Shipment

    product_id?: number
    product?: Product

    // ===== CONTRACT =====
    quantity?: number
    unit_price?: number
    discount_amount?: number

    // 🔥 NEW COST
    packaging_price?: number
    freight_price?: number

    // ===== SHIPMENT =====
    shipped_quantity?: number
    remaining_quantity?: number

    defect_quantity?: number
    real_quantity?: number

    // ===== PRICE (SERVER CALC) =====
    base_price?: number
    price_before_tax?: number

    import_tax_rate?: number
    vat_rate?: number

    import_tax_amount?: number
    vat_amount?: number

    final_price?: number
    total_amount?: number

    created_at?: string
    updated_at?: string
}