export const DOC_TYPE_META: Record<string, {
    label: string
    color: string
    variant: "default" | "secondary" | "destructive" | "outline"
}> = {

    OPENING: { label: "Tồn đầu kỳ", color: "bg-gray-100", variant: "secondary" },

    PURCHASE: { label: "Nhập mua", color: "bg-blue-100", variant: "default" },

    PRODUCTION: { label: "Nhập sản xuất", color: "bg-purple-100", variant: "default" },

    ADJUSTMENT: { label: "Điều chỉnh", color: "bg-yellow-100", variant: "outline" },

    EXPORT: { label: "Xuất kho", color: "bg-red-100", variant: "destructive" },

    PRODUCTION_MATERIAL: { label: "Xuất SX", color: "bg-red-100", variant: "destructive" },

}

export const INVENTORY_DOC_TYPES = [
    { value: "OPENING", label: "Tồn đầu kỳ" },
    { value: "PURCHASE", label: "Nhập mua" },
    { value: "PRODUCTION", label: "Nhập sản xuất" },
    { value: "PRODUCTION_MATERIAL", label: "Xuất SX" },
    { value: "ADJUSTMENT", label: "Điều chỉnh" },
    { value: "EXPORT", label: "Xuất kho" },
] as const

export function getDocTypeMeta(docType?: string) {
    return DOC_TYPE_META[String(docType ?? "").toUpperCase()] ?? {
        label: docType || "-",
        color: "",
        variant: "outline" as const,
    }
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
