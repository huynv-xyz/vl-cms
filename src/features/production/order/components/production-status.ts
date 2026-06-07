export type StatusVariant = "default" | "secondary" | "destructive" | "outline"

type StatusMeta = {
    label: string
    next: string
    variant: StatusVariant
}

export function getProductionStatusMeta(value?: string): StatusMeta {
    const status = normalizeStatus(value)

    switch (status) {
        case "DRAFT":
            return { label: "Nháp", next: "Cần sinh vật tư", variant: "outline" }
        case "PLANNED":
            return { label: "Kế hoạch", next: "Bước tiếp theo: sinh vật tư", variant: "outline" }
        case "MATERIAL_GENERATED":
            return { label: "Đã sinh vật tư", next: "Bước tiếp theo: chạy FIFO", variant: "secondary" }
        case "FIFO_ALLOCATED":
            return { label: "Đã phân bổ FIFO", next: "Bước tiếp theo: xuất nguyên liệu", variant: "secondary" }
        case "MATERIAL_ISSUED":
            return { label: "Đã xuất nguyên liệu", next: "Bước tiếp theo: nhập thành phẩm", variant: "secondary" }
        case "OUTPUT_RECEIVED":
            return { label: "Đã nhập thành phẩm", next: "Lệnh đã ghi nhận nhập kho TP", variant: "secondary" }
        case "DONE":
            return { label: "Hoàn tất", next: "Lệnh đã đóng", variant: "secondary" }
        case "CANCELLED":
            return { label: "Đã hủy", next: "Không xử lý tiếp", variant: "destructive" }
        case "LOCKED":
            return { label: "Đã khóa", next: "Không thể chỉnh sửa", variant: "secondary" }
        default:
            return { label: humanizeStatus(status), next: "Kiểm tra chi tiết lệnh", variant: "outline" }
    }
}

export function getProductionStatusLabel(value?: string) {
    return getProductionStatusMeta(value).label
}

export function getProductionSubStatusLabel(value?: string) {
    const status = normalizeStatus(value)

    switch (status) {
        case "OK":
            return "Hợp lệ"
        case "DONE":
            return "Hoàn tất"
        case "READY":
            return "Sẵn sàng"
        case "PENDING":
            return "Chờ xử lý"
        case "DRAFT":
            return "Nháp"
        case "PLANNED":
            return "Kế hoạch"
        case "MATERIAL_GENERATED":
            return "Đã sinh vật tư"
        case "FIFO_ALLOCATED":
            return "Đã phân bổ FIFO"
        case "MATERIAL_ISSUED":
            return "Đã xuất nguyên liệu"
        case "OUTPUT_RECEIVED":
            return "Đã nhập thành phẩm"
        case "NOT_ENOUGH":
        case "NOT_ENOUGH_STOCK":
            return "Thiếu tồn kho"
        case "THIEU_BOM":
        case "MISSING_BOM":
            return "Thiếu BOM"
        case "FIFO_NOT_FULL":
            return "FIFO chưa đủ"
        case "ERROR":
            return "Có lỗi"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return humanizeStatus(status)
    }
}

export function getProductionSubStatusVariant(value?: string): StatusVariant {
    const status = normalizeStatus(value)

    if (["OK", "DONE", "READY", "FIFO_ALLOCATED", "MATERIAL_ISSUED", "OUTPUT_RECEIVED"].includes(status)) {
        return "secondary"
    }

    if (["NOT_ENOUGH", "NOT_ENOUGH_STOCK", "THIEU_BOM", "MISSING_BOM", "FIFO_NOT_FULL", "ERROR", "CANCELLED"].includes(status)) {
        return "destructive"
    }

    return "outline"
}

function normalizeStatus(value?: string) {
    return String(value ?? "").trim().toUpperCase()
}

function humanizeStatus(value: string) {
    if (!value) return "-"

    return value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (x) => x.toUpperCase())
}
