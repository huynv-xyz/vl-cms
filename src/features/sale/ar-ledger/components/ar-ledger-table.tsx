import { useMemo, useState } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Download,
    Filter,
    Loader2,
    Printer,
    ReceiptText,
    Search,
    WalletCards,
} from "lucide-react"
import { toast } from "sonner"

import { getCustomer, listCustomers } from "@/api/customer"
import { listArLedgers, type ArLedgerListParams } from "@/api/sale/ar-ledger"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { exportXlsx } from "@/lib/xlsx-export"
import type { ArLedger } from "../data/schema"
import { AR_SOURCE_TYPES, getSourceTypeMeta } from "./ar-ledger-columns"
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
const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

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
    const period = periodLabel(filters.from_date, filters.to_date)
    const today = todayYmd()

    const totals = useMemo(() => {
        const debit = data.reduce((sum, row) => sum + num(row.debit_amount), 0)
        const credit = data.reduce((sum, row) => sum + num(row.credit_amount), 0)
        const balance =
            data.length && typeof data[data.length - 1]?.running_balance === "number"
                ? num(data[data.length - 1].running_balance)
                : debit - credit

        return {
            debit,
            credit,
            balance,
            rows: data.length,
            customers: new Set(data.map((row) => row.customer_id ?? row.customer_name)).size,
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

            exportReportXlsx(buildGroups(rows), period)
            toast.success(`Đã xuất ${rows.length} dòng công nợ`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất báo cáo thất bại")
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-4">
            <style>{PRINT_CSS}</style>

            <div className="ar-no-print overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Filter className="h-4 w-4 text-slate-500" />
                        Bộ lọc công nợ
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportArLedgerButton />
                        <Button type="button" variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            In
                        </Button>
                        <Button type="button" onClick={handleExport} disabled={exporting}>
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Xuất Excel
                        </Button>
                    </div>
                </div>

                <div className="space-y-2 p-4">
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm chứng từ, khách hàng, diễn giải..."
                            wrapperClassName="relative h-10 min-w-[300px] flex-[1.3_1_0]"
                            className={cn(controlClass, "pl-10")}
                        />

                        <AsyncSelect
                            className={cn(controlClass, "min-w-[260px] flex-[1.6_1_0] py-0")}
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
                            mapOption={(customer: { id: number; code?: string; name: string }) => ({
                                value: customer.id,
                                label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
                            })}
                        />
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-2">
                        <Select
                            value={filters.source_type?.[0] ?? "ALL"}
                            onValueChange={(value) =>
                                setFilter("source_type", value === "ALL" ? undefined : [value])
                            }
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[200px] flex-1")}>
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
                                "h-10 min-w-[170px] flex-1",
                                "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
                            )}
                            value={filters.from_date}
                            onChange={(value) => setFilter("from_date", value || undefined)}
                            disabled={(date) => {
                                const value = dateToYmd(date)
                                return value > today || (!!filters.to_date && value > filters.to_date)
                            }}
                            placeholder="Từ ngày"
                        />

                        <DatePicker
                            className={cn(
                                "h-10 min-w-[170px] flex-1",
                                "[&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
                            )}
                            value={filters.to_date}
                            onChange={(value) => setFilter("to_date", value || undefined)}
                            disabled={(date) => {
                                const value = dateToYmd(date)
                                return !!filters.from_date && value < filters.from_date
                            }}
                            placeholder="Đến ngày"
                        />
                    </div>
                </div>
            </div>

            <div className="ar-no-print grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={ArrowUpRight}
                    label="Phát sinh nợ"
                    value={fmtCurrency(totals.debit)}
                    tone="rose"
                />
                <MetricCard
                    icon={ArrowDownLeft}
                    label="Phát sinh có"
                    value={fmtCurrency(totals.credit)}
                    tone="emerald"
                />
                <MetricCard
                    icon={WalletCards}
                    label="Số dư"
                    value={fmtCurrency(Math.abs(totals.balance))}
                    sub={totals.balance >= 0 ? "Dư nợ" : "Dư có"}
                    tone={totals.balance >= 0 ? "amber" : "emerald"}
                />
                <MetricCard
                    icon={ReceiptText}
                    label="Dòng / khách"
                    value={`${fmtNumber(totals.rows)} / ${fmtNumber(totals.customers)}`}
                    tone="slate"
                />
            </div>

            <section id="ar-ledger-print" className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="border-b bg-white px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Tài khoản {AR_ACCOUNT} · VND
                            </div>
                            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                                Sổ chi tiết công nợ phải thu
                            </h2>
                            <div className="mt-1 text-sm text-slate-500">{period}</div>
                        </div>
                        <Badge variant="outline" className="rounded-sm px-2.5 py-1 text-xs">
                            Trang {pagination.pageIndex + 1}/{Math.max(pageCount, 1)}
                        </Badge>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                                <Th className="w-[108px]">Ngày</Th>
                                <Th className="w-[150px]">Chứng từ</Th>
                                <Th className="min-w-[260px]">Khách hàng / diễn giải</Th>
                                <Th className="w-[130px]">Nghiệp vụ</Th>
                                <Th className="w-[90px] text-right">SL</Th>
                                <Th className="w-[110px] text-right">Đơn giá</Th>
                                <Th className="w-[130px] text-right">Nợ</Th>
                                <Th className="w-[130px] text-right">Có</Th>
                                <Th className="w-[140px] text-right">Số dư</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-14 text-center text-sm text-slate-500">
                                        Không có dữ liệu công nợ phù hợp với bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                groups.map((group) => <CustomerGroup key={group.key} group={group} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="ar-no-print rounded-lg border bg-white px-4 py-3 shadow-sm">
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

function MetricCard({
    icon: Icon,
    label,
    value,
    sub,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    sub?: string
    tone: "rose" | "emerald" | "amber" | "slate"
}) {
    const colors = {
        rose: "bg-rose-50 text-rose-700 border-rose-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
    }

    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{value}</div>
                    {sub ? <div className="mt-0.5 text-xs text-slate-500">{sub}</div> : null}
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-md border", colors[tone])}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

function CustomerGroup({ group }: { group: Group }) {
    return (
        <>
            <tr className="border-y bg-slate-100/80">
                <td colSpan={4} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-950">{group.name}</span>
                        {group.code ? (
                            <Badge variant="outline" className="rounded-sm font-mono text-[11px]">
                                {group.code}
                            </Badge>
                        ) : null}
                    </div>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmtQty(group.qtyTotal)}</td>
                <td />
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-rose-700">
                    {fmtCurrency(group.debitTotal)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                    {fmtCurrency(group.creditTotal)}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {formatBalance(group.closing)}
                </td>
            </tr>

            {group.items.map((item, index) => {
                const source = getSourceTypeMeta(item.source_type)
                const balance = group.running[index]

                return (
                    <tr key={item.id} className="border-b transition-colors hover:bg-slate-50">
                        <Td className="whitespace-nowrap text-slate-600">{fmtDate(item.posting_date)}</Td>
                        <Td>
                            <div className="font-mono text-xs font-semibold text-sky-700">{item.doc_no || `#${item.id}`}</div>
                            {item.account_code ? <div className="mt-1 text-xs text-slate-400">TK {item.account_code}</div> : null}
                        </Td>
                        <Td>
                            <div className="font-medium text-slate-950">{lineDescription(item) || productLabel(item) || "-"}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                <span>{productLabel(item) || group.name}</span>
                                {item.product?.code ? <span className="font-mono">{item.product.code}</span> : null}
                            </div>
                        </Td>
                        <Td>
                            <Badge variant={source.variant} className="rounded-sm">{source.label}</Badge>
                        </Td>
                        <Td className="text-right tabular-nums">{fmtQty(num(item.quantity))}</Td>
                        <Td className="text-right tabular-nums">{fmtNumber(num(item.unit_price))}</Td>
                        <Td className="text-right font-medium tabular-nums text-rose-700">
                            {fmtCurrency(num(item.debit_amount))}
                        </Td>
                        <Td className="text-right font-medium tabular-nums text-emerald-700">
                            {fmtCurrency(num(item.credit_amount))}
                        </Td>
                        <Td className="text-right font-semibold tabular-nums text-slate-950">{formatBalance(balance)}</Td>
                    </tr>
                )
            })}
        </>
    )
}

function Th({ className, children }: { className?: string; children: React.ReactNode }) {
    return <th className={cn("px-3 py-3 text-left font-semibold", className)}>{children}</th>
}

function Td({ className, children }: { className?: string; children: React.ReactNode }) {
    return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>
}

type Group = {
    key: string
    code: string
    name: string
    items: ArLedger[]
    running: number[]
    closing: number
    qtyTotal: number
    debitTotal: number
    creditTotal: number
}

function buildGroups(rows: ArLedger[]): Group[] {
    const grouped = new Map<string, ArLedger[]>()

    for (const row of rows) {
        const key = String(row.customer_id ?? row.customer_name ?? "none")
        grouped.set(key, [...(grouped.get(key) ?? []), row])
    }

    return [...grouped.entries()].map(([key, items]) => makeGroup(key, items))
}

function makeGroup(key: string, items: ArLedger[]): Group {
    let runningValue = 0
    const running = items.map((item) => {
        if (typeof item.running_balance === "number") return num(item.running_balance)
        runningValue += net(item)
        return runningValue
    })

    const first = items[0]

    return {
        key,
        code: first.customer?.code ?? (first.customer_id ? `#${first.customer_id}` : ""),
        name: first.customer?.name ?? first.customer_name ?? "Chưa gắn khách hàng",
        items,
        running,
        closing: running.length ? running[running.length - 1] : 0,
        qtyTotal: items.reduce((sum, item) => sum + num(item.quantity), 0),
        debitTotal: items.reduce((sum, item) => sum + num(item.debit_amount), 0),
        creditTotal: items.reduce((sum, item) => sum + num(item.credit_amount), 0),
    }
}

function net(row: ArLedger): number {
    return num(row.debit_amount) - num(row.credit_amount)
}

function lineDescription(item: ArLedger): string {
    return item.description || item.product?.quote_name || item.product?.name || ""
}

function productLabel(item: ArLedger): string {
    return item.product?.quote_name || item.product?.name || (item.product_id ? `#${item.product_id}` : "")
}

function num(value: unknown): number {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
}

function fmtCurrency(value: number): string {
    if (!value) return "-"
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })
}

function fmtNumber(value: number): string {
    if (!value) return "-"
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })
}

