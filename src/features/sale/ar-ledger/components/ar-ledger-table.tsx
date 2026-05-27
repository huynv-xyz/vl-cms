import { useMemo, useState } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    ArrowDownLeft,
    ArrowUpRight,
    BookOpenCheck,
    Download,
    Loader2,
    Printer,
    ReceiptText,
    RotateCcw,
    SlidersHorizontal,
    WalletCards,
    X,
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { exportXlsx } from "@/lib/xlsx-export"
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
        const transactionRows = data.filter((row) => !isOpeningRow(row))
        const debit = transactionRows.reduce((sum, row) => sum + num(row.debit_amount), 0)
        const credit = transactionRows.reduce((sum, row) => sum + num(row.credit_amount), 0)
        const balance =
            data.length && typeof data[data.length - 1]?.running_balance === "number"
                ? num(data[data.length - 1].running_balance)
                : debit - credit

        return {
            debit,
            credit,
            balance,
            rows: transactionRows.length,
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

    const sourceTypeValue = filters.source_type?.[0]
    const advancedActiveCount = sourceTypeValue ? 1 : 0
    const activeChips: Array<{ key: string; label: string; onClear: () => void }> = []

    if (filters.from_date) {
        activeChips.push({
            key: "from_date",
            label: `Từ ${fmtDate(filters.from_date)}`,
            onClear: () => setFilter("from_date", undefined),
        })
    }
    if (filters.to_date) {
        activeChips.push({
            key: "to_date",
            label: `Đến ${fmtDate(filters.to_date)}`,
            onClear: () => setFilter("to_date", undefined),
        })
    }
    if (filters.customer_id) {
        activeChips.push({
            key: "customer",
            label: `Khách hàng #${filters.customer_id}`,
            onClear: () => setFilter("customer_id", undefined),
        })
    }
    if (sourceTypeValue) {
        const meta = AR_SOURCE_TYPES.find((t) => t.value === sourceTypeValue)
        activeChips.push({
            key: "source_type",
            label: `Nghiệp vụ: ${meta?.label ?? sourceTypeValue}`,
            onClear: () => setFilter("source_type", undefined),
        })
    }
    if (keyword) {
        activeChips.push({
            key: "keyword",
            label: `Từ khóa: "${keyword}"`,
            onClear: () => onKeywordChange(""),
        })
    }

    const resetAll = () => {
        onKeywordChange("")
        onFiltersChange({
            from_date: undefined,
            to_date: undefined,
            customer_id: undefined,
            source_type: undefined,
        })
    }

    const applyQuickRange = (days: number) => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - days + 1)
        onFiltersChange({
            ...filters,
            from_date: dateToYmd(start),
            to_date: dateToYmd(end),
        })
    }

    return (
        <div className="space-y-4">
            <style>{PRINT_CSS}</style>

            {/* HERO HEADER */}
            <section className="ar-no-print rounded-xl border bg-gradient-to-br from-white via-white to-slate-50 px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-4">
                        <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                            <BookOpenCheck className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                                    Sổ chi tiết công nợ phải thu
                                </h1>
                                <Badge variant="outline" className="rounded-sm bg-white font-mono text-[11px]">
                                    TK {AR_ACCOUNT}
                                </Badge>
                                <Badge variant="outline" className="rounded-sm bg-white font-mono text-[11px]">
                                    VND
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{period}</p>
                        </div>
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
            </section>

            {/* METRICS */}
            <div className="ar-no-print grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={ArrowUpRight}
                    label="Phát sinh nợ"
                    value={fmtCurrency(totals.debit)}
                    sub="VND"
                    tone="rose"
                />
                <MetricCard
                    icon={ArrowDownLeft}
                    label="Phát sinh có"
                    value={fmtCurrency(totals.credit)}
                    sub="VND"
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
                    sub="Theo bộ lọc"
                    tone="slate"
                />
            </div>

            {/* FILTER BAR */}
            <section className="ar-no-print overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-2 p-3">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm chứng từ, khách hàng, diễn giải..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.4_1_0]"
                        className={cn(controlClass, "pl-10")}
                    />

                    <AsyncSelect
                        className={cn(controlClass, "min-w-[240px] flex-[1.4_1_0] py-0")}
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

                    <div className="flex items-center gap-1.5">
                        <DatePicker
                            className={cn(
                                "h-10 w-[150px]",
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
                        <span className="text-xs text-slate-400">—</span>
                        <DatePicker
                            className={cn(
                                "h-10 w-[150px]",
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

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="h-10">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Bộ lọc nâng cao
                                {advancedActiveCount > 0 ? (
                                    <Badge
                                        variant="secondary"
                                        className="ml-2 h-5 min-w-5 justify-center rounded-full px-1.5 font-mono text-[10px]"
                                    >
                                        {advancedActiveCount}
                                    </Badge>
                                ) : null}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[320px] space-y-3 p-4">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Loại nghiệp vụ
                                </div>
                                <Select
                                    value={sourceTypeValue ?? "ALL"}
                                    onValueChange={(value) =>
                                        setFilter("source_type", value === "ALL" ? undefined : [value])
                                    }
                                >
                                    <SelectTrigger className={cn(controlClass, "mt-2 w-full")}>
                                        <SelectValue placeholder="Tất cả nghiệp vụ" />
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
                            </div>

                            <Separator />

                            <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Khoảng nhanh
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => applyQuickRange(1)}
                                    >
                                        Hôm nay
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => applyQuickRange(7)}
                                    >
                                        7 ngày
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => applyQuickRange(30)}
                                    >
                                        30 ngày
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => applyQuickRange(90)}
                                    >
                                        Quý này
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {activeChips.length > 0 ? (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-muted-foreground h-10"
                            onClick={resetAll}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Đặt lại
                        </Button>
                    ) : null}
                </div>

                {activeChips.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 border-t bg-slate-50/60 px-3 py-2">
                        <span className="text-muted-foreground text-xs font-medium">
                            Đang lọc:
                        </span>
                        {activeChips.map((chip) => (
                            <Badge
                                key={chip.key}
                                variant="secondary"
                                className="gap-1 rounded-full bg-white px-2 py-1 font-normal shadow-xs ring-1 ring-slate-200"
                            >
                                {chip.label}
                                <button
                                    type="button"
                                    onClick={chip.onClear}
                                    className="hover:bg-muted -mr-0.5 ml-0.5 rounded-full p-0.5"
                                    aria-label={`Xoá ${chip.label}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </section>

            {/* TABLE */}
            <section
                id="ar-ledger-print"
                className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
                <div className="ar-no-print flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-2.5">
                    <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="rounded-sm bg-slate-50 font-mono">
                            {fmtNumber(totals.rows)} dòng
                        </Badge>
                        <Badge variant="outline" className="rounded-sm bg-slate-50 font-mono">
                            {fmtNumber(totals.customers)} khách hàng
                        </Badge>
                    </div>
                    <Badge variant="outline" className="rounded-sm bg-slate-50 px-2.5 py-1 text-xs">
                        Trang {pagination.pageIndex + 1} / {Math.max(pageCount, 1)}
                    </Badge>
                </div>

                <div className="max-h-[70vh] overflow-auto">
                    <table className="w-full min-w-[1280px] border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_0_var(--color-slate-200)]">
                            <tr className="text-xs uppercase text-slate-500">
                                <Th rowSpan={2} className="w-[210px] align-middle">Khách hàng</Th>
                                <Th rowSpan={2} className="w-[105px] align-middle">Ngày</Th>
                                <Th rowSpan={2} className="w-[140px] align-middle">Chứng từ</Th>
                                <Th rowSpan={2} className="min-w-[300px] align-middle">Diễn giải</Th>
                                <Th rowSpan={2} className="w-[70px] text-center align-middle">ĐVT</Th>
                                <Th rowSpan={2} className="w-[95px] text-right align-middle">SL</Th>
                                <Th rowSpan={2} className="w-[110px] text-right align-middle">Đơn giá</Th>
                                <Th colSpan={2} className="border-l text-center">Phát sinh</Th>
                                <Th colSpan={2} className="border-l text-center">Số dư</Th>
                            </tr>
                            <tr className="text-xs uppercase text-slate-500">
                                <Th className="w-[125px] border-l text-right">Nợ</Th>
                                <Th className="w-[125px] text-right">Có</Th>
                                <Th className="w-[130px] border-l text-right">Nợ</Th>
                                <Th className="w-[130px] text-right">Có</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-14 text-center text-sm text-slate-500">
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

            {/* PAGINATION */}
            <div className="ar-no-print rounded-xl border bg-white px-4 py-3 shadow-sm">
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
    const tones = {
        rose: {
            iconBg: "bg-rose-50 text-rose-600 ring-rose-100",
            accent: "from-rose-50/60",
        },
        emerald: {
            iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
            accent: "from-emerald-50/60",
        },
        amber: {
            iconBg: "bg-amber-50 text-amber-600 ring-amber-100",
            accent: "from-amber-50/60",
        },
        slate: {
            iconBg: "bg-slate-100 text-slate-600 ring-slate-200",
            accent: "from-slate-50/60",
        },
    }

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all",
                "hover:-translate-y-0.5 hover:shadow-md",
            )}
        >
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-60",
                    tones[tone].accent,
                )}
            />
            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {label}
                    </div>
                    <div className="mt-2 text-2xl font-bold tabular-nums leading-tight text-slate-950">
                        {value}
                    </div>
                    {sub ? (
                        <div className="mt-1 text-xs font-medium text-slate-500">{sub}</div>
                    ) : null}
                </div>
                <div
                    className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
                        tones[tone].iconBg,
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    )
}

function CustomerGroup({ group }: { group: Group }) {
    return (
        <>
            <tr className="border-y bg-slate-100/80">
                <td colSpan={11} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-950">{group.name}</span>
                            <Badge variant="outline" className="rounded-sm bg-white font-mono text-[11px]">
                                {group.code}
                            </Badge>
                            {group.taxCode ? (
                                <span className="text-xs text-slate-500">MST: {group.taxCode}</span>
                            ) : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                            <span>{fmtNumber(group.items.length)} phát sinh</span>
                            {(group.opening !== 0 || group.hasOpeningRow) ? (
                                <span className="rounded-sm bg-white px-2 py-1 text-slate-700 ring-1 ring-slate-200">
                                    Dư đầu kỳ:{" "}
                                    <strong className="tabular-nums text-slate-950">
                                        {fmtCurrency(Math.abs(group.opening))}
                                    </strong>{" "}
                                    {group.opening >= 0 ? "Nợ" : "Có"}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </td>
            </tr>

            {group.items.map((item, index) => {
                const balance = group.running[index]
                const unit = item.unit || item.product?.unit || ""

                return (
                    <tr key={item.id} className="border-b transition-colors hover:bg-slate-50">
                        <Td className="font-mono text-xs text-slate-700">{group.code}</Td>
                        <Td className="whitespace-nowrap text-slate-600">{fmtDate(item.posting_date)}</Td>
                        <Td className="font-mono text-xs font-semibold text-sky-700">{item.doc_no || `#${item.id}`}</Td>
                        <Td>
                            <div className="font-medium text-slate-950">{lineDescription(item) || productLabel(item) || ""}</div>
                        </Td>
                        <Td className="text-center text-xs text-slate-600">{unit}</Td>
                        <Td className="text-right tabular-nums">{fmtQtyBlank(num(item.quantity))}</Td>
                        <Td className="text-right tabular-nums">{fmtNumberBlank(num(item.unit_price))}</Td>
                        <Td className="border-l text-right font-medium tabular-nums text-rose-700">
                            {fmtMoneyBlank(num(item.debit_amount))}
                        </Td>
                        <Td className="text-right font-medium tabular-nums text-emerald-700">
                            {fmtMoneyBlank(num(item.credit_amount))}
                        </Td>
                        <Td className="border-l text-right font-semibold tabular-nums text-slate-950">
                            {balance > 0 ? fmtCurrency(balance) : ""}
                        </Td>
                        <Td className="text-right font-semibold tabular-nums text-slate-950">
                            {balance < 0 ? fmtCurrency(Math.abs(balance)) : ""}
                        </Td>
                    </tr>
                )
            })}

            <tr className="border-y-2 border-slate-300 bg-slate-50 font-semibold">
                <Td />
                <Td />
                <Td />
                <Td className="text-slate-950">Cộng</Td>
                <Td />
                <Td className="text-right tabular-nums">{fmtQtyBlank(group.qtyTotal)}</Td>
                <Td />
                <Td className="border-l text-right tabular-nums text-rose-700">
                    {fmtMoneyBlank(group.debitTotal)}
                </Td>
                <Td className="text-right tabular-nums text-emerald-700">
                    {fmtMoneyBlank(group.creditTotal)}
                </Td>
                <Td className="border-l text-right tabular-nums text-slate-950">
                    {group.closing > 0 ? fmtCurrency(group.closing) : ""}
                </Td>
                <Td className="text-right tabular-nums text-slate-950">
                    {group.closing < 0 ? fmtCurrency(Math.abs(group.closing)) : ""}
                </Td>
            </tr>
        </>
    )
}

