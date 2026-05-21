import { useMemo, useState } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Filter, Loader2, Printer, Sheet } from "lucide-react"
import { toast } from "sonner"

import { listCustomers, getCustomer } from "@/api/customer"
import { listArLedgers, type ArLedgerListParams } from "@/api/sale/ar-ledger"
import { DatePicker } from "@/components/date-picker"
import { CardPagination } from "@/components/table/card-pagination"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ArLedger } from "../data/schema"
import { AR_SOURCE_TYPES } from "./ar-ledger-columns"
import { ImportArLedgerButton } from "./ar-ledger-import-button"

type Filters = {
    source_type?: string[]
    from_date?: string
    to_date?: string
    customer_id?: number
}

type Props = {
    data: ArLedger[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: Filters
    onFiltersChange: (f: Filters) => void
}

const AR_ACCOUNT = "131"

const controlClass =
    "h-11 min-h-11 rounded-md border-slate-300 bg-white shadow-xs"

export function ArLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const [exporting, setExporting] = useState(false)

    const groups = useMemo(() => buildGroups(data), [data])

    const pageTotals = useMemo(() => {
        return {
            quantity: data.reduce((s, r) => s + num(r.quantity), 0),
            debit: data.reduce((s, r) => s + num(r.debit_amount), 0),
            credit: data.reduce((s, r) => s + num(r.credit_amount), 0),
        }
    }, [data])

    const setFilter = (key: keyof Filters, value: unknown) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const period = periodLabel(filters.from_date, filters.to_date)

    const handleExport = async () => {
        try {
            setExporting(true)
            const rows = await fetchAllRows({
                page: 1,
                size: 200,
                keyword: keyword || undefined,
                source_type: filters.source_type?.[0] || undefined,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                customer_id: filters.customer_id,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            exportReportCsv(buildGroups(rows), period)
            toast.success(`Đã xuất ${rows.length} dòng công nợ`)
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : "Xuất báo cáo thất bại",
            )
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-4">
            <style>{PRINT_CSS}</style>

            {/* ===== Thanh thao tác + bộ lọc (không in) ===== */}
            <div className="ar-no-print rounded-lg border bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                        <Filter className="h-3.5 w-3.5" />
                        Bộ lọc &amp; thao tác
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportArLedgerButton />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            In báo cáo
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sheet className="mr-2 h-4 w-4" />
                            )}
                            Xuất Excel
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 px-4 py-3">
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm số chứng từ, khách hàng, diễn giải..."
                            wrapperClassName="relative h-11 min-w-[300px] flex-[1.2_1_0]"
                            className={cn(controlClass, "pl-10")}
                        />

                        <AsyncSelect
                            className={cn(
                                controlClass,
                                "min-w-[260px] flex-[1.8_1_0] py-0",
                            )}
                            value={filters.customer_id}
                            onChange={(value: number | undefined) =>
                                setFilter("customer_id", value || undefined)
                            }
                            placeholder="Khách hàng"
                            dataSource={{
                                getList: listCustomers,
                                getById: getCustomer,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(customer: {
                                id: number
                                code?: string
                                name: string
                            }) => ({
                                value: customer.id,
                                label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
                            })}
                        />
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2">
                        <Select
                            value={filters.source_type?.[0] ?? "ALL"}
                            onValueChange={(value) =>
                                setFilter(
                                    "source_type",
                                    value === "ALL" ? undefined : [value],
                                )
                            }
                        >
                            <SelectTrigger
                                className={cn(controlClass, "min-w-[200px] flex-1")}
                            >
                                <SelectValue placeholder="Loại nghiệp vụ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả nghiệp vụ</SelectItem>
                                {AR_SOURCE_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <DatePicker
                            className={cn(
                                "h-11 min-w-[170px] flex-1",
                                "[&_button]:h-11 [&_button]:min-h-11 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
                            )}
                            value={filters.from_date}
                            onChange={(value) =>
                                setFilter("from_date", value || undefined)
                            }
                            placeholder="Từ ngày"
                        />

                        <DatePicker
                            className={cn(
                                "h-11 min-w-[170px] flex-1",
                                "[&_button]:h-11 [&_button]:min-h-11 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
                            )}
                            value={filters.to_date}
                            onChange={(value) =>
                                setFilter("to_date", value || undefined)
                            }
                            placeholder="Đến ngày"
                        />
                    </div>
                </div>
            </div>

            {/* ===== Vùng báo cáo (in được) ===== */}
            <div
                id="ar-ledger-print"
                className="rounded-lg border bg-white p-5 shadow-sm"
            >
                <ReportHeader period={period} />

                <div className="ar-print-scroll mt-8 overflow-x-auto">
                    <table className="w-full min-w-[1420px] border-collapse border-2 border-black font-serif text-black">
                        <thead>
                            <tr>
                                <th className={cn(TH, "w-[120px]")} rowSpan={2}>
                                    Mã khách hàng
                                </th>
                                <th className={cn(TH, "w-[110px]")} rowSpan={2}>
                                    Mã số thuế
                                </th>
                                <th className={cn(TH, "w-[90px]")} rowSpan={2}>
                                    Ngày hạch toán
                                </th>
                                <th className={cn(TH, "w-[110px]")} rowSpan={2}>
                                    Số chứng từ
                                </th>
                                <th className={cn(TH, "min-w-[240px]")} rowSpan={2}>
                                    Sản phẩm
                                </th>
                                <th className={cn(TH, "min-w-[300px]")} rowSpan={2}>
                                    Diễn giải
                                </th>
                                <th className={cn(TH, "w-[60px]")} rowSpan={2}>
                                    ĐVT
                                </th>
                                <th className={cn(TH, "w-[90px]")} rowSpan={2}>
                                    Số lượng
                                </th>
                                <th className={cn(TH, "w-[90px]")} rowSpan={2}>
                                    Đơn giá
                                </th>
                                <th className={TH} colSpan={2}>
                                    Phát sinh
                                </th>
                                <th className={TH} colSpan={2}>
                                    Số dư
                                </th>
                            </tr>
                            <tr>
                                <th className={cn(TH, "w-[120px]")}>Nợ</th>
                                <th className={cn(TH, "w-[120px]")}>Có</th>
                                <th className={cn(TH, "w-[120px]")}>Nợ</th>
                                <th className={cn(TH, "w-[120px]")}>Có</th>
                            </tr>
                        </thead>

                        <tbody>
                            {groups.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={13}
                                        className="border border-black px-3 py-10 text-center text-sm text-slate-600"
                                    >
                                        Không có dữ liệu công nợ phù hợp với bộ lọc.
                                    </td>
                                </tr>
                            )}

                            {groups.map((group) => (
                                <CustomerGroup key={group.key} group={group} />
                            ))}
                        </tbody>

                        {groups.length > 0 && (
                            <tfoot>
                                <tr className="bg-[#bfbfbf] font-bold">
                                    <td className={cn(TD, "text-left")} colSpan={7}>
                                        TỔNG CỘNG TRANG {pagination.pageIndex + 1}
                                    </td>
                                    <td className={TDR}>
                                        {fmtQty(pageTotals.quantity)}
                                    </td>
                                    <td className={TD} />
                                    <td className={TDR}>
                                        {fmtMoney(pageTotals.debit)}
                                    </td>
                                    <td className={TDR}>
                                        {fmtMoney(pageTotals.credit)}
                                    </td>
                                    <td className={TD} colSpan={2} />
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <div className="ar-no-print text-muted-foreground mt-3 text-[11px] italic">
                    * Số dư đầu kỳ / Cộng được tính theo phạm vi dòng đang hiển thị
                    trên trang. Dùng nút &quot;Xuất Excel&quot; để lấy toàn bộ báo cáo
                    theo bộ lọc.
                </div>
            </div>

            {/* ===== Phân trang (không in) ===== */}
            <div className="ar-no-print rounded-lg border bg-card px-4 py-3 shadow-sm">
                <CardPagination
                    pageIndex={pagination.pageIndex}
                    pageCount={pageCount}
                    onPageChange={setPageIndex}
                    className="px-0"
                />
            </div>
        </div>
    )
}

/* ===================================================================
 * Report header
 * =================================================================== */

function ReportHeader({ period }: { period: string }) {
    return (
        <div className="text-center font-serif text-black">
            <div className="text-[12px] font-semibold uppercase tracking-wide">
                Công ty Vlife
            </div>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-wide">
                Chi tiết công nợ phải thu khách hàng
            </h2>
            <div className="mt-3 text-base font-bold italic">
                Tài khoản: {AR_ACCOUNT} &middot; Loại tiền: VND &middot; {period}
            </div>
        </div>
    )
}

/* ===================================================================
 * Customer group block
 * =================================================================== */

function CustomerGroup({ group }: { group: Group }) {
    const opening = balanceCells(group.opening)
    const closing = balanceCells(group.closing)

    return (
        <>
            {/* Hàng tiêu đề khách hàng + tổng phát sinh */}
            <tr className="bg-[#bfbfbf] font-bold">
                <td className={cn(TD, "text-left")} colSpan={7}>
                    Tên khách hàng: {group.name}
                </td>
                <td className={TDR}>{fmtQty(group.qtyTotal)}</td>
                <td className={TD} />
                <td className={TDR}>{fmtMoney(group.debitTotal)}</td>
                <td className={TDR}>{fmtMoney(group.creditTotal)}</td>
                <td className={TD} colSpan={2} />
            </tr>

            {/* Số dư đầu kỳ */}
            <tr className="bg-white italic">
                <td className={cn(TD, "text-left")}>{group.code}</td>
                <td className={cn(TD, "text-left")}>{group.taxCode}</td>
                <td className={TD} />
                <td className={TD} />
                <td className={TD} />
                <td className={cn(TD, "text-left font-medium")}>
                    Số dư đầu kỳ
                </td>
                <td className={TD} />
                <td className={TD} />
                <td className={TD} />
                <td className={TD} />
                <td className={TD} />
                <td className={TDR}>{opening.debit}</td>
                <td className={TDR}>{opening.credit}</td>
            </tr>

            {/* Các dòng chi tiết */}
            {group.items.map((item, idx) => {
                const bal = balanceCells(group.running[idx])
                return (
                    <tr key={item.id} className="bg-white hover:bg-amber-50/60">
                        <td className={cn(TD, "text-left")}>{group.code}</td>
                        <td className={cn(TD, "text-left")}>{group.taxCode}</td>
                        <td className={cn(TD, "whitespace-nowrap text-center")}>
                            {fmtDate(item.posting_date)}
                        </td>
                        <td className={cn(TD, "text-left")}>
                            {item.doc_no || ""}
                        </td>
                        <td className={cn(TD, "text-left")}>
                            <div className="max-w-[320px] break-words font-semibold">
                                {productLabel(item)}
                            </div>
                            {(item.product?.code || item.product_id) && (
                                <div className="mt-0.5 text-[10px] font-sans text-slate-500">
                                    {item.product?.code || `product_id=${item.product_id}`}
                                </div>
                            )}
                        </td>
                        <td className={cn(TD, "text-left")}>
                            <div className="max-w-[420px] break-words">
                                {lineDescription(item)}
                            </div>
                        </td>
                        <td className={cn(TD, "text-center")}>
                            {item.unit || ""}
                        </td>
                        <td className={TDR}>{fmtQty(num(item.quantity))}</td>
                        <td className={TDR}>{fmtQty(num(item.unit_price))}</td>
                        <td className={TDR}>{fmtMoney(num(item.debit_amount))}</td>
                        <td className={TDR}>{fmtMoney(num(item.credit_amount))}</td>
                        <td className={TDR}>{bal.debit}</td>
                        <td className={TDR}>{bal.credit}</td>
                    </tr>
                )
            })}

            {/* Cộng */}
            <tr className="border-y-2 border-black bg-white font-bold">
                <td className={cn(TD, "text-left")}>{group.code}</td>
                <td className={cn(TD, "text-left")}>{group.taxCode}</td>
                <td className={TD} />
                <td className={TD} />
                <td className={TD} />
                <td className={cn(TD, "text-left")}>Cộng</td>
                <td className={TD} />
                <td className={TDR}>{fmtQty(group.qtyTotal)}</td>
                <td className={TD} />
                <td className={TDR}>{fmtMoney(group.debitTotal)}</td>
                <td className={TDR}>{fmtMoney(group.creditTotal)}</td>
                <td className={TDR}>{closing.debit}</td>
                <td className={TDR}>{closing.credit}</td>
            </tr>
        </>
    )
}

/* ===================================================================
 * Styling constants
 * =================================================================== */

const TH =
    "border border-black bg-[#d9d9d9] px-2 py-1.5 text-[13px] font-bold text-black text-center align-middle"

const TD = "border border-black px-2 py-1 text-[13px] align-middle text-black"

const TDR = cn(TD, "text-right tabular-nums whitespace-nowrap")

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #ar-ledger-print, #ar-ledger-print * { visibility: visible !important; }
  #ar-ledger-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  #ar-ledger-print .ar-print-scroll { overflow: visible !important; }
  #ar-ledger-print table { min-width: 0 !important; font-size: 10px; }
  #ar-ledger-print tr { page-break-inside: avoid; }
  .ar-no-print { display: none !important; }
  @page { size: A4 landscape; margin: 8mm; }
}
`

/* ===================================================================
 * Grouping + balance helpers
 * =================================================================== */

type Group = {
    key: string
    code: string
    name: string
    taxCode: string
    items: ArLedger[]
    opening: number
    running: number[]
    closing: number
    qtyTotal: number
    debitTotal: number
    creditTotal: number
}

function num(v: unknown): number {
    const n = Number(v ?? 0)
    return Number.isFinite(n) ? n : 0
}

function net(r: ArLedger): number {
    return num(r.debit_amount) - num(r.credit_amount)
}

function lineDescription(item: ArLedger): string {
    const productName =
        item.product?.quote_name ||
        item.product?.name ||
        undefined

    if (item.product_id && productName) {
        return item.description || ""
    }

    if (item.line_type === "RETURN" && productName) {
        return item.description || `Trả hàng - ${productName}`
    }

    if (item.line_type === "VAT" && productName) {
        return item.description || `Thuế GTGT - ${productName}`
    }

    return productName || item.description || ""
}

function productLabel(item: ArLedger): string {
    return (
        item.product?.quote_name ||
        item.product?.name ||
        (item.product_id ? `#${item.product_id}` : "") ||
        item.description ||
        ""
    )
}

