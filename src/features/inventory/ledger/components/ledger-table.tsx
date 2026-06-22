import type React from "react"
import { useMemo } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { CalendarDays, Filter, Printer } from "lucide-react"
import { toast } from "sonner"

import { getVoucherPrintDetail, listVoucherTypes, VOUCHER_TYPE_LABEL, type InventoryVoucherPrintDetail } from "@/api/inventory/voucher"
import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { LongText } from "@/components/long-text"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatNumber } from "@/lib/utils"
import type { InventoryLedgerReportRow } from "../data/schema"
import { getDocTypeMeta } from "../data/schema"

type Props = {
    data: InventoryLedgerReportRow[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        product_id?: number
        warehouse_id?: number
        doc_type?: string
        from_date?: string
        to_date?: string
    }
    onFiltersChange: (f: Props["filters"]) => void
}

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

export function InventoryLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const currentPage = pagination.pageIndex + 1
    const { data: inboundDocTypes = [] } = useQuery({
        queryKey: ["inventory-voucher-types", "I"],
        queryFn: () => listVoucherTypes("I"),
    })
    const { data: outboundDocTypes = [] } = useQuery({
        queryKey: ["inventory-voucher-types", "O"],
        queryFn: () => listVoucherTypes("O"),
    })
    const inboundDocValues = useMemo(() => new Set(inboundDocTypes.map((type) => type.code)), [inboundDocTypes])
    const outboundDocValues = useMemo(() => new Set(outboundDocTypes.map((type) => type.code)), [outboundDocTypes])

    const setFilter = (key: keyof Props["filters"], value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const inboundValue =
        filters.doc_type && inboundDocValues.has(filters.doc_type as any)
            ? filters.doc_type
            : "ALL"
    const outboundValue =
        filters.doc_type && outboundDocValues.has(filters.doc_type as any)
            ? filters.doc_type
            : "ALL"

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="gap-3 border-b px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base">Sổ kho đã ghi nhận</CardTitle>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {formatNumber((data || []).length)} dòng
                        </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit font-mono">
                        Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                    </Badge>
                </div>

                <div className="bg-muted/40 -mx-4 -mb-3 border-t px-4 py-3">
                    <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold uppercase">
                        <Filter className="h-3.5 w-3.5" />
                        Bộ lọc sổ kho
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm chứng từ, mã hàng, tên hàng..."
                            wrapperClassName="relative h-10 min-w-[220px] flex-[1_1_240px] xl:max-w-[300px]"
                            className={cn(controlClass, "pl-10")}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-[260px] flex-[1.3_1_280px] py-0 xl:max-w-[380px]")}
                            value={filters.product_id}
                            onChange={(value: any) => setFilter("product_id", value || undefined)}
                            placeholder="Sản phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(product: any) => ({
                                value: product.id,
                                label: `${product.code} - ${product.name}`,
                            })}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-[180px] flex-[0.8_1_200px] py-0 xl:max-w-[240px]")}
                            value={filters.warehouse_id}
                            onChange={(value: any) => setFilter("warehouse_id", value || undefined)}
                            placeholder="Kho hàng"
                            dataSource={{
                                getList: listWarehouses,
                                getById: getWarehouse,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(warehouse: any) => ({
                                value: warehouse.id,
                                label: warehouse.name,
                            })}
                        />

                        <Select
                            value={inboundValue}
                            onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[180px] flex-[0.9_1_210px] xl:max-w-[260px]")}>
                                <SelectValue placeholder="Chứng từ nhập" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ nhập</SelectItem>
                                {inboundDocTypes.map((type) => (
                                    <SelectItem key={type.code} value={type.code}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={outboundValue}
                            onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[180px] flex-[0.9_1_210px] xl:max-w-[260px]")}>
                                <SelectValue placeholder="Chứng từ xuất" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ xuất</SelectItem>
                                {outboundDocTypes.map((type) => (
                                    <SelectItem key={type.code} value={type.code}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DatePicker
                            className="min-w-[140px] flex-[0_1_150px] [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.from_date}
                            onChange={(value) => setFilter("from_date", value || undefined)}
                            placeholder="Từ ngày"
                        />

                        <DatePicker
                            className="min-w-[140px] flex-[0_1_150px] [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.to_date}
                            onChange={(value) => setFilter("to_date", value || undefined)}
                            placeholder="Đến ngày"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1900px] text-sm">
                        <thead className="bg-muted/50 text-muted-foreground border-b text-xs">
                            <tr>
                                <Th className="w-14 text-center">STT</Th>
                                <Th className="w-28">Ngày</Th>
                                <Th className="w-44">Chứng từ</Th>
                                <Th className="w-64">Diễn giải</Th>
                                <Th className="w-52">Tên nhà cung cấp</Th>
                                <Th className="w-20">TK Nợ</Th>
                                <Th className="w-20">TK Có</Th>
                                <Th className="min-w-[300px]">Sản phẩm</Th>
                                <Th className="w-20">ĐVT</Th>
                                <Th className="w-32">Số lô</Th>
                                <Th className="w-52">Kho</Th>
                                <Th className="w-28 text-right">Nhập</Th>
                                <Th className="w-28 text-right">Xuất</Th>
                                <Th className="w-28 text-right">{"\u0110\u01a1n gi\u00e1"}</Th>
                                <Th className="w-32 text-right">{"Th\u00e0nh ti\u1ec1n"}</Th>
                                <Th className="w-32 text-right">Tồn sau</Th>
                                <Th className="w-56">Loại</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data || []).map((item, index) => (
                                <LedgerRow
                                    key={`${item.id}-${index}`}
                                    index={pagination.pageIndex * pagination.pageSize + index + 1}
                                    item={item}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {!(data || []).length ? (
                    <div className="text-muted-foreground flex min-h-[180px] items-center justify-center text-sm">
                        Không tìm thấy dòng sổ kho.
                    </div>
                ) : null}
            </CardContent>

            <div className="bg-muted/30 border-t px-4 py-3">
                <CardPagination
                    pageIndex={pagination.pageIndex}
                    pageCount={pageCount}
                    onPageChange={setPageIndex}
                    className="px-0"
                />
            </div>
        </Card>
    )
}

function LedgerRow({
    index,
    item,
}: {
    index: number
    item: InventoryLedgerReportRow
}) {
    const meta = getDocTypeMeta(item.doc_type)
    const quantityIn = Number(item.quantity_in || 0)
    const quantityOut = Number(item.quantity_out || 0)

    return (
        <tr className="hover:bg-muted/30 border-b">
            <Td className="text-muted-foreground text-center font-mono">{formatNumber(index)}</Td>
            <Td>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <CalendarDays className="text-muted-foreground h-3.5 w-3.5" />
                    {formatDate(item.posting_date)}
                </div>
            </Td>
            <Td>
                <div className="flex items-center gap-1.5">
                    <div className="text-primary font-mono font-semibold">{item.doc_no || `#${item.id}`}</div>
                    {item.voucher_id ? <VoucherPrintButton voucherId={item.voucher_id} /> : null}
                </div>
            </Td>
            <Td>
                <LedgerLongText value={item.description} className="max-w-[240px]" />
            </Td>
            <Td>
                <LedgerLongText value={item.supplier_name} className="max-w-[190px]" />
            </Td>
            <Td className="text-muted-foreground font-mono text-xs">
                {item.tk_no || "-"}
            </Td>
            <Td className="text-muted-foreground font-mono text-xs">
                {item.tk_co || "-"}
            </Td>
            <Td>
                <div className="min-w-0">
                    <div className="font-semibold">{item.product_name || "-"}</div>
                    <div className="text-muted-foreground font-mono text-xs">{item.product_code || "-"}</div>
                </div>
            </Td>
            <Td className="text-muted-foreground">
                {item.unit || "-"}
            </Td>
            <Td className="font-mono text-xs">
                {item.lot_code || "-"}
            </Td>
            <Td>
                <div className="truncate font-medium">{item.warehouse_name || "-"}</div>
            </Td>
            <Td className="text-right">
                <Quantity value={quantityIn} tone="in" />
            </Td>
            <Td className="text-right">
                <Quantity value={quantityOut} tone="out" />
            </Td>
            <Td className="text-right tabular-nums">
                {formatNumber(Number(item.unit_price || 0))}
            </Td>
            <Td className="text-right tabular-nums">
                {formatNumber(Number(item.amount || 0))}
            </Td>
            <Td className="text-right font-bold tabular-nums">
                {formatNumber(Number(item.balance_quantity || 0))}
            </Td>
            <Td>
                <div className="text-muted-foreground line-clamp-2 text-xs leading-4">
                    {meta.label}
                </div>
            </Td>
        </tr>
    )
}

function VoucherPrintButton({ voucherId }: { voucherId: number }) {
    const mutation = useMutation({
        mutationFn: () => getVoucherPrintDetail(voucherId),
        onSuccess: (voucher) => printInventoryVoucher(voucher),
        onError: (error: any) => toast.error(error?.message || "Không tải được phiếu kho để in"),
    })

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={mutation.isPending}
            title="In phiếu"
            onClick={() => mutation.mutate()}
        >
            <Printer className="h-3.5 w-3.5" />
        </Button>
    )
}

function LedgerLongText({
    value,
    className,
}: {
    value?: string | null
    className?: string
}) {
    return (
        <LongText
            className={cn("text-muted-foreground text-xs leading-4", className)}
            contentClassName="max-w-[520px] whitespace-normal break-words leading-relaxed"
        >
            {value || "-"}
        </LongText>
    )
}

function printInventoryVoucher(voucher: InventoryVoucherPrintDetail) {
    const items = voucher.items || []
    if (!items.length) {
        toast.info("Phiếu chưa có dòng để in")
        return
    }

    const isInbound = String(voucher.type?.direction || "").toUpperCase() === "I"
    const title = isInbound ? "PHIẾU NHẬP KHO" : "PHIẾU XUẤT KHO"
    const voucherNo = voucher.voucher_no || `#${voucher.id}`
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const html = `
        <html>
            <head>
                <title>${escapeHtml(title)} ${escapeHtml(voucherNo)}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
                    .company { text-align: center; margin-bottom: 8px; }
                    .company-name { font-weight: 700; font-size: 13px; text-transform: uppercase; }
                    .company-address { font-size: 11px; color: #6b7280; }
                    .meta-line { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 6px 10px; border: 1px solid #e5e7eb; font-size: 12px; }
                    .title { text-align: center; padding: 14px 0 10px; }
                    .title h1 { margin: 0; font-size: 22px; letter-spacing: .02em; }
                    .date { margin-top: 3px; font-size: 12px; color: #6b7280; font-style: italic; }
                    .info { font-size: 13px; line-height: 1.6; margin: 6px 0 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #9ca3af; padding: 5px 6px; vertical-align: top; }
                    th { background: #f3f4f6; text-align: center; font-weight: 700; }
                    .right { text-align: right; }
                    .center { text-align: center; }
                    .mono { font-family: Consolas, monospace; }
                    .note { padding: 7px 4px; font-size: 12px; color: #4b5563; }
                    .sign-date { margin: 12px 28px 20px 0; text-align: right; font-size: 11px; color: #6b7280; font-style: italic; }
                    .signatures { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; font-size: 12px; }
                    .sign-role { font-weight: 700; min-height: 18px; }
                    .sign-hint { color: #6b7280; font-size: 11px; font-style: italic; }
                    .sign-space { margin-top: 44px; font-weight: 700; }
                    @media print {
                        body { padding: 8px; }
                        table { font-size: 10px; line-height: 1.2; }
                        th, td { padding: 3px 5px; }
                    }
                </style>
            </head>
            <body>
                <div class="company">
                    <div class="company-name">CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT</div>
                    <div class="company-address">Số 54C1, KP 11, Phường Tân Triều, Tỉnh Đồng Nai, Việt Nam</div>
                </div>
                <div class="meta-line">
                    <div>Số phiếu: <strong class="mono">${escapeHtml(voucherNo)}</strong></div>
                    <div>Loại: <strong>${escapeHtml(voucher.type?.name || VOUCHER_TYPE_LABEL[voucher.voucher_type_code || ""] || voucher.voucher_type_code || "-")}</strong></div>
                </div>
                <div class="title">
                    <h1>${escapeHtml(title)}</h1>
                    <div class="date">${escapeHtml(formatViPrintDate(voucher.posting_date || voucher.document_date))}</div>
                </div>
                <div class="info">
                    <div>- Kho ${isInbound ? "nhập" : "xuất"}: <strong>${escapeHtml(formatWarehouse(voucher.warehouse))}</strong></div>
                    <div>- Lý do: ${escapeHtml(voucher.description || VOUCHER_TYPE_LABEL[voucher.voucher_type_code || ""] || "")}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 38px">STT</th>
                            <th style="width: 90px">Mã hàng</th>
                            <th>Tên sản phẩm, hàng hóa</th>
                            <th style="width: 50px">ĐVT</th>
                            <th style="width: 90px">Số lô</th>
                            <th style="width: 85px">HSD</th>
                            <th style="width: 80px">Số lượng</th>
                            <th style="width: 90px">Đơn giá</th>
                            <th style="width: 100px">Thành tiền</th>
                            <th style="width: 130px">${isInbound ? "Nhập tại kho" : "Xuất tại kho"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, index) => `
                            <tr>
                                <td class="center">${index + 1}</td>
                                <td class="mono">${escapeHtml(item.product?.code || "")}</td>
                                <td>${escapeHtml(item.product?.name || `[SP #${item.product_id || ""}]`)}</td>
                                <td class="center">${escapeHtml(item.unit || item.product?.unit || "")}</td>
                                <td class="mono">${escapeHtml(item.lot_code || "")}</td>
                                <td class="center">${escapeHtml(formatDate(item.expiry_date))}</td>
                                <td class="right">${escapeHtml(formatQty(item.quantity))}</td>
                                <td class="right">${escapeHtml(formatMoney(item.unit_price))}</td>
                                <td class="right">${escapeHtml(formatMoney(item.amount))}</td>
                                <td>${escapeHtml(formatWarehouse(item.warehouse))}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" class="right"><strong>Cộng</strong></td>
                            <td class="right"><strong>${escapeHtml(formatQty(totalQuantity))}</strong></td>
                            <td></td>
                            <td class="right"><strong>${escapeHtml(formatMoney(totalAmount))}</strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <div class="note">- Số chứng từ gốc kèm theo: .......................................</div>
                <div class="sign-date">Ngày ...... tháng ...... năm .........</div>
                <div class="signatures">
                    <div><div class="sign-role">Người lập biểu</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Người giao hàng</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Thủ kho</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Kế toán trưởng</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Quản lý nhà máy</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                </div>
            </body>
        </html>
    `

    const win = window.open("", "_blank", "width=1100,height=800")
    if (!win) {
        toast.error("Trình duyệt đang chặn cửa sổ in")
        return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
}

function Quantity({ value, tone }: { value: number; tone: "in" | "out" }) {
    if (!value) return <span className="text-muted-foreground">-</span>

    return (
        <span className={cn("font-semibold tabular-nums", tone === "in" ? "text-emerald-600" : "text-rose-600")}>
            {formatNumber(value)}
        </span>
    )
}

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("px-3 py-2 text-left font-semibold", className)} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("px-3 py-1.5 align-middle", className)} {...props} />
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}

function formatViPrintDate(dateStr?: string): string {
    if (!dateStr) return "Ngày ...... tháng ...... năm ........."
    const [year, month, day] = dateStr.split("T")[0].split("-")
    if (year && month && day) {
        return `Ngày ${day} tháng ${month} năm ${year}`
    }
    return dateStr
}

function formatWarehouse(warehouse?: { code?: string; name?: string } | null) {
    if (!warehouse) return "-"
    return warehouse.code ? `${warehouse.code} - ${warehouse.name || ""}` : warehouse.name || "-"
}

function formatQty(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return ""
    const n = Number(value)
    if (Number.isNaN(n)) return String(value)
    return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 6,
    }).format(n)
}

function formatMoney(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return ""
    const n = Number(value)
    if (Number.isNaN(n)) return String(value)
    return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 2,
    }).format(n)
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
