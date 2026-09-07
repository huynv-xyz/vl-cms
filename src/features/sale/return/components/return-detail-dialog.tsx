import { useQuery } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"
import { getReturn } from "@/api/sale/return"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DialogLoadingState } from "@/components/loading-state"
import {
    DetailInfoGrid,
    DetailInfoItem,
    DetailSummary,
} from "@/components/base-detail-dialog"
import { formatNumber } from "@/lib/utils"
import type { Return } from "../data/schema"
import { returnStatusLabel } from "./return-status"

export function ReturnDetailDialog({
    open,
    id,
    onClose,
    printOnOpen = false,
}: {
    open: boolean
    id?: number
    onClose: () => void
    printOnOpen?: boolean
}) {
    const query: any = useQuery({
        queryKey: ["return-detail", id],
        queryFn: () => getReturn(id!),
        enabled: open && !!id,
    })

    const data: Return | undefined = query.data?.data ?? query.data
    const canPrint = data?.status === "DONE"

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="flex max-h-[92vh] w-[min(96vw,980px)] !max-w-none flex-col gap-0 overflow-hidden p-0 print:hidden">
                <DialogHeader className="flex-row items-center justify-between border-b bg-muted/20 px-5 py-3.5 pr-14 space-y-0">
                    <DialogTitle className="text-base font-semibold">
                        Chi tiết phiếu trả
                        {data?.return_no && (
                            <span className="ml-2 font-mono text-primary">
                                {data.return_no}
                            </span>
                        )}
                    </DialogTitle>

                    {canPrint && data?.return_no && <Button variant="outline" size="sm" asChild><a href={`/inventory/vouchers?keyword=${encodeURIComponent(data.return_no)}`} target="_blank" rel="noreferrer">Mở chứng từ kho<ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button>}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {query.isLoading && <DialogLoadingState />}

                    {!query.isLoading && data && (
                        <div className="space-y-4">
                            <DetailSummary
                                title={data.return_no}
                                subtitle={data.order?.order_no ? `Đơn hàng ${data.order.order_no}` : undefined}
                                status={returnStatusLabel(data.status)}
                            />

                            <DetailInfoGrid>
                                <DetailInfoItem label="Ngày trả" value={formatReturnDate(data.return_date || data.created_at)} />
                                <DetailInfoItem label="Khách hàng" value={formatCustomer(data)} />
                                <DetailInfoItem label="Đơn hàng" value={data.order?.order_no || data.order_id || "-"} />
                                <DetailInfoItem label="Phiếu xuất" value={data.export?.export_no || data.export_id || "-"} />
                                <DetailInfoItem label="Lý do" value={data.reason || "-"} className="lg:col-span-2" />
                            </DetailInfoGrid>

                            <ReturnItemsTable items={data.items} />
                        </div>
                    )}

                    {!query.isLoading && !data && !query.error && (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Không tìm thấy phiếu trả.
                        </div>
                    )}

                    {query.error && (
                        <div className="py-10 text-center text-sm text-red-500">
                            Lỗi tải dữ liệu.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ReturnItemsTable({ items }: { items?: any[] }) {
    return (
        <div className="mt-4 overflow-hidden rounded-md border">
            <table className="w-full text-sm">
                <thead className="bg-muted/60">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium">Mã sản phẩm</th>
                        <th className="px-3 py-2 text-left font-medium">Tên sản phẩm</th>
                        <th className="px-3 py-2 text-left font-medium">ĐVT</th>
                        <th className="px-3 py-2 text-right font-medium">SL</th>
                        <th className="px-3 py-2 text-right font-medium">Đơn giá</th>
                        <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                        <th className="px-3 py-2 text-left font-medium">Kho nhập</th>
                        <th className="px-3 py-2 text-left font-medium">Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    {items?.length ? (
                        items.map((item) => (
                            <tr key={item.id} className="border-t">
                                <td className="px-3 py-2 align-top font-mono text-xs font-medium">
                                    {item.product?.code || "-"}
                                </td>
                                <td className="px-3 py-2 align-top">
                                    {item.product?.name || "-"}
                                </td>
                                <td className="px-3 py-2 align-top text-muted-foreground">
                                    {item.product?.unit || "-"}
                                </td>
                                <td className="px-3 py-2 text-right align-top font-medium">
                                    {formatNumber(Number(item.quantity || 0))}
                                </td>
                                <td className="px-3 py-2 text-right align-top font-medium">
                                    {item.unit_price == null ? "-" : formatNumber(Number(item.unit_price))}
                                </td>
                                <td className="px-3 py-2 text-right align-top font-medium">
                                    {item.unit_price == null
                                        ? "-"
                                        : formatNumber(Number(item.quantity || 0) * Number(item.unit_price || 0))}
                                </td>
                                <td className="px-3 py-2 align-top">
                                    {item.warehouse?.name || item.warehouse?.code || item.warehouse_id || "-"}
                                </td>
                                <td className="px-3 py-2 align-top">
                                    {item.note || "-"}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                                Chưa có sản phẩm
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

function ReturnStockInPrintDocument({ data }: { data: Return }) {
    return (
        <div className="bg-white text-[13px]">
            <div className="return-print-company mb-2 text-center">
                <div className="text-sm font-bold uppercase tracking-wide">
                    CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT
                </div>
                <div className="text-xs text-muted-foreground">
                    Số 54C1, KP 11, Phường Tân Triều, Tỉnh Đồng Nai, Việt Nam
                </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50/60 px-3 py-1.5">
                <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold text-muted-foreground">
                        Số phiếu NK
                    </span>
                    <span className="border border-blue-300 bg-blue-50 px-3 py-0.5 text-sm font-bold">
                        {data.return_no ?? "-"}
                    </span>
                </div>
                <div className="text-[12px] text-muted-foreground">
                    {data.export?.export_no ? `Theo phiếu xuất ${data.export.export_no}` : "Nhập trả hàng"}
                </div>
            </div>

            <div className="py-3 text-center">
                <div className="return-print-title text-[22px] font-extrabold uppercase tracking-wide">
                    PHIẾU NHẬP KHO
                </div>
                <div className="mt-0.5 text-[12px] italic text-muted-foreground">
                    {formatViDate(data.return_date || data.created_at)}
                </div>
            </div>

            <div className="return-print-info-lines space-y-1 px-3 py-2 text-[13px]">
                <div>
                    <span className="text-muted-foreground">- Họ và tên người giao hàng:&nbsp;</span>
                    <span className="font-semibold">{getCustomer(data)?.name || ""}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">- Địa chỉ (bộ phận):&nbsp;</span>
                    <span className="font-medium">{getCustomer(data)?.address || ""}</span>
                </div>
                <div>
                    <span className="text-muted-foreground">- Lý do nhập kho:&nbsp;</span>
                    <span className="font-medium">{data.reason || "Nhập kho hàng trả lại"}</span>
                </div>
            </div>

            <ReturnStockInItems data={data} items={data.items ?? []} />
        </div>
    )
}

function ReturnStockInItems({ data, items }: { data: Return; items: any[] }) {
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)

    return (
        <div>
            <table className="w-full table-fixed border-collapse border border-gray-400 text-xs">
                <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "33%" }} />
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "7%" }} />
                </colgroup>
                <thead>
                    <tr className="bg-gray-100 text-center font-semibold">
                        <th className="border border-gray-400 px-0.5 py-1.5 align-middle" rowSpan={2}>
                            STT
                        </th>
                        <th className="border border-gray-400 px-1 py-1.5 align-middle" rowSpan={2}>
                            Mã hàng
                        </th>
                        <th className="border border-gray-400 px-2 py-1.5 align-middle" rowSpan={2}>
                            Tên sản phẩm, hàng hóa
                        </th>
                        <th className="border border-gray-400 px-0.5 py-1.5 align-middle" rowSpan={2}>
                            ĐVT
                        </th>
                        <th className="border border-gray-400 px-0.5 py-1" colSpan={2}>
                            Số lượng
                        </th>
                        <th className="border border-gray-400 px-0.5 py-1.5 align-middle" rowSpan={2}>
                            Hình thức nhập
                        </th>
                        <th className="border border-gray-400 px-1 py-1.5 align-middle" rowSpan={2}>
                            Nhập tại kho
                        </th>
                        <th className="border border-gray-400 px-0.5 py-1.5 align-middle" rowSpan={2}>
                            Số lô
                        </th>
                    </tr>
                    <tr className="bg-gray-100 text-center font-semibold">
                        <th className="border border-gray-400 px-0.5 py-1">
                            Yêu cầu
                        </th>
                        <th className="border border-gray-400 px-0.5 py-1">
                            Thực nhập
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id} className="align-top">
                            <td className="border border-gray-400 px-1 py-1.5 text-center">
                                {index + 1}
                            </td>
                            <td className="break-words border border-gray-400 px-1 py-1.5 text-center font-mono text-[9.5px] leading-tight">
                                {item.product?.code ?? ""}
                            </td>
                            <td className="border border-gray-400 px-2 py-1.5">
                                {item.product?.name ?? ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1.5 text-center">
                                {item.product?.unit || ""}
                            </td>
                            <td className="border border-gray-400 px-1 py-1.5 text-right tabular-nums">
                                {formatQty(item.quantity)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1.5 text-right font-semibold tabular-nums">
                                {formatQty(item.quantity)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1.5 text-center">
                                Trả hàng
                            </td>
                            <td className="border border-gray-400 px-1.5 py-1.5 text-center text-[10px]">
                                {formatWarehouse(item.warehouse)}
                            </td>
                            <td className="border border-gray-400 px-1 py-1.5" />
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                        <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right">
                            Cộng
                        </td>
                        <td className="border border-gray-400 px-1 py-1.5 text-right tabular-nums">
                            {formatQty(totalQty)}
                        </td>
                        <td className="border border-gray-400 px-1 py-1.5 text-right tabular-nums">
                            {formatQty(totalQty)}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5" />
                        <td className="border border-gray-400 px-2 py-1.5" />
                        <td className="border border-gray-400 px-2 py-1.5" />
                    </tr>
                </tfoot>
            </table>

            <div className="return-print-note px-3 py-1.5 text-xs text-muted-foreground">
                - Số chứng từ gốc kèm theo: .......................................
            </div>

            <div className="return-print-signatures px-4 pt-3 pb-5">
                <div className="return-print-sign-date mb-7 mr-10 text-right text-[11px] italic text-muted-foreground">
                    Ngày ...... tháng ...... năm .........
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-[12px]">
                    {["Người lập biểu", "Người giao hàng", "Thủ kho", "Kế toán trưởng", "Quản lý nhà máy"].map((role) => (
                        <div key={role} className="px-1 leading-tight">
                            <div className="min-h-[18px] font-semibold">{role}</div>
                            <div className="text-[11px] italic text-muted-foreground">
                                (Ký, họ tên)
                            </div>
                            <div className="return-print-sign-space mt-12 text-[12px] font-semibold text-foreground">
                                &nbsp;
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function getCustomer(data: any) {
    return data.customer || data.order?.customer
}

function formatCustomer(data: any) {
    const customer = getCustomer(data)
    if (!customer) return "-"
    if (customer.code && customer.name) return `${customer.code} - ${customer.name}`
    return customer.name || customer.code || "-"
}

function formatWarehouse(warehouse?: { code?: string; name?: string } | null) {
    if (!warehouse) return ""
    return warehouse.name || warehouse.code || ""
}

function formatQty(value?: string | number | null) {
    if (value === null || value === undefined || value === "") return ""
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) return String(value)
    return numberValue.toLocaleString("en-US", {
        maximumFractionDigits: 6,
    })
}

function formatViDate(value?: string | number[]) {
    const date = parseDateParts(value)
    if (!date) return "Ngày ...... tháng ...... năm ........."
    return `Ngày ${date.day} tháng ${date.month} năm ${date.year}`
}

function formatReturnDate(value?: string | number[]) {
    const date = parseDateParts(value)
    if (!date) return "-"
    return `${date.day}/${date.month}/${date.year}`
}

function parseDateParts(value?: string | number[]) {
    if (!value) return null

    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return null
        return {
            day: String(day).padStart(2, "0"),
            month: String(month).padStart(2, "0"),
            year: String(year),
        }
    }

    const [datePart] = value.split("T")
    const normalized = datePart.includes(" ") ? datePart.split(" ")[0] : datePart
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return null

    return {
        day: match[3],
        month: match[2],
        year: match[1],
    }
}
