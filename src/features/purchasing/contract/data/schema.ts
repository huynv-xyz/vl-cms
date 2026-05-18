import { Currency } from "../../currency/data/schema"
import { Supplier } from "../../supplier/data/schema"

export type PaymentMethod =
    | "TT"
    | "LC_IMMEDIATE"
    | "LC_60_BL"
    | "DA"
    | "DP"

export type Contract = {
    id: number

    code?: string

    supplier_id?: number
    supplier?: Supplier

    signed_date?: string
    status?: string

    currency_id?: number
    currency?: Currency
    exchange_rate?: number

    payment_method?: PaymentMethod
    term?: string

    deposit_rate?: number

    deposit_date?: string
    vat_rate?: number
    import_tax_rate?: number
    handling_fee?: number

    // ===== PLAN =====
    total_quantity?: number
    total_shipped_quantity?: number
    total_remaining_quantity?: number
    total_amount?: number
    total_amount_vnd?: number

    // ===== DEFECT =====
    total_defect_quantity?: number
    total_defect_amount?: number
    total_defect_amount_vnd?: number

    // ===== REAL =====
    real_quantity?: number
    real_amount?: number
    real_amount_vnd?: number

    // ===== PAYMENT =====
    total_paid_amount?: number
    remaining_amount?: number

    created_at?: string
    created_by?: number

    updated_at?: string
    updated_by?: number
}
