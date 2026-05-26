// ============================================================
// Single source of truth cho Shipment Status
// Import từ đây — không định nghĩa lại ở chỗ khác
// ============================================================

export type ShipmentStatus =
    //| "PLANNED"
    | "IN_TRANSIT"
    | "ARRIVED_PORT"
    | "IN_WAREHOUSE"
//| "DONE"
//| "CANCELLED"

type StatusMeta = {
    label: string
    badgeClass: string
}

export const SHIPMENT_STATUS_MAP: Record<ShipmentStatus, StatusMeta> = {
    //PLANNED: { label: "Kế hoạch", badgeClass: "border-slate-200 bg-slate-50 text-slate-700" },
    IN_TRANSIT: { label: "Đang vận chuyển", badgeClass: "border-sky-200 bg-sky-50 text-sky-700" },
    ARRIVED_PORT: { label: "Đã cập cảng", badgeClass: "border-amber-200 bg-amber-50 text-amber-700" },
    IN_WAREHOUSE: { label: "Đã về kho", badgeClass: "border-teal-200 bg-teal-50 text-teal-700" },
    //DONE: { label: "Hoàn tất", badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    //CANCELLED: { label: "Đã hủy", badgeClass: "border-red-200 bg-red-50 text-red-700" },
}

export function getShipmentStatusLabel(status?: string): string {
    if (!status) return "—"
    return SHIPMENT_STATUS_MAP[status as ShipmentStatus]?.label ?? status
}

export function getShipmentStatusBadgeClass(status?: string): string {
    return (
        SHIPMENT_STATUS_MAP[status as ShipmentStatus]?.badgeClass ??
        "border-slate-200 bg-slate-50 text-slate-700"
    )
}

/** Dùng cho RJSF oneOf select trong form */
export const SHIPMENT_STATUS_FORM_OPTIONS = Object.entries(SHIPMENT_STATUS_MAP).map(
    ([value, { label }]) => ({ const: value, title: label })
)

/** Dùng cho filter toolbar (table-v2) — values là danh sách status BE chấp nhận */
export const SHIPMENT_STATUS_FILTER_OPTIONS = [
    { value: "IN_TRANSIT", values: ["IN_TRANSIT"], label: "Đang vận chuyển" },
    { value: "ARRIVED_PORT", values: ["ARRIVED_PORT"], label: "Đã cập cảng" },
    { value: "IN_WAREHOUSE", values: ["IN_WAREHOUSE", "DONE"], label: "Đã về kho" },
]
