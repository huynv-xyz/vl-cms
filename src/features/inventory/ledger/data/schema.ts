export const INVENTORY_INBOUND_DOC_TYPES = [
    { value: "OPENING", label: "Khai báo vật tư hàng hóa đầu kỳ" },
    { value: "SALES_RETURN", label: "Nhập kho từ hàng bán trả lại" },
    { value: "IMPORT_PURCHASE", label: "Mua hàng nhập khẩu nhập kho chưa thanh toán" },
    { value: "DOMESTIC_PURCHASE", label: "Mua hàng trong nước nhập kho chưa thanh toán" },
    { value: "PRODUCTION", label: "Nhập kho thành phẩm sản xuất" },
    { value: "OTHER_INBOUND", label: "Nhập kho khác" },
] as const

export const INVENTORY_OUTBOUND_DOC_TYPES = [
    { value: "SALES_EXPORT", label: "Xuất kho bán hàng" },
    { value: "TRANSFER_EXPORT", label: "Xuất chuyển kho nội bộ" },
    { value: "PRODUCTION_MATERIAL", label: "Xuất kho sản xuất" },
    { value: "TRANSPORT_EXPORT", label: "Xuất kho kiêm vận chuyển nội bộ" },
    { value: "PURCHASE_RETURN", label: "Hàng mua trả lại - Giảm trừ công nợ" },
    { value: "OTHER_EXPORT", label: "Xuất kho khác" },
] as const

export const INVENTORY_DOC_TYPES = [
    ...INVENTORY_INBOUND_DOC_TYPES,
    ...INVENTORY_OUTBOUND_DOC_TYPES,
] as const

export const DOC_TYPE_META: Record<string, {
    label: string
    color: string
    variant: "default" | "secondary" | "destructive" | "outline"
}> = {
    OPENING: { label: "Khai báo vật tư hàng hóa đầu kỳ", color: "bg-gray-100", variant: "secondary" },
    SALES_RETURN: { label: "Nhập kho từ hàng bán trả lại", color: "bg-emerald-100", variant: "default" },
    IMPORT_PURCHASE: { label: "Mua hàng nhập khẩu nhập kho chưa thanh toán", color: "bg-blue-100", variant: "default" },
    DOMESTIC_PURCHASE: { label: "Mua hàng trong nước nhập kho chưa thanh toán", color: "bg-blue-100", variant: "default" },
    PRODUCTION: { label: "Nhập kho thành phẩm sản xuất", color: "bg-purple-100", variant: "default" },
    OTHER_INBOUND: { label: "Nhập kho khác", color: "bg-emerald-100", variant: "outline" },

    SALES_EXPORT: { label: "Xuất kho bán hàng", color: "bg-red-100", variant: "destructive" },
    TRANSFER_EXPORT: { label: "Xuất chuyển kho nội bộ", color: "bg-orange-100", variant: "outline" },
    PRODUCTION_MATERIAL: { label: "Xuất kho sản xuất", color: "bg-red-100", variant: "destructive" },
    TRANSPORT_EXPORT: { label: "Xuất kho kiêm vận chuyển nội bộ", color: "bg-orange-100", variant: "outline" },
    PURCHASE_RETURN: { label: "Hàng mua trả lại - Giảm trừ công nợ", color: "bg-red-100", variant: "destructive" },
    OTHER_EXPORT: { label: "Xuất kho khác", color: "bg-red-100", variant: "outline" },

    OPENING_IN: { label: "Khai báo vật tư hàng hóa đầu kỳ", color: "bg-gray-100", variant: "secondary" },
    PNK_PURCHASE: { label: "Mua hàng nhập kho", color: "bg-blue-100", variant: "default" },
    PNK_PURCHASE_DOMESTIC: { label: "Mua hàng trong nước nhập kho chưa thanh toán", color: "bg-blue-100", variant: "default" },
    PNK_PURCHASE_IMPORT: { label: "Mua hàng nhập khẩu nhập kho chưa thanh toán", color: "bg-blue-100", variant: "default" },
    PNK_PROD: { label: "Nhập kho thành phẩm sản xuất", color: "bg-purple-100", variant: "default" },
    PNK_OTHER: { label: "Nhập kho khác", color: "bg-emerald-100", variant: "outline" },
    PNK_SALES_RETURN: { label: "Nhập kho từ hàng bán trả lại", color: "bg-emerald-100", variant: "default" },
    PXK_SALE: { label: "Xuất kho bán hàng", color: "bg-red-100", variant: "destructive" },
    PXK_PROD: { label: "Xuất kho sản xuất", color: "bg-red-100", variant: "destructive" },
    PXK_OTHER: { label: "Xuất kho khác", color: "bg-red-100", variant: "outline" },
    PXK_PURCHASE_RETURN: { label: "Hàng mua trả lại - Giảm trừ công nợ", color: "bg-red-100", variant: "destructive" },

    PURCHASE: { label: "Mua hàng nhập kho", color: "bg-blue-100", variant: "default" },
    ADJUSTMENT: { label: "Điều chỉnh", color: "bg-yellow-100", variant: "outline" },
    EXPORT: { label: "Xuất kho bán hàng", color: "bg-red-100", variant: "destructive" },
}

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
    tk_no?: string | null
    tk_co?: string | null
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
    tk_no?: string | null
    tk_co?: string | null
    ref_id?: number | null
    unit?: string | null
    unit_price?: number | null
    amount?: number | null
    lot_code?: string | null
    quantity_in: number
    quantity_out: number
    balance_quantity: number
    product_code: string
    product_name: string
    warehouse_name: string
}