function Th({
    className,
    children,
    colSpan,
    rowSpan,
}: {
    className?: string
    children: React.ReactNode
    colSpan?: number
    rowSpan?: number
}) {
    return (
        <th
            colSpan={colSpan}
            rowSpan={rowSpan}
            className={cn("px-3 py-3 text-left font-semibold", className)}
        >
            {children}
        </th>
    )
}

function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
    return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>
}

type Group = {
    key: string
    code: string
    taxCode: string
    name: string
    items: ArLedger[]
    running: number[]
    opening: number
    hasOpeningRow: boolean
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

function isOpeningRow(item: ArLedger): boolean {
    return item.source_type === "OPENING" || item.line_type === "OPENING"
}

function makeGroup(key: string, allItems: ArLedger[]): Group {
    const openingRow = allItems.find(isOpeningRow)
    const items = allItems.filter((item) => !isOpeningRow(item))

    let runningValue = openingRow
        ? num(openingRow.running_balance ?? net(openingRow))
        : 0
    const openingBalance = runningValue

    const running = items.map((item) => {
        if (typeof item.running_balance === "number") return num(item.running_balance)
        runningValue += net(item)
        return runningValue
    })

    const first = allItems[0]

    return {
        key,
        code: first.customer?.code ?? (first.customer_id ? `#${first.customer_id}` : ""),
        taxCode: first.customer?.tax_code ?? "",
        name: first.customer?.name ?? first.customer_name ?? "Chưa gắn khách hàng",
        items,
        running,
        opening: openingBalance,
        hasOpeningRow: Boolean(openingRow),
        closing: running.length ? running[running.length - 1] : openingBalance,
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

function fmtMoneyBlank(value: number): string {
    return value ? fmtCurrency(value) : ""
}

function fmtNumber(value: number): string {
    if (!value) return "-"
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })
}

function fmtNumberBlank(value: number): string {
    return value ? fmtNumber(value) : ""
}

function fmtQty(value: number): string {
    if (!value) return "-"
    return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })
}

