import type { InventoryLedgerReportRow } from "./schema"
import { hasNegativeWarehouseValue, zeroBalanceDifference, ZERO_BALANCE_LIMIT } from "./cost-adjustment"

type SourceKind = "calculated" | "import" | "manual" | "linked" | "adjusted" | "pending" | "warning"

export function priceSourceLabel(source?: string | null) {
    if (source === "COST_OVERRIDE_FILE_IMPORT") return "Giá import"
    if (source === "COST_OVERRIDE_MANUAL_UI" || source === "SALES_RETURN_MANUAL") return "Giá nhập tay"
    if (source?.startsWith("COST_OVERRIDE_")) return "Giá cố định"
    if (source === "PURCHASE_BASE" || source === "PURCHASE_LANDED") return "Giá nhập mua"
    if (source === "OPENING_SOURCE") return "Giá đầu kỳ"
    if (source === "SOURCE_PRICE") return "Giá gốc giao dịch"
    if (isLinked(source)) return "Giá theo chứng từ"
    return "Giá đã tính"
}

function isLinked(source?: string | null) {
    return ["SALES_RETURN_ORIGINAL", "TRANSFER_SOURCE_PERIOD", "TRANSFER_INBOUND_FIXED",
        "REPACK_RESULT", "PRODUCT_CONVERSION_RESULT"].includes(source || "")
}

export function getCostSourcePresentation(row: InventoryLedgerReportRow) {
    const source = row.applied_cost_source || row.applied_cost_override_source
        || (row.cost_period_label ? "PERIOD_AVERAGE" : "SOURCE_PRICE")
    const period = row.cost_period_label?.match(/^(.*?)\s*\((\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\)$/)
    const details: { label: string; value: string | number }[] = []
    const opening = row.doc_type === "OPENING"
    let kind: SourceKind = "calculated"
    let title = priceSourceLabel(source)
    let note = ""
    if (source === "ZERO_BALANCE_NORMALIZED") {
        kind = "adjusted"
        title = "Giá đã điều chỉnh"
        details.push({ label: "Nguồn gốc", value: priceSourceLabel(row.cost_adjustment_base_source) })
        if (row.cost_adjustment_amount != null) {
            details.push({ label: Number(row.quantity_out) > 0 ? "GT xuất đổi" : "GT nhập đổi",
                value: Number(row.cost_adjustment_amount) * (Number(row.quantity_out) > 0 ? -1 : 1) })
        }
        note = "Cân bằng giá trị khi hết hàng tại kho."
    } else if (source === "COST_OVERRIDE_FILE_IMPORT") {
        kind = "import"
        note = "Giá được giữ khi tính lại kỳ."
    } else if (source.startsWith("COST_OVERRIDE_") || source === "SALES_RETURN_MANUAL") {
        kind = "manual"
        note = source.startsWith("COST_OVERRIDE_") ? "Giá được giữ khi tính lại kỳ." : "Giá nhập tay của giao dịch."
    } else if (isLinked(source)) {
        kind = "linked"
        note = source === "SALES_RETURN_ORIGINAL" ? "Theo giá vốn chứng từ xuất bán gốc." : "Theo giá vốn giao dịch nguồn."
    } else if (opening) {
        kind = "import"
        title = "Giá đầu kỳ"
        note = "Đơn giá khai báo đầu kỳ."
    } else if (source === "SOURCE_PRICE" && !row.cost_period_label) {
        kind = "pending"
        title = "Giá chưa tính"
        note = "Đang hiển thị giá gốc của giao dịch."
    } else if (source === "PURCHASE_BASE" || source === "PURCHASE_LANDED") {
        note = "Theo giá vốn nhập mua, không phải giá xuất bình quân."
    }
    if (period) {
        details.push({ label: "Kỳ", value: period[1] }, { label: "Thời gian", value: `${period[2]} – ${period[3]}` })
    } else if (row.cost_period_label) {
        details.push({ label: "Kỳ", value: row.cost_period_label })
    }
    const difference = zeroBalanceDifference(row)
    if (Math.abs(difference) > ZERO_BALANCE_LIMIT || hasNegativeWarehouseValue(row)) {
        details.unshift({ label: "Nguồn giá", value: title })
        details.push({ label: Math.abs(difference) > ZERO_BALANCE_LIMIT ? "Lệch GT kho" : "GT kho âm",
            value: Math.abs(difference) > ZERO_BALANCE_LIMIT ? difference : Number(row.warehouse_balance_value) })
        kind = "warning"
        title = "Cần kiểm tra"
        note = Math.abs(difference) > ZERO_BALANCE_LIMIT ? "Đã hết hàng nhưng giá trị kho còn lệch hơn 5.000 đồng." : "Kho còn hàng nhưng giá trị tồn âm."
    }
    return { kind, title, details, note }
}
