import { apiGet, apiPost, type PagedResult } from "@/api/client"

export type VoucherTypeCode =
    | "OPENING"
    | "SALES_RETURN"
    | "IMPORT_PURCHASE"
    | "DOMESTIC_PURCHASE"
    | "PRODUCTION"
    | "OTHER_INBOUND"
    | "SALES_EXPORT"
    | "TRANSFER_EXPORT"
    | "PRODUCTION_MATERIAL"
    | "TRANSPORT_EXPORT"
    | "PURCHASE_RETURN"
    | "OTHER_EXPORT"
    | "OPENING_IN"
    | "PNK_PURCHASE"
    | "PNK_PURCHASE_DOMESTIC"
    | "PNK_PURCHASE_IMPORT"
    | "PNK_PROD"
    | "PNK_OTHER"
    | "PNK_SALES_RETURN"
    | "PXK_SALE"
    | "PXK_PROD"
    | "PXK_OTHER"
    | "PXK_PURCHASE_RETURN"

export type VoucherStatus = "DRAFT" | "POSTED" | "VOID"

export type InventoryVoucher = {
    id: number
    voucher_no?: string
    voucher_type_code: VoucherTypeCode | string
    posting_date?: string
    document_date?: string
    warehouse_id?: number
    description?: string
    status: VoucherStatus | string
    posted_at?: string
    posted_by?: number
    transfer_id?: number
    production_id?: number
    purchase_contract_id?: number
    source_type?: string
    source_id?: number
    created_at?: string
    updated_at?: string
    warehouse?: { id: number; name: string; code?: string }
    items?: InventoryVoucherItem[]
}

export type InventoryVoucherItem = {
    id: number
    voucher_id: number
    line_no?: number
    product_id?: number
    warehouse_id?: number
    lot_id?: number
    lot_code?: string
    expiry_date?: string
    quantity?: number
    unit?: string
    unit_price?: number
    amount?: number
    cost_object_id?: number
    source_type?: string
    source_id?: number
    note?: string
    product?: { id: number; code: string; name: string; unit?: string }
}

export type ListVouchersParams = {
    page: number
    size: number
    keyword?: string
    type?: string
    status?: string
    warehouse_id?: number
    product_id?: number
    from?: string
    to?: string
}

export type CreateVoucherItemRequest = {
    line_no?: number
    product_id: number
    warehouse_id: number
    lot_id?: number
    lot_code?: string
    expiry_date?: string
    quantity: number
    unit?: string
    unit_price?: number
    amount?: number
    cost_object_id?: number
    source_type?: string
    source_id?: number
    note?: string
}

export type CreateVoucherRequest = {
    voucher_type_code: VoucherTypeCode | string
    posting_date: string
    document_date: string
    warehouse_id: number
    description?: string
    transfer_id?: number
    production_id?: number
    purchase_contract_id?: number
    source_type?: string
    source_id?: number
    created_by?: number
    items: CreateVoucherItemRequest[]
}

export function listVouchers(params: ListVouchersParams) {
    return apiGet<PagedResult<InventoryVoucher>>("/inventory/vouchers", {
        page: params.page,
        limit: params.size,
        keyword: params.keyword,
        type: params.type,
        status: params.status,
        warehouse_id: params.warehouse_id,
        product_id: params.product_id,
        from: params.from,
        to: params.to,
    })
}

export function getVoucher(id: number) {
    return apiGet<InventoryVoucher>(`/inventory/vouchers/${id}`)
}

export function createVoucher(body: CreateVoucherRequest) {
    return apiPost<InventoryVoucher>("/inventory/vouchers", body)
}

export function postVoucher(id: number, postedBy?: number) {
    return apiPost<InventoryVoucher>(`/inventory/vouchers/${id}/post`, {
        posted_by: postedBy,
    })
}

export function unpostVoucher(id: number) {
    return apiPost<{ success: boolean; id: number }>(
        `/inventory/vouchers/${id}/unpost`,
        {},
    )
}

export const VOUCHER_TYPE_LABEL: Record<string, string> = {
    OPENING: "Khai báo vật tư hàng hóa đầu kỳ",
    SALES_RETURN: "Nhập kho từ hàng bán trả lại",
    IMPORT_PURCHASE: "Mua hàng nhập khẩu nhập kho chưa thanh toán",
    DOMESTIC_PURCHASE: "Mua hàng trong nước nhập kho chưa thanh toán",
    PRODUCTION: "Nhập kho thành phẩm sản xuất",
    OTHER_INBOUND: "Nhập kho khác",
    SALES_EXPORT: "Xuất kho bán hàng",
    TRANSFER_EXPORT: "Xuất chuyển kho nội bộ",
    PRODUCTION_MATERIAL: "Xuất kho sản xuất",
    TRANSPORT_EXPORT: "Xuất kho kiêm vận chuyển nội bộ",
    PURCHASE_RETURN: "Hàng mua trả lại - Giảm trừ công nợ",
    OTHER_EXPORT: "Xuất kho khác",

    OPENING_IN: "Khai báo vật tư hàng hóa đầu kỳ",
    PNK_PURCHASE: "Mua hàng nhập kho",
    PNK_PURCHASE_DOMESTIC: "Mua hàng trong nước nhập kho chưa thanh toán",
    PNK_PURCHASE_IMPORT: "Mua hàng nhập khẩu nhập kho chưa thanh toán",
    PNK_PROD: "Nhập kho thành phẩm sản xuất",
    PNK_OTHER: "Nhập kho khác",
    PNK_SALES_RETURN: "Nhập kho từ hàng bán trả lại",
    PXK_SALE: "Xuất kho bán hàng",
    PXK_PROD: "Xuất kho sản xuất",
    PXK_OTHER: "Xuất kho khác",
    PXK_PURCHASE_RETURN: "Hàng mua trả lại - Giảm trừ công nợ",
}
