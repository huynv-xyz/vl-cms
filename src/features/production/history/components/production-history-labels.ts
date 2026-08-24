export function voucherTypeLabel(operationCode?: string | null, voucherTypeCode?: string | null) {
    const operation = String(operationCode || "").toUpperCase()
    const type = String(voucherTypeCode || "").toUpperCase()

    const labels: Record<string, string> = {
        PRODUCTION: "Nhập kho thành phẩm sản xuất",
        PRODUCTION_MATERIAL: "Xuất kho sản xuất",
        PURCHASE: "Nhập mua hàng",
        SALES_EXPORT: "Xuất bán hàng",
        TRANSFER_EXPORT: "Xuất chuyển kho",
        TRANSFER_IMPORT: "Nhập chuyển kho",
        OTHER_INBOUND: "Nhập kho khác",
        OTHER_EXPORT: "Xuất kho khác",
        OPENING: "Tồn đầu kỳ",
        ADJUSTMENT: "Điều chỉnh kho",
        REPACK: "Đóng gói lại",
        PRODUCT_CONVERSION: "Chuyển đổi hàng",
        XK_SX: "Xuất kho sản xuất",
        NK_TP: "Nhập kho thành phẩm",
    }

    return labels[operation] || labels[type] || operationCode || voucherTypeCode || "-"
}

export function materialTypeLabel(value?: string | null) {
    const type = String(value || "").toUpperCase()
    if (type === "NVL") return "Nguyên vật liệu"
    if (type === "BB") return "Bao bì"
    if (type === "TP") return "Thành phẩm"
    if (type === "HH") return "Hàng hóa"
    return value || "-"
}
