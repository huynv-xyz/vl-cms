import type { Export } from "../../export/data/schema"

/** Format "dd-MM-yyyy" hoặc "yyyy-MM-dd" → "Ngày DD tháng MM năm YYYY" */
function formatViDate(dateStr?: string): string {
    if (!dateStr) return "Ngày ...... tháng ...... năm ........."
    const parts = dateStr.split("-")
    if (parts.length === 3) {
        const [a, b, c] = parts
        if (a.length === 4) {
            return `Ngày ${c} tháng ${b} năm ${a}`
        }
        return `Ngày ${a} tháng ${b} năm ${c}`
    }
    return dateStr
}

type Props = {
    data: Export
}

export function ExportInfo({ data }: Props) {
    const customerName: string =
        (data as any).order?.customer?.name ?? ""
    const customerAddress: string =
        (data as any).order?.customer?.address ?? ""

    // Địa chỉ: ưu tiên delivery_address, fallback warehouse item đầu tiên
    const deliveryAddress: string =
        (data as any).delivery?.delivery_address ??
        data.items?.[0]?.warehouse?.name ??
        "-"

    // Kho xuất: lấy từ item đầu tiên (mỗi item có warehouse riêng)
    const warehouseName: string =
        data.items?.[0]?.warehouse?.name ??
        (data as any).warehouse?.name ??
        "-"

    // Lý do xuất kho
    const reason: string =
        data.note ||
        (customerName
            ? `Xuất kho bán hàng ${customerName}`
            : "Xuất kho bán hàng")

    return (
        <div className="print:shadow-none text-[13px]">

            {/* ── Company header ── */}
            <div className="export-print-company text-center mb-2">
                <div className="font-bold text-sm uppercase tracking-wide">
                    CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT
                </div>
                <div className="text-xs text-muted-foreground">
                    Số 54C1, KP 11, Phường Tân Triều, Tỉnh Đồng Nai, Việt Nam
                </div>
            </div>

            {/* ── Row: Số phiếu XK | Lần giao ── */}
            <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50/60">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-[12px] text-muted-foreground">
                        Số phiếu XK
                    </span>
                    <span className="font-bold border border-blue-300 bg-blue-50 px-3 py-0.5 text-sm">
                        {data.export_no ?? "—"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-[12px] text-muted-foreground">
                        Lần giao
                    </span>
                    <span className="font-bold border border-blue-300 bg-blue-50 px-3 py-0.5 text-sm min-w-[36px] text-center">
                        {(data as any).delivery?.round ?? 1}
                    </span>
                </div>
            </div>

            {/* ── Title row: PHIẾU XUẤT KHO ── */}
            <div className="flex">
                {/* Title + date */}
                <div className="flex-1 text-center py-3">
                    <div className="export-print-title text-[22px] font-extrabold uppercase tracking-wide">
                        PHIẾU XUẤT KHO
                    </div>
                    <div className="text-[12px] italic text-muted-foreground mt-0.5">
                        {formatViDate(data.export_date)}
                    </div>
                </div>
            </div>

            {/* ── Info lines ── */}
            <div className="export-print-info-lines px-3 py-2 space-y-1 text-[13px]">
                <div>
                    <span className="text-muted-foreground">- Họ và tên người nhận hàng:&nbsp;</span>
                    <span className="font-semibold">{customerName || ".................................."}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">- Địa chỉ (bộ phận):&nbsp;</span>
                    <span className="font-medium">{customerAddress}</span>
                </div>
                {/*<div>
                    <span className="text-muted-foreground">- Lý do xuất kho:&nbsp;</span>
                    <span className="font-medium">{reason}</span>
                </div>*/}
            </div>

        </div>
    )
}
