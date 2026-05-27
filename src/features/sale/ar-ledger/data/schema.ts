import type { Customer } from "@/features/customer/data/schema"
import type { Product } from "@/features/product/data/schema"

export type ArLedger = {
    id: number

    posting_date: string
    doc_date?: string

    doc_no: string

    customer_id: number
    customer?: Customer

    customer_name?: string
    product_id?: number
    product?: Product
    line_type?: "PRODUCT" | "VAT" | "PAYMENT" | "RETURN" | "OPENING" | "ADJUST" | "IMPORT"
    order_id?: number
    order_item_id?: number
    export_id?: number
    export_item_id?: number
    return_id?: number
    return_item_id?: number

    description?: string
    account_code?: string

    // ===== line item (báo cáo chi tiết công nợ) =====
    unit?: string
    quantity?: number
    unit_price?: number

    debit_amount: number
    credit_amount: number

    // số dư lũy kế tới dòng này (do backend tính)
    running_balance?: number

    source_type?: "EXPORT" | "RECEIPT" | "ADJUST" | "IMPORT" | "RETURN" | "BANK" | "OPENING"
    source_id?: number

    created_at: string
    updated_at?: string
}
