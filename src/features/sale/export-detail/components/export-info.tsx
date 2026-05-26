import type { Export } from "../../export/data/schema"

/** Format "dd-MM-yyyy" → "Ngày DD tháng MM năm YYYY" */
function formatViDate(dateStr?: string): string {
    if (!dateStr) return "Ngày ...... tháng ...... năm ........."
    // BE trả về "dd-MM-yyyy"
    const parts = dateStr.split("-")
    if (parts.length === 3) {
        return `Ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`
    }
    return dateStr
}

type Props = {
    data: Export
}

export function ExportInfo({ data }: Props) {
    const customerName: string =
        (data as any).order?.customer?.name ?? ""

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
            <div className="text-center mb-2">
                <div className="font-bold text-sm uppercase tracking-wide">
                    CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT
                </div>
                <div className="text-xs text-muted-foreground">
                    Số 54C1, KP 11, Phường Tân Triều, Tỉnh Đồng Nai, Việt Nam
                </div>
            </div>

            {/* ── Row: Số phiếu XK | Lần giao ── */}
            <div className="flex justify-between items-center border border-b-0 border-gray-400 px-3 py-1.5 bg-gray-50/60">
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

            {/* ── Title row: PHIẾU XUẤT KHO | Nợ/Có ── */}
            <div className="flex border border-b-0 border-gray-400">
                {/* Left: title + date */}
                <div className="flex-1 text-center py-3 border-r border-gray-400">
                    <div className="text-[22px] font-extrabold uppercase tracking-wide">
                        PHIẾU XUẤT KHO
                    </div>
                    <div className="text-[12px] italic text-muted-foreground mt-0.5">
                        {formatViDate(data.export_date)}
                    </div>
                </div>
                {/* Right: accounting reference */}
                <div className="w-[220px] shrink-0 text-[12px] px-3 py-2 space-y-0.5">
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-6">Nợ:</span>
                        <span className="font-semibold">131</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-muted-foreground w-6">Có:</span>
                        <span className="font-semibold">156</span>
                    </div>
                    <div className="flex gap-1 text-[11px] text-muted-foreground pt-1 border-t border-gray-200">
                        <span>Số:</span>
                        <span className="font-medium text-foreground">{data.export_no}</span>
                    </div>
                </div>
            </div>

            {/* ── Info lines ── */}
            <div className="border border-b-0 border-gray-400 px-3 py-2 space-y-1 text-[13px]">
                <div>
                    <span className="text-muted-foreground">- Họ và tên người nhận hàng:&nbsp;</span>
                    <span className="font-semibold">{customerName || ".................................."}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">- Địa chỉ (bộ phận):&nbsp;</span>
                    <span className="font-medium">{deliveryAddress}</span>
                </div>
                {/*<div>
                    <span className="text-muted-foreground">- Lý do xuất kho:&nbsp;</span>
                    <span className="font-medium">{reason}</span>
                </div>*/}
                <div className="flex flex-wrap gap-x-8">
                    <div>
                        <span className="text-muted-foreground">- Xuất tại kho (ngăn lô):&nbsp;</span>
                        <span className="font-medium">{warehouseName}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Địa điểm:&nbsp;</span>
                        <span className="font-medium">
                            {(data as any).delivery?.delivery_address ?? ""}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    )
}
