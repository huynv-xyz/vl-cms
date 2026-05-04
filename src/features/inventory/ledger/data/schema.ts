export const DOC_TYPE_META: Record<string, { label: string; color: string }> = {

    OPENING: { label: "Tồn đầu kỳ", color: "bg-gray-100" },

    PURCHASE: { label: "Nhập mua", color: "bg-blue-100" },

    PRODUCTION: { label: "Nhập sản xuất", color: "bg-purple-100" },

    ADJUSTMENT: { label: "Điều chỉnh", color: "bg-yellow-100" },

    EXPORT: { label: "Xuất kho", color: "bg-red-100" },

}

export type InventoryLedger = {
    id: number

    posting_date: string

    product_id: number
    warehouse_id: number

    quantity: number

    doc_type: string
    doc_no: string
    ref_id?: number | null

    created_at?: string
    updated_at?: string

    product?: any
    warehouse?: any
}

export type InventoryLedgerReportRow = {
    id: number
    posting_date: string
    product_id: number
    warehouse_id: number
    doc_type: string
    doc_no: string
    ref_id?: number | null
    quantity_in: number
    quantity_out: number
    balance_quantity: number
    product_code: string
    product_name: string
    warehouse_name: string
}