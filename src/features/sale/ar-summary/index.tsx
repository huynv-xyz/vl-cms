import { useEffect, useRef, useState } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
    Banknote,
    BarChart3,
    Download,
    FileText,
    Landmark,
    Loader2,
    Scale,
    SlidersHorizontal,
    TrendingUp,
    type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
    getArLedgerSummaryTotals,
    listArLedgerSummary,
    type ArLedgerSummary,
    type ArLedgerSummaryTotals,
} from "@/api/sale/ar-ledger"
import { getCustomer, listCustomers } from "@/api/customer"
import { DatePicker } from "@/components/date-picker"
import { PageSection } from "@/components/page-section"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/ar-summary"

type Filters = {
    from_date?: string
    to_date?: string
    customer_id?: number
    activity?: string[]
}

const controlClass = "h-9 min-h-9 rounded-md border-slate-300 bg-white shadow-xs"
const ACTIVITY_FILTERS = [
    { value: "debit", label: "Có phát sinh nợ" },
    { value: "credit", label: "Có phát sinh có" },
    { value: "none", label: "Không phát sinh" },
] as const

const AR_SUMMARY_COLUMNS = [
    { key: "stt", width: 60, minWidth: 50 },
    { key: "customer_code", width: 170, minWidth: 120 },
    { key: "customer_name", width: 240, minWidth: 160 },
    { key: "employee_code", width: 150, minWidth: 110 },
    { key: "employee_name", width: 220, minWidth: 150 },
    { key: "customer_address", width: 320, minWidth: 180 },
    { key: "opening_debit", width: 120, minWidth: 100 },
    { key: "opening_credit", width: 120, minWidth: 100 },
    { key: "debit", width: 120, minWidth: 100 },
    { key: "credit", width: 120, minWidth: 100 },
    { key: "closing_debit", width: 120, minWidth: 100 },
    { key: "closing_credit", width: 120, minWidth: 100 },
] as const

export default function ArSummaryPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
        singleFilters,
        setSingleFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ["activity"],
        ["from_date", "to_date", "customer_id"],
    )

    const customerId = singleFilters.customer_id
        ? Number(singleFilters.customer_id)
        : undefined
    const summaryFilters = {
        keyword,
        from_date: singleFilters.from_date,
        to_date: singleFilters.to_date,
        customer_id: customerId,
        activity: multiFilters.activity.length > 0
            ? multiFilters.activity.join(",")
            : undefined,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "ar-summary",
            search.page,
            search.size,
            keyword,
            singleFilters,
            multiFilters.activity,
        ],
        listArLedgerSummary,
        {
            page: search.page,
            size: search.size,
            ...summaryFilters,
        },
    )
    const totalsQuery = useQuery({
        queryKey: ["ar-summary-totals", summaryFilters],
        queryFn: () => getArLedgerSummaryTotals(summaryFilters),
    })

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Tổng hợp công nợ"
            data={data}
        >
            {(data) => (
                <ArSummaryTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    totals={totalsQuery.data}
                    filters={{ ...singleFilters, customer_id: customerId, activity: multiFilters.activity }}
                    onFiltersChange={(next) => {
                        setSingleFilters({
                            from_date: next.from_date,
                            to_date: next.to_date,
                            customer_id: next.customer_id
                                ? String(next.customer_id)
                                : undefined,
                        })
                        setMultiFilters({
                            activity: next.activity ?? [],
                        })
                    }}
                />
            )}
        </PageSection>
    )
}

function ArSummaryTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    totals,
    filters,
    onFiltersChange,
}: {
    data: ArLedgerSummary[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    totals?: ArLedgerSummaryTotals
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}) {
    const [exporting, setExporting] = useState(false)
    const [columnWidths, setColumnWidths] = useState<number[]>(() => AR_SUMMARY_COLUMNS.map((column) => column.width))
    const tableWidth = columnWidths.reduce((total, width) => total + width, 0)
    const tableScrollRef = useRef<HTMLDivElement>(null)
    const stickyScrollRef = useRef<HTMLDivElement>(null)
    const headerTableRef = useRef<HTMLTableElement>(null)
    const isSyncingScrollRef = useRef(false)
    const [stickyScroll, setStickyScroll] = useState({
        visible: false,
        contentWidth: 0,
        viewportWidth: 0,
    })
    const [stickyHeaderTop, setStickyHeaderTop] = useState(64)
    const summaryTotals = {
        opening: Number(totals?.opening_balance || 0),
        debit: Number(totals?.debit_amount || 0),
        credit: Number(totals?.credit_amount || 0),
        closing: Number(totals?.closing_balance || 0),
        sales: Number(totals?.sales_amount || 0),
        adjust: Number(totals?.adjust_amount || 0),
        payment: Number(totals?.payment_amount || 0),
    }
    const tableTotals = {
        openingDebit: Number(totals?.opening_debit || 0),
        openingCredit: Number(totals?.opening_credit || 0),
        debit: Number(totals?.debit_amount || 0),
        credit: Number(totals?.credit_amount || 0),
        closingDebit: Number(totals?.closing_debit || 0),
        closingCredit: Number(totals?.closing_credit || 0),
    }

    const setFilter = (key: keyof Filters, value: unknown) =>
        onFiltersChange({ ...filters, [key]: value })
    const toggleActivityFilter = (value: string) => {
        const current = filters.activity ?? []
        if (value === "none") {
            setFilter("activity", current.includes("none") ? [] : ["none"])
            return
        }

        const withoutNone = current.filter((item) => item !== "none")
        const next = withoutNone.includes(value)
            ? withoutNone.filter((item) => item !== value)
            : [...withoutNone, value]
        setFilter("activity", next)
    }
    const startColumnResize = (columnIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()

        const startX = event.clientX
        const startWidth = columnWidths[columnIndex] ?? AR_SUMMARY_COLUMNS[columnIndex].width
        const minWidth = AR_SUMMARY_COLUMNS[columnIndex].minWidth

        const onMouseMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.max(minWidth, startWidth + moveEvent.clientX - startX)
            setColumnWidths((current) => current.map((width, index) => index === columnIndex ? nextWidth : width))
        }
        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }

        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }

    const renderHeaderRows = () => (
        <>
            <tr>
                <ReportTh rowSpan={2} resizeIndex={0} onResizeStart={startColumnResize} className="h-16 text-center">STT</ReportTh>
                <ReportTh rowSpan={2} resizeIndex={1} onResizeStart={startColumnResize} className="h-16 text-center">Mã khách hàng</ReportTh>
                <ReportTh rowSpan={2} resizeIndex={2} onResizeStart={startColumnResize} className="h-16">Tên khách hàng</ReportTh>
                <ReportTh rowSpan={2} resizeIndex={3} onResizeStart={startColumnResize} className="h-16 text-center">Mã nhân viên</ReportTh>
                <ReportTh rowSpan={2} resizeIndex={4} onResizeStart={startColumnResize} className="h-16">Tên nhân viên</ReportTh>
                <ReportTh rowSpan={2} resizeIndex={5} onResizeStart={startColumnResize} className="h-16">Địa chỉ</ReportTh>
                <ReportTh colSpan={2} className="h-8 text-center">Số dư đầu kỳ</ReportTh>
                <ReportTh colSpan={2} className="h-8 text-center">Phát sinh</ReportTh>
                <ReportTh colSpan={2} className="h-8 text-center">Số dư cuối kỳ</ReportTh>
            </tr>
            <tr>
                <ReportTh resizeIndex={6} onResizeStart={startColumnResize} className="h-8 text-center">Nợ</ReportTh>
                <ReportTh resizeIndex={7} onResizeStart={startColumnResize} className="h-8 text-center">Có</ReportTh>
                <ReportTh resizeIndex={8} onResizeStart={startColumnResize} className="h-8 text-center">Nợ</ReportTh>
                <ReportTh resizeIndex={9} onResizeStart={startColumnResize} className="h-8 text-center">Có</ReportTh>
                <ReportTh resizeIndex={10} onResizeStart={startColumnResize} className="h-8 text-center">Nợ</ReportTh>
                <ReportTh resizeIndex={11} onResizeStart={startColumnResize} className="h-8 text-center">Có</ReportTh>
            </tr>
        </>
    )

    useEffect(() => {
        const updateStickyHeaderTop = () => {
            const appHeader = document.querySelector<HTMLElement>(".header-fixed")
            if (!appHeader) {
                setStickyHeaderTop(0)
                return
            }

            const rect = appHeader.getBoundingClientRect()
            const nextTop = Math.max(0, Math.min(rect.bottom, rect.height))
            setStickyHeaderTop((current) => current === nextTop ? current : nextTop)
        }

        updateStickyHeaderTop()
        document.addEventListener("scroll", updateStickyHeaderTop, { passive: true })
        window.addEventListener("resize", updateStickyHeaderTop)

        return () => {
            document.removeEventListener("scroll", updateStickyHeaderTop)
            window.removeEventListener("resize", updateStickyHeaderTop)
        }
    }, [])

    useEffect(() => {
        const updateStickyScroll = () => {
            const tableScroll = tableScrollRef.current
            if (!tableScroll) return

            const next = {
                visible: tableScroll.scrollWidth > tableScroll.clientWidth + 1,
                contentWidth: tableScroll.scrollWidth,
                viewportWidth: tableScroll.clientWidth,
            }
            setStickyScroll((current) => (
                current.visible === next.visible &&
                current.contentWidth === next.contentWidth &&
                current.viewportWidth === next.viewportWidth
                    ? current
                    : next
            ))

            if (stickyScrollRef.current) {
                stickyScrollRef.current.scrollLeft = tableScroll.scrollLeft
            }
            if (headerTableRef.current) {
                headerTableRef.current.style.transform = `translateX(-${tableScroll.scrollLeft}px)`
            }
        }

        updateStickyScroll()

        const tableScroll = tableScrollRef.current
        const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateStickyScroll) : null
        if (tableScroll && resizeObserver) {
            resizeObserver.observe(tableScroll)
            const tableElement = tableScroll.querySelector("table")
            if (tableElement) resizeObserver.observe(tableElement)
        }
        window.addEventListener("resize", updateStickyScroll)

        return () => {
            resizeObserver?.disconnect()
            window.removeEventListener("resize", updateStickyScroll)
        }
    }, [tableWidth, data.length])

    const syncStickyScroll = () => {
        if (isSyncingScrollRef.current) return
        const tableScroll = tableScrollRef.current
        const sticky = stickyScrollRef.current
        if (!tableScroll || !sticky) return

        isSyncingScrollRef.current = true
        sticky.scrollLeft = tableScroll.scrollLeft
        if (headerTableRef.current) {
            headerTableRef.current.style.transform = `translateX(-${tableScroll.scrollLeft}px)`
        }
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false
        })
    }

    const syncTableScroll = () => {
        if (isSyncingScrollRef.current) return
        const tableScroll = tableScrollRef.current
        const sticky = stickyScrollRef.current
        if (!tableScroll || !sticky) return

        isSyncingScrollRef.current = true
        tableScroll.scrollLeft = sticky.scrollLeft
        if (headerTableRef.current) {
            headerTableRef.current.style.transform = `translateX(-${sticky.scrollLeft}px)`
        }
        requestAnimationFrame(() => {
            isSyncingScrollRef.current = false
        })
    }
    const today = todayYmd()
    const exportFilters = {
        keyword,
        from_date: filters.from_date,
        to_date: filters.to_date,
        customer_id: filters.customer_id,
        activity: filters.activity && filters.activity.length > 0
            ? filters.activity.join(",")
            : undefined,
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            const rows = await fetchAllArSummaries(exportFilters)
            await exportSummaryXlsx(rows, buildTotalsFromRows(rows), {
                fromDate: filters.from_date ?? today,
                toDate: filters.to_date ?? today,
            })
        } catch (err) {
            console.error(err)
            toast.error("Xuất Excel tổng hợp công nợ thất bại")
        } finally {
            setExporting(false)
        }
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const returnSearch = {
        return_from: "ar-summary",
        return_page: pagination.pageIndex + 1,
        return_size: pagination.pageSize,
        return_keyword: keyword,
        return_from_date: filters.from_date ?? today,
        return_to_date: filters.to_date ?? today,
        return_customer_id: filters.customer_id,
        return_activity: exportFilters.activity,
    }

    return (
        <div className="space-y-3">
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-slate-500" />
                        Bộ lọc tổng hợp
                    </div>
                    <Button type="button" size="sm" onClick={handleExport} disabled={exporting}>
                        {exporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Xuất Excel
                    </Button>
                </div>
                <div className="space-y-2 p-3">
                    <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-[minmax(260px,1.35fr)_minmax(240px,1.45fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm mã hoặc tên khách hàng..."
                            wrapperClassName="relative h-9 min-w-0"
                            className={cn(controlClass, "pl-10")}
                        />
                        <AsyncSelect
                            className={cn(controlClass, "min-w-0 py-0")}
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
                            mapOption={customerOption}
                        />
                        <DatePicker
                            className={cn(
                                "h-9 min-w-0",
                                "[&_button]:h-9 [&_button]:min-h-9 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
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
                                "h-9 min-w-0",
                                "[&_button]:h-9 [&_button]:min-h-9 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs",
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
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-slate-500">
                            Phát sinh trong kỳ
                        </span>
                        {ACTIVITY_FILTERS.map((item) => {
                            const active = (filters.activity ?? []).includes(item.value)

                            return (
                                <Button
                                    key={item.value}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleActivityFilter(item.value)}
                                    className={cn(
                                        "h-8 rounded-full border-slate-300 bg-white px-3 text-xs font-medium text-slate-700",
                                        active && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                                    )}
                                >
                                    {item.label}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-7">
                <Summary label="Đầu kỳ" value={formatMoney(summaryTotals.opening)} icon={Landmark} tone="opening" />
                <Summary label="Phát sinh nợ" value={formatMoney(summaryTotals.debit)} icon={TrendingUp} tone="debit" />
                <Summary label="Phát sinh có" value={formatMoney(summaryTotals.credit)} icon={TrendingUp} tone="credit" />
                <Summary label="Cuối kỳ" value={formatMoney(summaryTotals.closing)} icon={Scale} tone="closing" strong />
                <Summary label="Doanh thu bán hàng" value={formatMoney(summaryTotals.sales)} icon={FileText} tone="debit" />
                <Summary label="Điều chỉnh công nợ" value={formatMoney(summaryTotals.adjust)} icon={SlidersHorizontal} tone="neutral" />
                <Summary label="Thanh toán" value={formatMoney(summaryTotals.payment)} icon={Banknote} tone="credit" />
            </div>

            <div className="rounded-lg border bg-white shadow-sm">
                <div
                    className="sticky z-40 overflow-hidden rounded-t-lg border-b bg-slate-50 shadow-sm"
                    style={{ top: stickyHeaderTop }}
                >
                    <table
                        ref={headerTableRef}
                        className="table-fixed border-collapse text-sm"
                        style={{ width: tableWidth, minWidth: tableWidth }}
                    >
                        <colgroup>
                            {AR_SUMMARY_COLUMNS.map((column, index) => (
                                <col key={column.key} style={{ width: columnWidths[index] }} />
                            ))}
                        </colgroup>
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            {renderHeaderRows()}
                        </thead>
                    </table>
                </div>
                <div
                    ref={tableScrollRef}
                    onScroll={syncStickyScroll}
                    className="w-full overflow-x-auto"
                >
                    <table className="table-fixed border-collapse text-sm" style={{ width: tableWidth, minWidth: tableWidth }}>
                        <colgroup>
                            {AR_SUMMARY_COLUMNS.map((column, index) => (
                                <col key={column.key} style={{ width: columnWidths[index] }} />
                            ))}
                        </colgroup>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="border border-slate-300 px-4 py-12 text-center text-sm text-slate-500">
                                        Không có dữ liệu công nợ.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => {
                                    const opening = Number(row.opening_balance || 0)
                                    const closing = Number(row.closing_balance || 0)

                                    return (
                                        <tr key={row.customer_id} className="hover:bg-slate-50">
                                            <ReportTd className="text-center tabular-nums text-slate-700">
                                                {pagination.pageIndex * pagination.pageSize + index + 1}
                                            </ReportTd>
                                            <ReportTd className="text-center font-mono text-xs font-semibold text-slate-800">
                                                {row.customer_code || "-"}
                                            </ReportTd>
                                            <ReportTd>
                                                <Link
                                                    to="/sales/ar-ledgers"
                                                    search={{
                                                        page: 1,
                                                        size: pagination.pageSize,
                                                        keyword: "",
                                                        source_type: undefined,
                                                        activity: exportFilters.activity,
                                                        from_date: filters.from_date ?? today,
                                                        to_date: filters.to_date ?? today,
                                                        customer_id: row.customer_id,
                                                        ...returnSearch,
                                                    }}
                                                    className="flex w-full min-w-0 overflow-hidden rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    <span className="block max-w-full truncate font-medium text-slate-950">{row.customer_name || "-"}</span>
                                                </Link>
                                            </ReportTd>
                                            <ReportTd className="text-center font-mono text-xs text-slate-700">
                                                {row.employee_code || "-"}
                                            </ReportTd>
                                            <ReportTd className="text-center text-slate-800">
                                                {row.employee_name || "-"}
                                            </ReportTd>
                                            <ReportTd className="text-slate-700">
                                                {row.customer_address || ""}
                                            </ReportTd>
                                            <ReportMoneyCell value={Math.max(opening, 0)} />
                                            <ReportMoneyCell value={Math.max(-opening, 0)} />
                                            <ReportMoneyCell value={row.debit_amount} />
                                            <ReportMoneyCell value={row.credit_amount} />
                                            <ReportMoneyCell value={Math.max(closing, 0)} />
                                            <ReportMoneyCell value={Math.max(-closing, 0)} />
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                        {data.length > 0 ? (
                            <tfoot className="border-t bg-slate-50 font-bold">
                                <tr>
                                    <ReportTd colSpan={6} className="text-right text-slate-950">
                                        Tổng
                                    </ReportTd>
                                    <ReportMoneyCell value={tableTotals.openingDebit} strong />
                                    <ReportMoneyCell value={tableTotals.openingCredit} strong />
                                    <ReportMoneyCell value={tableTotals.debit} strong />
                                    <ReportMoneyCell value={tableTotals.credit} strong />
                                    <ReportMoneyCell value={tableTotals.closingDebit} strong />
                                    <ReportMoneyCell value={tableTotals.closingCredit} strong />
                                </tr>
                            </tfoot>
                        ) : null}
                    </table>
                </div>
                {stickyScroll.visible ? (
                    <div
                        ref={stickyScrollRef}
                        onScroll={syncTableScroll}
                        className="sticky bottom-0 z-30 w-full overflow-x-auto border-t bg-background/95 py-1 shadow-[0_-6px_18px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
                        style={{ maxWidth: stickyScroll.viewportWidth || undefined }}
                    >
                        <div style={{ width: stickyScroll.contentWidth, height: 1 }} />
                    </div>
                ) : null}
            </div>

            <div className="rounded-lg border bg-white px-3 py-2 shadow-sm">
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

function MoneyCell({
    value,
    tone,
    strong,
}: {
    value?: number
    tone?: "debit" | "credit" | "neutral"
    strong?: boolean
}) {
    return (
        <td
            className={cn(
                "px-3 py-3 text-right tabular-nums",
                strong ? "font-bold text-slate-950" : "font-semibold",
                tone === "debit" && "text-rose-700",
                tone === "credit" && "text-emerald-700",
                tone === "neutral" && "text-amber-700",
                !tone && !strong && "text-slate-800",
            )}
        >
            {formatMoney(value)}
        </td>
    )
}

function ReportTh({
    className,
    children,
    rowSpan,
    colSpan,
    resizeIndex,
    onResizeStart,
}: {
    className?: string
    children: React.ReactNode
    rowSpan?: number
    colSpan?: number
    resizeIndex?: number
    onResizeStart?: (columnIndex: number, event: React.MouseEvent<HTMLDivElement>) => void
}) {
    return (
        <th
            rowSpan={rowSpan}
            colSpan={colSpan}
            className={cn("relative border border-slate-200 px-2 py-1 text-center font-semibold align-middle", className)}
        >
            <span className="block truncate whitespace-nowrap">{children}</span>
            {resizeIndex !== undefined && onResizeStart ? (
                <div
                    className="absolute right-0 top-0 z-40 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/30"
                    onMouseDown={(event) => onResizeStart(resizeIndex, event)}
                />
            ) : null}
        </th>
    )
}

function ReportTd({
    className,
    children,
    colSpan,
}: {
    className?: string
    children?: React.ReactNode
    colSpan?: number
}) {
    return (
        <td
            colSpan={colSpan}
            className={cn("overflow-hidden text-ellipsis whitespace-nowrap border border-slate-200 px-2 py-2 align-middle leading-snug", className)}
        >
            {children}
        </td>
    )
}

function ReportMoneyCell({
    value,
    strong,
}: {
    value?: number
    strong?: boolean
}) {
    return (
        <ReportTd
            className={cn(
                "text-right tabular-nums",
                strong ? "font-bold text-slate-950" : "font-medium text-slate-900",
            )}
        >
            {formatTableMoney(value)}
        </ReportTd>
    )
}

function Summary({
    icon: Icon,
    label,
    value,
    strong,
    tone,
    hint,
}: {
    icon: LucideIcon
    label: string
    value: string
    strong?: boolean
    tone?: "opening" | "debit" | "credit" | "closing" | "neutral"
    hint?: string
}) {
    const toneClass = {
        opening: {
            card: "border-sky-200 bg-sky-50 text-sky-800",
            icon: "bg-white/75 text-sky-700",
            value: "text-sky-950",
        },
        debit: {
            card: "border-rose-200 bg-rose-50 text-rose-800",
            icon: "bg-white/75 text-rose-700",
            value: "text-rose-700",
        },
        credit: {
            card: "border-emerald-200 bg-emerald-50 text-emerald-800",
            icon: "bg-white/75 text-emerald-700",
            value: "text-emerald-700",
        },
        closing: {
            card: "border-blue-200 bg-blue-50 text-blue-800",
            icon: "bg-white/75 text-blue-700",
            value: "text-blue-950",
        },
        neutral: {
            card: "border-amber-200 bg-amber-50 text-amber-800",
            icon: "bg-white/75 text-amber-700",
            value: "text-amber-700",
        },
    }[tone ?? "opening"]

    return (
        <div className={cn("rounded-lg border p-2.5 shadow-sm", toneClass.card)}>
            <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">{label}</div>
                    <div
                        className={cn(
                            "mt-1 text-right text-lg tabular-nums",
                            strong ? "font-bold" : "font-semibold",
                            toneClass.value,
                        )}
                    >
                        {value}
                    </div>
                </div>
            </div>
            {hint ? <div className="mt-0.5 text-xs text-slate-400">{hint}</div> : null}
        </div>
    )
}

function customerOption(customer: { id: number; code?: string; name: string }) {
    return {
        value: customer.id,
        label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
        raw: customer,
    }
}

async function fetchAllArSummaries(filters: {
    keyword?: string
    from_date?: string
    to_date?: string
    customer_id?: number
    activity?: string
}) {
    const size = 200
    let page = 1
    const all: ArLedgerSummary[] = []

    for (let guard = 0; guard < 300; guard++) {
        const res = await listArLedgerSummary({
            ...filters,
            page,
            size,
        })
        all.push(...res.items)
        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}

function buildTotalsFromRows(rows: ArLedgerSummary[]) {
    return rows.reduce(
        (acc, row) => {
            const opening = Number(row.opening_balance || 0)
            const closing = Number(row.closing_balance || 0)

            return {
                openingDebit: acc.openingDebit + Math.max(opening, 0),
                openingCredit: acc.openingCredit + Math.max(-opening, 0),
                debit: acc.debit + Number(row.debit_amount || 0),
                credit: acc.credit + Number(row.credit_amount || 0),
                closingDebit: acc.closingDebit + Math.max(closing, 0),
                closingCredit: acc.closingCredit + Math.max(-closing, 0),
            }
        },
        {
            openingDebit: 0,
            openingCredit: 0,
            debit: 0,
            credit: 0,
            closingDebit: 0,
            closingCredit: 0,
        },
    )
}

async function exportSummaryXlsx(
    rows: ArLedgerSummary[],
    totals: ReturnType<typeof buildTotalsFromRows>,
    period: { fromDate: string; toDate: string },
) {
    const { Workbook } = await import("exceljs")
    const columns: Array<{ label: string; width: number; align?: "left" | "center" | "right" }> = [
        { label: "STT", width: 8, align: "center" },
        { label: "Mã khách hàng", width: 20 },
        { label: "Tên khách hàng", width: 34 },
        { label: "Mã nhân viên", width: 18 },
        { label: "Tên nhân viên", width: 28 },
        { label: "Địa chỉ", width: 46 },
        { label: "Số dư đầu kỳ Nợ", width: 18, align: "right" },
        { label: "Số dư đầu kỳ Có", width: 18, align: "right" },
        { label: "Phát sinh Nợ", width: 18, align: "right" },
        { label: "Phát sinh Có", width: 18, align: "right" },
        { label: "Số dư cuối kỳ Nợ", width: 18, align: "right" },
        { label: "Số dư cuối kỳ Có", width: 18, align: "right" },
    ]

    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()
    const sheet = workbook.addWorksheet("Tổng hợp công nợ", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow(["TỔNG HỢP CÔNG NỢ"])
    sheet.addRow([`Từ ngày ${fmtDate(period.fromDate)} đến ngày ${fmtDate(period.toDate)}`])
    sheet.addRow([])
    sheet.addRow(columns.map((column) => column.label))

    rows.forEach((row, index) => {
        const opening = Number(row.opening_balance || 0)
        const closing = Number(row.closing_balance || 0)
        sheet.addRow([
            index + 1,
            row.customer_code || "",
            row.customer_name || "",
            row.employee_code || "",
            row.employee_name || "",
            row.customer_address || "",
            formatExcelNumber(Math.max(opening, 0)),
            formatExcelNumber(Math.max(-opening, 0)),
            formatExcelNumber(row.debit_amount),
            formatExcelNumber(row.credit_amount),
            formatExcelNumber(Math.max(closing, 0)),
            formatExcelNumber(Math.max(-closing, 0)),
        ])
    })

    sheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "Tổng",
        formatExcelNumber(totals.openingDebit),
        formatExcelNumber(totals.openingCredit),
        formatExcelNumber(totals.debit),
        formatExcelNumber(totals.credit),
        formatExcelNumber(totals.closingDebit),
        formatExcelNumber(totals.closingCredit),
    ])

    sheet.columns = columns.map((column) => ({ width: column.width }))
    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: columns.length },
    }

    styleExcelSheet(sheet, columns)

    const totalRow = sheet.getRow(sheet.rowCount)
    totalRow.eachCell((cell) => {
        cell.font = { bold: true }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
        }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    downloadExcelBuffer(buffer, `tong-hop-cong-no-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function formatExcelNumber(value?: number | string) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : ""
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

function excelBorder() {
    return {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
    }
}

function styleExcelSheet(
    sheet: import("exceljs").Worksheet,
    columns: Array<{ label: string; width: number; align?: "left" | "center" | "right" }>,
) {
    const border = excelBorder()
    const titleCell = sheet.getCell("A1")
    titleCell.font = { bold: true, size: 16 }
    titleCell.alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    const periodCell = sheet.getCell("A2")
    periodCell.font = { italic: true }
    periodCell.alignment = { horizontal: "center", vertical: "middle" }

    const header = sheet.getRow(4)
    header.height = 24
    header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FF000000" } }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell((cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.border = border
            cell.alignment = {
                horizontal: column.align ?? "left",
                vertical: "middle",
                wrapText: true,
            }
        })
    }
}

function downloadExcelBuffer(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

function formatMoney(value?: number | string) {
    const amount = Number(value || 0)
    if (!amount) return "-"
    return formatNumber(amount)
}

function formatTableMoney(value?: number | string) {
    const amount = Number(value || 0)
    if (!amount) return ""
    return formatNumber(amount)
}

function formatNumber(value: number) {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: 6,
    })
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