function fmtQtyBlank(value: number): string {
    return value ? fmtQty(value) : ""
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

    push(["CHI TIẾT CÔNG NỢ PHẢI THU KHÁCH HÀNG"])
    push([`Tài khoản: ${AR_ACCOUNT}, Loại tiền: <<Tổng hợp>>, ${period}`])
    push([])
    push([
        "Mã khách hàng",
        "Mã số thuế",
        "Ngày hạch toán",
        "Số chứng từ",
        "Diễn giải",
        "ĐVT",
        "Số lượng",
        "Đơn giá",
        "Phát sinh Nợ",
        "Phát sinh Có",
        "Số dư Nợ",
        "Số dư Có",
    ])

    for (const group of groups) {
        // Customer header
        push([
            `Tên khách hàng: ${group.name}`,
            "",
            "",
            "",
            "",
            "",
            group.qtyTotal,
            "",
            group.debitTotal,
            group.creditTotal,
            "",
            "",
        ])

        // Opening balance
        if (group.opening !== 0 || group.hasOpeningRow) {
            push([
                group.code,
                group.taxCode,
                "",
                "",
                "Số dư đầu kỳ",
                "",
                "",
                "",
                "",
                "",
                group.opening > 0 ? group.opening : "",
                group.opening < 0 ? Math.abs(group.opening) : "",
            ])
        }

        // Details
        group.items.forEach((item, index) => {
            const balance = group.running[index]
            push([
                group.code,
                group.taxCode,
                fmtDate(item.posting_date),
                item.doc_no || "",
                lineDescription(item),
                item.unit || item.product?.unit || "",
                num(item.quantity),
                num(item.unit_price),
                num(item.debit_amount),
                num(item.credit_amount),
                balance > 0 ? balance : "",
                balance < 0 ? Math.abs(balance) : "",
            ])
        })

        // Subtotal "Cộng"
        push([
            group.code,
            group.taxCode,
            "",
            "",
            "Cộng",
            "",
            group.qtyTotal,
            "",
            group.debitTotal,
            group.creditTotal,
            group.closing > 0 ? group.closing : "",
            group.closing < 0 ? Math.abs(group.closing) : "",
        ])
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
