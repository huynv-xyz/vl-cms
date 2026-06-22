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
    voucher_id?: number | null
    voucher_item_id?: number | null

    posting_date: string

    product_id: number
    warehouse_id: number

    quantity: number

    doc_type: string
    doc_no: string
    description?: string | null
    supplier_name?: string | null
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
    voucher_id?: number | null
    voucher_item_id?: number | null
    posting_date: string
    product_id: number
    warehouse_id: number
    doc_type: string
    doc_no: string
    description?: string | null
    supplier_name?: string | null
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
