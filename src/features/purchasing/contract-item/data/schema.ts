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
    foreign_price?: number
    exchange_rate?: number
    handling_fee?: number
    input_price?: number
    price_before_tax?: number
    input_price_vnd?: number
    price_before_tax_vnd?: number

    import_tax_rate?: number
    vat_rate?: number

    import_tax_amount?: number
    vat_amount?: number
    import_tax_amount_vnd?: number
    vat_amount_vnd?: number

    final_price?: number
    final_price_vnd?: number
    total_amount?: number
    total_amount_vnd?: number

    created_at?: string
    updated_at?: string
}