function fmtQty(value: number): string {
    if (!value) return "-"
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })
}

function formatBalance(value: number): string {
    if (!value) return "-"
    return `${value >= 0 ? "Nợ" : "Có"} ${fmtCurrency(Math.abs(value))}`
}

function fmtDate(value?: string): string {
    if (!value) return "-"
    const date = value.split("T")[0]
    const parts = date.split("-")
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return date
}

function periodLabel(from?: string, to?: string): string {
    if (from && to) return `Từ ${fmtDate(from)} đến ${fmtDate(to)}`
    if (from) return `Từ ${fmtDate(from)}`
    if (to) return `Đến ${fmtDate(to)}`
    return "Tất cả kỳ"
}

async function fetchAllRows(base: ArLedgerListParams): Promise<ArLedger[]> {
    const size = 200
    const all: ArLedger[] = []
    let page = 1

    for (let guard = 0; guard < 300; guard++) {
        const res = await listArLedgers({ ...base, page, size })
        all.push(...res.items)
        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}

function exportReportXlsx(groups: Group[], period: string) {
    const rows: (string | number)[][] = []
    const push = (cells: (string | number)[]) => rows.push(cells)

    push(["SỔ CHI TIẾT CÔNG NỢ PHẢI THU"])
    push([`Tài khoản: ${AR_ACCOUNT} - VND - ${period}`])
    push([])
    push(["Khách hàng", "Ngày", "Chứng từ", "Diễn giải", "Nghiệp vụ", "SL", "Đơn giá", "Nợ", "Có", "Số dư"])

    for (const group of groups) {
        push([group.name, "", "", "Cộng", "", group.qtyTotal, "", group.debitTotal, group.creditTotal, group.closing])
        group.items.forEach((item, index) => {
            push([
                group.name,
                fmtDate(item.posting_date),
                item.doc_no || "",
                lineDescription(item),
                getSourceTypeMeta(item.source_type).label,
                num(item.quantity),
                num(item.unit_price),
                num(item.debit_amount),
                num(item.credit_amount),
                group.running[index],
            ])
        })
    }

    exportXlsx(`cong-no-phai-thu-${new Date().toISOString().slice(0, 10)}.xlsx`, [
        { name: "Chi tiết công nợ", rows },
    ])
}

function todayYmd() {
    return dateToYmd(new Date())
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

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
  }
  .ar-no-print { display: none !important; }
  @page { size: A4 landscape; margin: 10mm; }
}
`
