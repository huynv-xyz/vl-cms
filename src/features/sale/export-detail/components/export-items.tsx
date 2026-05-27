import type { Export, ExportItem } from "../../export/data/schema"
import type { OrderItem } from "@/features/sale/order/data/schema"
import { cn } from "@/lib/utils"

// ── helpers ──────────────────────────────────────────────────────────────

function formatQty(val?: number | string | null): string {
    if (val === null || val === undefined || val === "") return ""
    const n = Number(val)
    if (Number.isNaN(n)) return String(val)
    // Remove trailing zeros for decimals
    return n % 1 === 0 ? String(n) : n.toString()
}

function lineTypeLabel(lineType?: string | null): string {
    if (lineType === "PROMOTION") return "Hàng tặng"
    if (lineType === "SAMPLE") return "Hàng mẫu"
    return "Hàng bán"
}

// ── types ─────────────────────────────────────────────────────────────────

type Props = {
    data: Export
    items: ExportItem[]
}

// ── component ─────────────────────────────────────────────────────────────

export function ExportItems({ data, items }: Props) {

    // Build product_id → order item map for enrichment
    const orderItemMap = new Map<number, OrderItem>()
    const orderItems: OrderItem[] = (data as any).order?.items ?? []
    for (const oi of orderItems) {
        if (oi.product_id != null) {
            orderItemMap.set(oi.product_id, oi)
        }
    }

    // Totals
    const totalRequired = items.reduce((sum, item) => {
        const oi = item.product_id != null ? orderItemMap.get(item.product_id) : undefined
        return sum + Number(oi?.quantity ?? item.quantity ?? 0)
    }, 0)

    const totalActual = items.reduce(
        (sum, item) => sum + Number(item.quantity ?? 0),
        0
    )

    // Padding rows so table has at least 5 data rows
    const padCount = Math.max(0, 5 - items.length)

    return (
        <div>

            {/* ── Product table ── */}
            <table className="w-full text-xs border-collapse border border-gray-400">
                <thead>
                    {/* Row 1: merged headers */}
                    <tr className="bg-gray-100 text-center font-semibold">
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[40px]"
                            rowSpan={2}
                        >
                            STT
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle"
                            rowSpan={2}
                        >
                            Tên, nhãn hiệu, quy cách, phẩm chất vật tư,
                            <br />
                            dụng cụ sản phẩm, hàng hóa
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[70px]"
                            rowSpan={2}
                        >
                            Đơn vị tính
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[130px]"
                            rowSpan={2}
                        >
                            Mô Tả Hàng Hóa
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1"
                            colSpan={2}
                        >
                            Số lượng
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[110px]"
                            rowSpan={2}
                        >
                            Hình thức xuất hàng
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[130px]"
                            rowSpan={2}
                        >
                            Xuất tại kho
                        </th>
                    </tr>
                    {/* Row 2: Yêu cầu / Thực xuất */}
                    <tr className="bg-gray-100 text-center font-semibold">
                        <th className="border border-gray-400 px-2 py-1 w-[72px]">
                            Yêu cầu
                        </th>
                        <th className="border border-gray-400 px-2 py-1 w-[72px]">
                            Thực xuất
                        </th>
                    </tr>
                    {/* Column reference row A–4 */}
                    <tr className="bg-gray-50 text-center text-[11px] text-muted-foreground italic">
                        {["A", "B", "C", "D", "1", "2", "3", "4"].map((label) => (
                            <td
                                key={label}
                                className="border border-gray-400 px-1 py-0.5"
                            >
                                {label}
                            </td>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, idx) => {
                        const oi =
                            item.product_id != null
                                ? orderItemMap.get(item.product_id)
                                : undefined

                        // Display name: prefer order item description, then quote_name, then name
                        const productDisplayName =
                            oi?.description ||
                            item.product?.quote_name ||
                            item.product?.name ||
                            `[SP #${item.product_id}]`

                        return (
                            <tr
                                key={item.id}
                                className={cn(
                                    "align-top",
                                    idx % 2 === 1 ? "bg-gray-50/40" : ""
                                )}
                            >
                                <td className="border border-gray-400 px-2 py-1.5 text-center">
                                    {idx + 1}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5">
                                    {item.product?.name}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5 text-center">
                                    {item.product?.sale_unit_name ||
                                        item.product?.unit ||
                                        ""}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5 text-center">
                                    {oi?.description}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5 text-right tabular-nums">
                                    {formatQty(oi?.quantity ?? item.quantity)}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5 text-right font-semibold tabular-nums">
                                    {formatQty(item.quantity)}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5 text-center">
                                    {lineTypeLabel(oi?.line_type)}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5">
                                    {item.warehouse?.name ?? ""}
                                </td>
                            </tr>
                        )
                    })}

                    {/* Padding rows */}
                    {Array.from({ length: padCount }).map((_, i) => (
                        <tr key={`pad-${i}`} className="h-8">
                            {Array.from({ length: 8 }).map((_, j) => (
                                <td
                                    key={j}
                                    className="border border-gray-400 px-2 py-1"
                                >
                                    &nbsp;
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr className="font-semibold bg-gray-100">
                        <td
                            colSpan={4}
                            className="border border-gray-400 px-2 py-1.5 text-right"
                        >
                            Cộng
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 text-right tabular-nums">
                            {formatQty(totalRequired)}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 text-right tabular-nums">
                            {formatQty(totalActual)}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5" />
                        <td className="border border-gray-400 px-2 py-1.5" />
                    </tr>
                </tfoot>
            </table>

            {/* ── Footer note ── */}
            <div className="border border-t-0 border-gray-400 px-3 py-1.5 text-xs text-muted-foreground">
                - Số chứng từ gốc kèm theo: .......................................
            </div>

            {/* ── Signature section ── */}
            <div className="border border-t-0 border-gray-400 px-4 pt-3 pb-5">
                <div className="mb-7 mr-10 text-right text-[11px] italic text-muted-foreground">
                    Ngày ...... tháng ...... năm .........
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-[12px]">
                    {[
                        { role: "Người lập biểu", sign: "(Ký, họ tên)" },
                        { role: "Người nhận hàng", sign: "(Ký, họ tên)" },
                        { role: "Thủ kho", sign: "(Ký, họ tên)" },
                        { role: "Kế toán trưởng", sign: "(Ký, họ tên)" },
                        { role: "Quản lý nhà máy", sign: "(Ký, họ tên)" },
                    ].map(({ role, sign }) => (
                        <div key={role} className="px-1 leading-tight">
                            <div className="min-h-[30px] font-semibold">{role}</div>
                            <div className="text-[11px] italic text-muted-foreground mt-0.5">
                                {sign}
                            </div>
                            {/* Signature space */}
                            <div className="mt-16 text-[11px] text-muted-foreground">
                                &nbsp;
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
