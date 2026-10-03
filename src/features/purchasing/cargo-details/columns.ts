import type { CargoRow } from "@/api/purchasing/cargo-details"
import { formatProductNature } from "@/features/product/components/product-nature"
import { getShipmentStatusLabel } from "../shipment/data/shipment-status"

export const CARGO_REPORT_TITLE = "Thông tin hàng hóa XNK"

export function cargoStatusLabel(status: string | null) {
    if (status === "PLANNED") return "Kế hoạch"
    if (status === "CANCELLED") return "Đã hủy"
    if (status === "IN_WAREHOUSE") return "Đã về kho (chưa ghi tồn)"
    if (status === "DONE") return "Đã về kho (đã ghi tồn)"
    return getShipmentStatusLabel(status ?? undefined)
}

export const CARGO_STATUS_OPTIONS = [
    { value: "PLANNED", label: "Kế hoạch" },
    { value: "IN_TRANSIT", label: "Đang vận chuyển" },
    { value: "ARRIVED_PORT", label: "Đã cập cảng" },
    { value: "IN_WAREHOUSE", label: "Đã về kho (chưa ghi tồn)" },
    { value: "DONE", label: "Đã về kho (đã ghi tồn)" },
    { value: "CANCELLED", label: "Đã hủy" },
]

export type CargoColumn = {
    key: keyof CargoRow | "stt"
    label: string
    width: number
    type?: "date" | "number"
    value?: (row: CargoRow) => string
}

export const CARGO_CENTERED_COLUMNS = new Set<string>([
    "stt", "etd", "eta", "ata", "port_name", "warehouse_at", "container_no", "nature",
    "unit", "lot_no", "production_date", "expiry_date", "form", "origin", "importer",
])

export const CARGO_COLUMNS: CargoColumn[] = [
    { key: "stt", label: "STT", type: "number", width: 65 },
    { key: "etd", label: "Ngày đi", type: "date", width: 140 },
    { key: "eta", label: "Dự kiến tới cảng", type: "date", width: 160 },
    { key: "ata", label: "Thực tế tới cảng", type: "date", width: 160 },
    { key: "port_name", label: "Tên cảng", width: 180 },
    { key: "warehouse_at", label: "Ngày tới kho", type: "date", width: 150 },
    { key: "warehouse_name", label: "Tên kho", width: 220 },
    { key: "status", label: "Tình trạng", width: 250, value: row => cargoStatusLabel(row.status) },
    { key: "container_no", label: "Số cont/Xe tải", width: 160 },
    { key: "nature", label: "Loại hàng", width: 170, value: row => formatProductNature(row.nature) },
    { key: "product_code", label: "Mã hàng", width: 200 },
    { key: "product_name", label: "Tên hàng", width: 280 },
    { key: "unit", label: "ĐVT", width: 85 },
    { key: "quantity", label: "Số lượng nhập", type: "number", width: 150 },
    { key: "defect_quantity", label: "Số lượng lỗi", type: "number", width: 140 },
    { key: "real_quantity", label: "Số lượng thực nhận", type: "number", width: 180 },
    { key: "lot_no", label: "Số lô", width: 150 },
    { key: "production_date", label: "Ngày sản xuất", type: "date", width: 150 },
    { key: "expiry_date", label: "Hạn sử dụng", type: "date", width: 150 },
    { key: "form", label: "Dạng", width: 100 },
    { key: "origin", label: "Nguồn gốc", width: 170 },
    { key: "supplier_name", label: "Nhà cung cấp", width: 280 },
    { key: "importer", label: "Đơn vị nhập khẩu", width: 200 },
    { key: "note", label: "Ghi chú", width: 300 },
]