function buildGroups(rows: ArLedger[]): Group[] {
    const groups: Group[] = []
    let bucket: ArLedger[] = []
    let bucketId: string | undefined

    const flush = () => {
        if (bucket.length) groups.push(makeGroup(bucket))
        bucket = []
    }

    for (const row of rows) {
        const id = String(row.customer_id ?? `name:${row.customer_name ?? ""}`)
        if (bucket.length && id !== bucketId) flush()
        bucketId = id
        bucket.push(row)
    }
    flush()

    return groups
}

function makeGroup(items: ArLedger[]): Group {
    const first = items[0]
    const hasRunning = items.every(
        (it) => typeof it.running_balance === "number",
    )

    let opening: number
    let running: number[]

    if (hasRunning) {
        opening = num(first.running_balance) - net(first)
        running = items.map((it) => num(it.running_balance))
    } else {
        // Dự phòng khi backend chưa trả running_balance: cộng dồn từ 0.
        opening = 0
        let bal = 0
        running = items.map((it) => {
            bal += net(it)
            return bal
        })
    }

    const closing = running.length ? running[running.length - 1] : opening

    return {
        key: String(first.customer_id ?? first.customer_name ?? "none"),
        code:
            first.customer?.code ??
            (first.customer_id ? `#${first.customer_id}` : ""),
        name:
            first.customer?.name ??
            first.customer_name ??
            "Chưa gắn khách hàng",
        taxCode: first.customer?.tax_code ?? "",
        items,
        opening,
        running,
        closing,
        qtyTotal: items.reduce((s, it) => s + num(it.quantity), 0),
        debitTotal: items.reduce((s, it) => s + num(it.debit_amount), 0),
        creditTotal: items.reduce((s, it) => s + num(it.credit_amount), 0),
    }
}

