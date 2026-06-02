import type { Export, ExportItem } from "../../export/data/schema"
import type { OrderItem } from "@/features/sale/order/data/schema"
import { cn } from "@/lib/utils"

// ── helpers ──────────────────────────────────────────────────────────────

function formatQty(val?: number | string | null): string {
    if (val === null || val === undefined || val === "") return ""
    const n = Number(val)
    if (Number.isNaN(n)) return String(val)
    return n.toLocaleString("en-US", {
        maximumFractionDigits: 6,
    })
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

const SIGNATURES = [
    {
        role: "Ng\u01b0\u1eddi l\u1eadp bi\u1ec3u",
        sign: "(K\u00fd, h\u1ecd t\u00ean)",
        name: "Tr\u1ea7n Th\u1ecb Ch\u00e2u Loan",
    },
    {
        role: "Ng\u01b0\u1eddi nh\u1eadn h\u00e0ng",
        sign: "(K\u00fd, h\u1ecd t\u00ean)",
    },
    {
        role: "Th\u1ee7 kho",
        sign: "(K\u00fd, h\u1ecd t\u00ean)",
    },
    {
        role: "K\u1ebf to\u00e1n tr\u01b0\u1edfng",
        sign: "(K\u00fd, h\u1ecd t\u00ean)",
    },
    {
        role: "Qu\u1ea3n l\u00fd nh\u00e0 m\u00e1y",
        sign: "(K\u00fd, h\u1ecd t\u00ean)",
        name: "Nguy\u1ec5n T\u1ea5n Th\u1ecbnh",
    },
]

// ── component ─────────────────────────────────────────────────────────────

export function ExportItems({ data, items }: Props) {

    // Build order_item_id → order item map for enrichment
    const orderItemMap = new Map<number, OrderItem>()
    const orderItems: OrderItem[] = (data as any).order?.items ?? []
    for (const oi of orderItems) {
        if (oi.id != null) {
            orderItemMap.set(oi.id, oi)
        }
    }

    // Totals
    const totalRequired = items.reduce((sum, item) => {
        const oi = item.order_item_id != null ? orderItemMap.get(item.order_item_id) : undefined
        return sum + Number(oi?.quantity ?? item.quantity ?? 0)
    }, 0)

    const totalActual = items.reduce(
        (sum, item) => sum + Number(item.quantity ?? 0),
        0
    )

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
                            className="export-print-hide border border-gray-400 px-2 py-1.5 align-middle w-[92px]"
                            rowSpan={2}
                        >
                            Mã hàng
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle"
                            rowSpan={2}
                        >
                            Tên sản phẩm, hàng hóa
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[50px]"
                            rowSpan={2}
                        >
                            ĐVT
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle"
                            rowSpan={2}
                        >
                            Mô tả
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1"
                            colSpan={2}
                        >
                            Số lượng
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[100px]"
                            rowSpan={2}
                        >
                            Hình thức xuất
                        </th>
                        <th
                            className="export-print-hide border border-gray-400 px-2 py-1.5 align-middle w-[130px]"
                            rowSpan={2}
                        >
                            Xuất tại kho
                        </th>
                        <th
                            className="border border-gray-400 px-2 py-1.5 align-middle w-[80px]"
                            rowSpan={2}
                        >
                            Số lô
                        </th>
                    </tr>
                    {/* Row 2: Yêu cầu / Thực xuất */}
                    <tr className="bg-gray-100 text-center font-semibold">
                        <th className="border border-gray-400 px-2 py-1 w-[65px]">
                            Yêu cầu
                        </th>
                        <th className="border border-gray-400 px-2 py-1 w-[65px]">
                            Thực xuất
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {items.map((item, idx) => {
                        const oi =
                            item.order_item_id != null
                                ? orderItemMap.get(item.order_item_id)
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
                                <td className="export-print-hide border border-gray-400 px-2 py-1.5 font-mono text-[11px]">
                                    {item.product?.code ?? ""}
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
                                <td className="export-print-hide border border-gray-400 px-2 py-1.5">
                                    {item.warehouse?.code
                                        ? `${item.warehouse.code} - ${item.warehouse.name}`
                                        : item.warehouse?.name ?? ""}
                                </td>
                                <td className="border border-gray-400 px-2 py-1.5">
                                    {item.lot_no || item.lot_nos || ""}
                                </td>
                            </tr>
                        )
                    })}

                </tbody>

                <tfoot>
                    <tr className="export-screen-footer font-semibold bg-gray-100">
                        <td
                            colSpan={5}
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
                        <td className="export-print-hide border border-gray-400 px-2 py-1.5" />
                        <td className="border border-gray-400 px-2 py-1.5" />
                        <td className="border border-gray-400 px-2 py-1.5" />
                    </tr>
                    <tr className="export-print-footer hidden font-semibold bg-gray-100">
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
            <div className="export-print-note px-3 py-1.5 text-xs text-muted-foreground">
                - Số chứng từ gốc kèm theo: .......................................
            </div>

            {/* ── Signature section ── */}
            <div className="export-print-signatures px-4 pt-3 pb-5">
                <div className="export-print-sign-date mb-7 mr-10 text-right text-[11px] italic text-muted-foreground">
                    Ngày ...... tháng ...... năm .........
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-[12px]">
                    {SIGNATURES.map(({ role, sign, name }) => (
                        <div key={role} className="px-1 leading-tight">
                            <div className="min-h-[18px] font-semibold">{role}</div>
                            <div className="text-[11px] italic text-muted-foreground">
                                {sign}
                            </div>
                            <div className="export-print-sign-space mt-12 text-[12px] font-semibold text-foreground">
                                {name || "\u00a0"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}