function balanceCells(balance: number): { debit: string; credit: string } {
    if (balance < 0) {
        return { debit: "", credit: fmtMoney(Math.abs(balance)) }
    }
    return { debit: fmtMoney(balance) || "0", credit: "" }
}

/* ===================================================================
 * Formatting
 * =================================================================== */

function fmtMoney(value: number): string {
    if (!value) return ""
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })
}

function fmtQty(value: number): string {
    if (!value) return ""
    return value.toLocaleString("vi-VN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function fmtDate(value?: string): string {
    if (!value) return ""
    const s = value.split("T")[0]
    const parts = s.split("-")
    if (parts.length === 3) {
        // yyyy-MM-dd
        if (parts[0].length === 4) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`
        }
        // dd-MM-yyyy
        return `${parts[0]}/${parts[1]}/${parts[2]}`
    }
    return s
}

function periodLabel(from?: string, to?: string): string {
    if (from && to) {
        return `Từ ngày ${fmtDate(from)} đến ngày ${fmtDate(to)}`
    }
    if (from) return `Từ ngày ${fmtDate(from)}`
    if (to) return `Đến ngày ${fmtDate(to)}`
    return "Tổng hợp"
}

/* ===================================================================
 * Export (CSV mở trực tiếp bằng Excel)
 * =================================================================== */

async function fetchAllRows(
    base: ArLedgerListParams,
): Promise<ArLedger[]> {
    const size = 200
    const all: ArLedger[] = []
    let page = 1

    // Giới hạn an toàn 300 trang (~60.000 dòng).
    for (let guard = 0; guard < 300; guard++) {
        const res = await listArLedgers({ ...base, page, size })
        all.push(...res.items)

        const totalPage = res.total_page || 1
        if (page >= totalPage || res.items.length === 0) break
        page += 1
    }

    return all
}

function csvCell(value: string | number): string {
    const s = String(value ?? "")
    if (/[",\n;]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`
    }
    return s
}

function exportReportCsv(groups: Group[], period: string) {
    const lines: string[] = []
    const push = (cells: (string | number)[]) =>
        lines.push(cells.map(csvCell).join(","))

    push(["CHI TIẾT CÔNG NỢ PHẢI THU KHÁCH HÀNG"])
    push([`Tài khoản: ${AR_ACCOUNT} - Loại tiền: VND - ${period}`])
    push([])
    push([
        "Mã khách hàng",
        "Mã số thuế",
        "Ngày hạch toán",
        "Số chứng từ",
        "Sản phẩm",
        "Diễn giải",
        "ĐVT",
        "Số lượng",
        "Đơn giá",
        "Phát sinh Nợ",
        "Phát sinh Có",
        "Số dư Nợ",
        "Số dư Có",
    ])

    for (const g of groups) {
        const opening = balanceNumbers(g.opening)
        const closing = balanceNumbers(g.closing)

        push([
            `Tên khách hàng: ${g.name}`,
            "",
            "",
            "",
            "",
            "",
            "",
            g.qtyTotal || "",
            "",
            g.debitTotal || "",
            g.creditTotal || "",
            "",
            "",
        ])

        push([
            g.code,
            g.taxCode,
            "",
            "",
            "",
            "Số dư đầu kỳ",
            "",
            "",
            "",
            "",
            "",
            opening.debit,
            opening.credit,
        ])

        g.items.forEach((item, idx) => {
            const bal = balanceNumbers(g.running[idx])
            push([
                g.code,
                g.taxCode,
                fmtDate(item.posting_date),
                item.doc_no || "",
                productLabel(item),
                lineDescription(item),
                item.unit || "",
                num(item.quantity) || "",
                num(item.unit_price) || "",
                num(item.debit_amount) || "",
                num(item.credit_amount) || "",
                bal.debit,
                bal.credit,
            ])
        })

        push([
            g.code,
            g.taxCode,
            "",
            "",
            "",
            "Cộng",
            "",
            g.qtyTotal || "",
            "",
            g.debitTotal || "",
            g.creditTotal || "",
            closing.debit,
            closing.credit,
        ])
    }

    const csv = "﻿" + lines.join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const today = new Date().toISOString().slice(0, 10)
    const link = document.createElement("a")
    link.href = url
    link.download = `cong-no-phai-thu_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

function balanceNumbers(balance: number): {
    debit: number | string
    credit: number | string
} {
    if (balance < 0) return { debit: "", credit: Math.abs(balance) }
    return { debit: balance, credit: "" }
}
