import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { useQueries, useQuery } from "@tanstack/react-query"
import { Banknote, CalendarDays, Check, ChevronsUpDown, Clock3, Download, Filter, Funnel, Loader2, TrendingUp, Users, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    getArOverdueReportTotals,
    listArOverdueReport,
    type ArOverdueBucket,
    type ArOverdueReportRow,
    type ArOverdueReportTotals,
} from "@/api/sale/ar-overdue"
import { DateFilterInput } from "@/components/date-filter-input"
import { PageSection } from "@/components/page-section"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { cn, formatCurrency } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/sales/ar-overdue"

type Filters = {
    report_date?: string
    customer_id?: string[]
    employee_id?: string[]
    overdue_bucket?: string[]
    total_debt_op?: string
    total_debt_value?: string
    total_overdue_debt_op?: string
    total_overdue_debt_value?: string
    current_debt_op?: string
    current_debt_value?: string
    overdue_1_30_op?: string
    overdue_1_30_value?: string
    overdue_31_60_op?: string
    overdue_31_60_value?: string
    overdue_61_90_op?: string
    overdue_61_90_value?: string
    overdue_91_120_op?: string
    overdue_91_120_value?: string
    overdue_over_120_op?: string
    overdue_over_120_value?: string
    unknown_debt_op?: string
    unknown_debt_value?: string
}

const controlClass = "h-10 rounded-md border-slate-300 bg-white shadow-xs"

type NumberFilterOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte"
type NumberFilterField =
    | "total_debt"
    | "total_overdue_debt"
    | "current_debt"
    | "overdue_1_30"
    | "overdue_31_60"
    | "overdue_61_90"
    | "overdue_91_120"
    | "overdue_over_120"
    | "unknown_debt"

const NUMBER_FILTER_OPERATORS: Array<{ value: NumberFilterOp; label: string; chipLabel: string }> = [
    { value: "eq", label: "Bằng", chipLabel: "=" },
    { value: "ne", label: "Khác", chipLabel: "!=" },
    { value: "lt", label: "Nhỏ hơn", chipLabel: "<" },
    { value: "lte", label: "Nhỏ hơn hoặc bằng", chipLabel: "<=" },
    { value: "gt", label: "Lớn hơn", chipLabel: ">" },
    { value: "gte", label: "Lớn hơn hoặc bằng", chipLabel: ">=" },
]

const NUMBER_FIELD_LABELS: Array<{ field: NumberFilterField; label: string }> = [
    { field: "total_debt", label: "Tổng nợ" },
    { field: "total_overdue_debt", label: "Tổng nợ trễ hạn" },
    { field: "current_debt", label: "Trong hạn" },
    { field: "overdue_1_30", label: "Trễ 1-30" },
    { field: "overdue_31_60", label: "Trễ 31-60" },
    { field: "overdue_61_90", label: "Trễ 61-90" },
    { field: "overdue_91_120", label: "Trễ 91-120" },
    { field: "overdue_over_120", label: "Trễ trên 120" },
    { field: "unknown_debt", label: "Không xác định đơn" },
]

const BUCKET_OPTIONS: Array<{ value: ArOverdueBucket; label: string }> = [
    { value: "CURRENT", label: "Trong hạn" },
    { value: "OVERDUE", label: "Trễ hạn" },
    { value: "DAYS_1_30", label: "Trễ 1-30 ngày" },
    { value: "DAYS_31_60", label: "Trễ 31-60 ngày" },
    { value: "DAYS_61_90", label: "Trễ 61-90 ngày" },
    { value: "DAYS_91_120", label: "Trễ 91-120 ngày" },
    { value: "DAYS_OVER_120", label: "Trễ trên 120 ngày" },
    { value: "UNKNOWN", label: "Không xác định đơn" },
]

const COLUMNS = [
    { key: "stt", width: 60, minWidth: 50 },
    { key: "customer", width: 330, minWidth: 220 },
    { key: "employee", width: 230, minWidth: 150 },
    { key: "total_debt", width: 150, minWidth: 120 },
    { key: "total_overdue_debt", width: 170, minWidth: 130 },
    { key: "current_debt", width: 140, minWidth: 110 },
    { key: "overdue_1_30", width: 140, minWidth: 110 },
    { key: "overdue_31_60", width: 140, minWidth: 110 },
    { key: "overdue_61_90", width: 140, minWidth: 110 },
    { key: "overdue_91_120", width: 150, minWidth: 120 },
    { key: "overdue_over_120", width: 160, minWidth: 120 },
    { key: "unknown_debt", width: 170, minWidth: 130 },
] as const

const EXPORT_PAGE_SIZE = 200

type ExcelColumn = {
    label: string
    width: number
    type?: "number" | "text"
    align?: "left" | "center" | "right"
    numFmt?: string
    value: (row: ArOverdueReportRow, index: number) => string | number | null | undefined
}

const EXCEL_COLUMNS: ExcelColumn[] = [
    { label: "STT", width: 8, type: "number", align: "center", numFmt: "0", value: (_row, index) => index + 1 },
    { label: "Mã khách hàng", width: 20, value: (row) => row.customer_code },
    { label: "Tên khách hàng", width: 36, value: (row) => row.customer_name },
    { label: "Mã nhân viên sale", width: 20, value: (row) => row.employee_code },
    { label: "Nhân viên sale", width: 28, value: (row) => row.employee_name },
    { label: "Tổng nợ", width: 18, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.total_debt },
    { label: "Tổng nợ trễ hạn", width: 20, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.total_overdue_debt },
    { label: "Trong hạn", width: 18, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.current_debt },
    { label: "Trễ 1-30 ngày", width: 18, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.overdue_1_30 },
    { label: "Trễ 31-60 ngày", width: 18, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.overdue_31_60 },
    { label: "Trễ 61-90 ngày", width: 18, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.overdue_61_90 },
    { label: "Trễ 91-120 ngày", width: 18, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.overdue_91_120 },
    { label: "Trễ trên 120 ngày", width: 20, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.overdue_over_120 },
    { label: "Không xác định đơn", width: 22, type: "number", align: "right", numFmt: "#,##0", value: (row) => row.unknown_debt },
]

export default function ArOverduePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const [exporting, setExporting] = useState(false)
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { multiFilters, setMultiFilters, singleFilters, setSingleFilters } = useUrlListFilters(
        search,
        navigate,
        ["customer_id", "employee_id", "overdue_bucket"],
        [
            "report_date",
            "total_debt_op",
            "total_debt_value",
            "total_overdue_debt_op",
            "total_overdue_debt_value",
            "current_debt_op",
            "current_debt_value",
            "overdue_1_30_op",
            "overdue_1_30_value",
            "overdue_31_60_op",
            "overdue_31_60_value",
            "overdue_61_90_op",
            "overdue_61_90_value",
            "overdue_91_120_op",
            "overdue_91_120_value",
            "overdue_over_120_op",
            "overdue_over_120_value",
            "unknown_debt_op",
            "unknown_debt_value",
        ],
    )

    const requestFilters = {
        report_date: singleFilters.report_date,
        customer_id: encodeMulti(multiFilters.customer_id),
        employee_id: encodeMulti(multiFilters.employee_id),
        overdue_bucket: multiFilters.overdue_bucket.length > 0 ? multiFilters.overdue_bucket.join(",") : undefined,
        total_debt_op: singleFilters.total_debt_op,
        total_debt_value: singleFilters.total_debt_value,
        total_overdue_debt_op: singleFilters.total_overdue_debt_op,
        total_overdue_debt_value: singleFilters.total_overdue_debt_value,
        current_debt_op: singleFilters.current_debt_op,
        current_debt_value: singleFilters.current_debt_value,
        overdue_1_30_op: singleFilters.overdue_1_30_op,
        overdue_1_30_value: singleFilters.overdue_1_30_value,
        overdue_31_60_op: singleFilters.overdue_31_60_op,
        overdue_31_60_value: singleFilters.overdue_31_60_value,
        overdue_61_90_op: singleFilters.overdue_61_90_op,
        overdue_61_90_value: singleFilters.overdue_61_90_value,
        overdue_91_120_op: singleFilters.overdue_91_120_op,
        overdue_91_120_value: singleFilters.overdue_91_120_value,
        overdue_over_120_op: singleFilters.overdue_over_120_op,
        overdue_over_120_value: singleFilters.overdue_over_120_value,
        unknown_debt_op: singleFilters.unknown_debt_op,
        unknown_debt_value: singleFilters.unknown_debt_value,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "ar-overdue",
            search.page,
            search.size,
            requestFilters.report_date,
            requestFilters.customer_id,
            requestFilters.employee_id,
            requestFilters.overdue_bucket,
            requestFilters.total_debt_op,
            requestFilters.total_debt_value,
            requestFilters.total_overdue_debt_op,
            requestFilters.total_overdue_debt_value,
            requestFilters.current_debt_op,
            requestFilters.current_debt_value,
            requestFilters.overdue_1_30_op,
            requestFilters.overdue_1_30_value,
            requestFilters.overdue_31_60_op,
            requestFilters.overdue_31_60_value,
            requestFilters.overdue_61_90_op,
            requestFilters.overdue_61_90_value,
            requestFilters.overdue_91_120_op,
            requestFilters.overdue_91_120_value,
            requestFilters.overdue_over_120_op,
            requestFilters.overdue_over_120_value,
            requestFilters.unknown_debt_op,
            requestFilters.unknown_debt_value,
        ],
        listArOverdueReport,
        {
            page: search.page,
            size: search.size,
            ...requestFilters,
        },
    )
    const totalsQuery = useQuery({
        queryKey: ["ar-overdue-totals", requestFilters],
        queryFn: () => getArOverdueReportTotals(requestFilters),
    })

    const handleExport = async () => {
        try {
            setExporting(true)
            const rows = await fetchAllArOverdueRows(requestFilters)
            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất Excel")
                return
            }
            await exportArOverdueXlsx(rows, buildTotalsFromRows(rows), requestFilters.report_date)
            toast.success(`Đã xuất ${rows.length} khách hàng`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel công nợ trễ hạn thất bại")
        } finally {
            setExporting(false)
        }
    }

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Công nợ trễ hạn"
            data={data}
            actions={
                <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
                    {exporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Xuất Excel
                </Button>
            }
        >
            {(paged) => (
                <ArOverdueTable
                    data={paged.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={paged.total_page}
                    totals={totalsQuery.data}
                    totalsLoading={totalsQuery.isLoading}
                    filters={{
                        ...singleFilters,
                        customer_id: multiFilters.customer_id,
                        employee_id: multiFilters.employee_id,
                        overdue_bucket: multiFilters.overdue_bucket,
                    }}
                    onFiltersChange={(next) => {
                        setSingleFilters({
                            report_date: next.report_date,
                            total_debt_op: next.total_debt_op,
                            total_debt_value: next.total_debt_value,
                            total_overdue_debt_op: next.total_overdue_debt_op,
                            total_overdue_debt_value: next.total_overdue_debt_value,
                            current_debt_op: next.current_debt_op,
                            current_debt_value: next.current_debt_value,
                            overdue_1_30_op: next.overdue_1_30_op,
                            overdue_1_30_value: next.overdue_1_30_value,
                            overdue_31_60_op: next.overdue_31_60_op,
                            overdue_31_60_value: next.overdue_31_60_value,
                            overdue_61_90_op: next.overdue_61_90_op,
                            overdue_61_90_value: next.overdue_61_90_value,
                            overdue_91_120_op: next.overdue_91_120_op,
                            overdue_91_120_value: next.overdue_91_120_value,
                            overdue_over_120_op: next.overdue_over_120_op,
                            overdue_over_120_value: next.overdue_over_120_value,
                            unknown_debt_op: next.unknown_debt_op,
                            unknown_debt_value: next.unknown_debt_value,
                        })
                        setMultiFilters({
                            customer_id: next.customer_id ?? [],
                            employee_id: next.employee_id ?? [],
                            overdue_bucket: next.overdue_bucket ?? [],
                        })
                    }}
                />
            )}
        </PageSection>
    )
}

function ArOverdueTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    totals,
    totalsLoading,
    filters,
    onFiltersChange,
}: {
    data: ArOverdueReportRow[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    totals?: ArOverdueReportTotals
    totalsLoading: boolean
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}) {
    const [columnWidths, setColumnWidths] = useState<number[]>(() => COLUMNS.map((column) => column.width))
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
    const setPageIndex = (pageIndex: number) => {
        onPaginationChange({ ...pagination, pageIndex })
    }
    const setFilter = (key: keyof Filters, value: unknown) => onFiltersChange({ ...filters, [key]: value })

    const summary = useMemo(() => ({
        customers: Number(totals?.customer_count || 0),
        debt: Number(totals?.total_debt || 0),
        overdue: Number(totals?.total_overdue_debt || 0),
        current: Number(totals?.current_debt || 0),
    }), [totals])
    const selectedCustomerIds = filters.customer_id ?? []
    const selectedEmployeeIds = filters.employee_id ?? []
    const selectedCustomerQueries = useQueries({
        queries: selectedCustomerIds.map((id) => ({
            queryKey: ["ar-overdue-filter-customer", id],
            queryFn: () => getCustomer(id),
            enabled: Boolean(id),
        })),
    })
    const selectedEmployeeQueries = useQueries({
        queries: selectedEmployeeIds.map((id) => ({
            queryKey: ["ar-overdue-filter-employee", id],
            queryFn: () => getEmployee(id),
            enabled: Boolean(id),
        })),
    })

    const setNumberFilter = (field: NumberFilterField, value: string, op: NumberFilterOp) => {
        onFiltersChange({
            ...filters,
            [`${field}_op`]: op,
            [`${field}_value`]: value,
        })
    }
    const clearNumberFilter = (field: NumberFilterField) => {
        onFiltersChange({
            ...filters,
            [`${field}_op`]: undefined,
            [`${field}_value`]: undefined,
        })
    }

    const startColumnResize = (columnIndex: number, event: ReactMouseEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.stopPropagation()
        const startX = event.clientX
        const startWidth = columnWidths[columnIndex] ?? COLUMNS[columnIndex].width
        const minWidth = COLUMNS[columnIndex].minWidth

        const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
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

    const renderHeader = () => (
        <tr>
            <ReportTh resizeIndex={0} onResizeStart={startColumnResize}>STT</ReportTh>
            <ReportTh resizeIndex={1} onResizeStart={startColumnResize}>
                <CustomerColumnFilter value={filters.customer_id ?? []} onChange={(value) => setFilter("customer_id", value)} />
            </ReportTh>
            <ReportTh resizeIndex={2} onResizeStart={startColumnResize}>
                <EmployeeColumnFilter value={filters.employee_id ?? []} onChange={(value) => setFilter("employee_id", value)} />
            </ReportTh>
            <ReportTh resizeIndex={3} onResizeStart={startColumnResize}><ColumnNumberFilter label="Tổng nợ" field="total_debt" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={4} onResizeStart={startColumnResize}><ColumnNumberFilter label="Tổng nợ trễ hạn" field="total_overdue_debt" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={5} onResizeStart={startColumnResize}><ColumnNumberFilter label="Trong hạn" field="current_debt" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={6} onResizeStart={startColumnResize}><ColumnNumberFilter label="Trễ 1-30" field="overdue_1_30" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={7} onResizeStart={startColumnResize}><ColumnNumberFilter label="Trễ 31-60" field="overdue_31_60" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={8} onResizeStart={startColumnResize}><ColumnNumberFilter label="Trễ 61-90" field="overdue_61_90" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={9} onResizeStart={startColumnResize}><ColumnNumberFilter label="Trễ 91-120" field="overdue_91_120" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={10} onResizeStart={startColumnResize}><ColumnNumberFilter label="Trễ trên 120" field="overdue_over_120" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
            <ReportTh resizeIndex={11} onResizeStart={startColumnResize}><ColumnNumberFilter label="Không xác định đơn" field="unknown_debt" filters={filters} onApply={setNumberFilter} onClear={clearNumberFilter} /></ReportTh>
        </tr>
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

    return (
        <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users} label="Khách còn nợ" value={summary.customers.toLocaleString("en-US")} loading={totalsLoading} tone="opening" />
                <MetricCard icon={Banknote} label="Tổng nợ" value={formatCurrency(summary.debt)} loading={totalsLoading} tone="closing" />
                <MetricCard icon={TrendingUp} label="Tổng nợ trễ hạn" value={formatCurrency(summary.overdue)} loading={totalsLoading} tone="danger" />
                <MetricCard icon={Clock3} label="Trong hạn" value={formatCurrency(summary.current)} loading={totalsLoading} tone="credit" />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2">
                <CustomerToolbarFilter value={filters.customer_id ?? []} onChange={(value) => setFilter("customer_id", value)} />
                <EmployeeToolbarFilter value={filters.employee_id ?? []} onChange={(value) => setFilter("employee_id", value)} />
                <BucketFilter
                    value={filters.overdue_bucket ?? []}
                    onChange={(value) => setFilter("overdue_bucket", value)}
                />
                <div className="relative min-w-[180px] flex-1">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <DateFilterInput
                        aria-label="Ngày báo cáo"
                        value={filters.report_date}
                        onChange={(value) => setFilter("report_date", value)}
                        className={cn(controlClass, "w-full pl-9")}
                    />
                </div>
            </div>

            <ActiveFilterChips
                filters={filters}
                customerQueries={selectedCustomerQueries}
                employeeQueries={selectedEmployeeQueries}
                onChange={onFiltersChange}
            />

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
                            {columnWidths.map((width, index) => <col key={COLUMNS[index].key} style={{ width }} />)}
                        </colgroup>
                        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                            {renderHeader()}
                        </thead>
                    </table>
                </div>

                <div ref={tableScrollRef} onScroll={syncStickyScroll} className="w-full overflow-x-auto">
                    <table className="table-fixed border-collapse text-sm" style={{ width: tableWidth, minWidth: tableWidth }}>
                        <colgroup>
                            {columnWidths.map((width, index) => <col key={COLUMNS[index].key} style={{ width }} />)}
                        </colgroup>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={COLUMNS.length} className="border border-slate-200 px-3 py-8 text-center text-muted-foreground">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : data.map((row, index) => (
                                <tr key={row.customer_id} className="odd:bg-white even:bg-slate-50/40 hover:bg-cyan-50/60">
                                    <ReportTd className="text-center">{pagination.pageIndex * pagination.pageSize + index + 1}</ReportTd>
                                    <ReportTd>
                                        <div className="truncate font-medium">{row.customer_name || "-"}</div>
                                        <div className="truncate font-mono text-xs text-muted-foreground">{row.customer_code || ""}</div>
                                    </ReportTd>
                                    <ReportTd>
                                        <div className="truncate font-medium">{row.employee_name || "-"}</div>
                                        <div className="truncate font-mono text-xs text-muted-foreground">{row.employee_code || ""}</div>
                                    </ReportTd>
                                    <MoneyCell value={row.total_debt} strong />
                                    <MoneyCell value={row.total_overdue_debt} tone="danger" strong />
                                    <MoneyCell value={row.current_debt} tone="success" />
                                    <MoneyCell value={row.overdue_1_30} />
                                    <MoneyCell value={row.overdue_31_60} />
                                    <MoneyCell value={row.overdue_61_90} />
                                    <MoneyCell value={row.overdue_91_120} />
                                    <MoneyCell value={row.overdue_over_120} />
                                    <MoneyCell value={row.unknown_debt} tone="warning" />
                                </tr>
                            ))}
                        </tbody>
                        {data.length > 0 ? (
                            <tfoot className="sticky bottom-0 bg-slate-100 font-bold">
                                <tr>
                                    <ReportTd colSpan={3} className="text-right uppercase text-slate-600">Tổng cộng</ReportTd>
                                    <MoneyCell value={totals?.total_debt} strong />
                                    <MoneyCell value={totals?.total_overdue_debt} tone="danger" strong />
                                    <MoneyCell value={totals?.current_debt} tone="success" strong />
                                    <MoneyCell value={totals?.overdue_1_30} strong />
                                    <MoneyCell value={totals?.overdue_31_60} strong />
                                    <MoneyCell value={totals?.overdue_61_90} strong />
                                    <MoneyCell value={totals?.overdue_91_120} strong />
                                    <MoneyCell value={totals?.overdue_over_120} strong />
                                    <MoneyCell value={totals?.unknown_debt} tone="warning" strong />
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
                <div className="border-t px-3 py-2">
                    <CardPagination pageIndex={pagination.pageIndex} pageCount={pageCount} onPageChange={setPageIndex} className="px-0" />
                </div>
            </div>
        </div>
    )
}

function CustomerColumnFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    return (
        <EntityColumnFilter
            title="Khách hàng"
            searchPlaceholder="Tìm khách hàng..."
            value={value}
            onChange={onChange}
            getList={(keyword) => listCustomers({ page: 1, size: 50, keyword })}
            getById={getCustomer}
            mapOption={(x: any) => ({ value: String(x.id), label: x.name || "", description: x.code || "" })}
            popoverClassName="w-[540px]"
        />
    )
}

function CustomerToolbarFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    return (
        <EntityColumnFilter
            title="Khách hàng"
            searchPlaceholder="Tìm khách hàng..."
            value={value}
            onChange={onChange}
            getList={(keyword) => listCustomers({ page: 1, size: 50, keyword })}
            getById={getCustomer}
            mapOption={(x: any) => ({ value: String(x.id), label: x.name || "", description: x.code || "" })}
            popoverClassName="w-[540px]"
            variant="toolbar"
            className="min-w-[300px] flex-[1.5_1_0]"
        />
    )
}

function EmployeeColumnFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    return (
        <EntityColumnFilter
            title="Nhân viên sale"
            searchPlaceholder="Tìm nhân viên..."
            value={value}
            onChange={onChange}
            getList={(keyword) => listEmployees({ page: 1, size: 50, keyword })}
            getById={getEmployee}
            mapOption={(x: any) => ({ value: String(x.id), label: x.name || "", description: x.code || "" })}
        />
    )
}

function EmployeeToolbarFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    return (
        <EntityColumnFilter
            title="Nhân viên sale"
            searchPlaceholder="Tìm nhân viên..."
            value={value}
            onChange={onChange}
            getList={(keyword) => listEmployees({ page: 1, size: 50, keyword })}
            getById={getEmployee}
            mapOption={(x: any) => ({ value: String(x.id), label: x.name || "", description: x.code || "" })}
            variant="toolbar"
            className="min-w-[240px] flex-1"
        />
    )
}

type FilterOption = {
    value: string
    label: string
    description?: string
}

function EntityColumnFilter({
    title,
    searchPlaceholder,
    value,
    onChange,
    getList,
    getById,
    mapOption,
    popoverClassName = "w-[360px]",
    variant = "header",
    className,
}: {
    title: string
    searchPlaceholder: string
    value: string[]
    onChange: (value: string[]) => void
    getList: (keyword: string) => Promise<any>
    getById: (id: string) => Promise<any>
    mapOption: (item: any) => FilterOption
    popoverClassName?: string
    variant?: "header" | "toolbar"
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState("")
    const [loading, setLoading] = useState(false)
    const [options, setOptions] = useState<FilterOption[]>([])
    const [selectedOptions, setSelectedOptions] = useState<FilterOption[]>([])
    const [draft, setDraft] = useState<string[]>(value)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const selected = value ?? []
    const selectedSet = useMemo(() => new Set(selected), [selected])
    const draftSet = useMemo(() => new Set(draft), [draft])

    useEffect(() => {
        if (!open) return
        setDraft(selected)
        setKeyword("")
    }, [open, selected])

    useEffect(() => {
        let active = true

        const run = async () => {
            const missing = selected.filter((id) => !selectedOptions.some((option) => option.value === id))
            if (!missing.length) return
            const fetched = await Promise.all(missing.map(async (id) => {
                const res = await getById(id)
                return mapOption(res?.data ?? res)
            }))
            if (active) {
                setSelectedOptions((current) => uniqueOptions([...current, ...fetched.filter(Boolean)]))
            }
        }

        run()
        return () => {
            active = false
        }
    }, [selected, selectedOptions])

    useEffect(() => {
        if (!open) return
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await getList(keyword)
                const nextOptions = getItems(res).map(mapOption).filter(Boolean)
                setOptions(uniqueOptions(nextOptions))
            } finally {
                setLoading(false)
            }
        }, 250)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [open, keyword])

    const allOptions = useMemo(() => {
        const selectedFallback = selected.map((id) => ({ value: id, label: `#${id}` }))
        return uniqueOptions([...selectedFallback, ...selectedOptions, ...options])
    }, [options, selected, selectedOptions])
    const selectedResolved = allOptions.filter((option) => selectedSet.has(option.value))
    const selectedInDraft = allOptions.filter((option) => draftSet.has(option.value))
    const unselectedOptions = allOptions.filter((option) => !draftSet.has(option.value))
    const selectedText = selectedResolved.length > 0
        ? selectedResolved.length > 2
            ? `Đã chọn ${selectedResolved.length}`
            : selectedResolved.map((option) => option.description ? `${option.description} - ${option.label}` : option.label).join(", ")
        : title

    const toggle = (option: FilterOption) => {
        const next = new Set(draftSet)
        if (next.has(option.value)) {
            next.delete(option.value)
        } else {
            next.add(option.value)
        }
        setDraft(Array.from(next))
        setSelectedOptions((current) => uniqueOptions([...current, option]))
    }

    const apply = () => {
        onChange(draft)
        setOpen(false)
    }

    const clear = () => {
        setDraft([])
    }

    return (
        <div className={cn(
            variant === "toolbar" ? "min-w-0" : "flex min-w-0 items-center justify-center gap-1",
            className,
        )}>
            {variant === "header" ? <span className="truncate">{title}</span> : null}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant={variant === "toolbar" ? "outline" : "ghost"}
                        className={cn(
                            variant === "toolbar"
                                ? cn(controlClass, "w-full justify-between gap-2 px-3 text-left")
                                : "h-6 shrink-0 gap-1 rounded-sm px-1.5 text-slate-500 hover:bg-slate-100",
                            selected.length > 0 && "bg-teal-50 text-teal-700 hover:bg-teal-100",
                        )}
                    >
                        {variant === "toolbar" ? (
                            <>
                                <span className="flex min-w-0 items-center gap-2">
                                    <Funnel className="size-4 shrink-0 text-slate-500" />
                                    <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>{selectedText}</span>
                                </span>
                                <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
                            </>
                        ) : (
                            <>
                                <Funnel className="h-3.5 w-3.5" />
                                {selected.length > 0 ? (
                                    <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                        {selected.length}
                                    </span>
                                ) : null}
                            </>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className={cn(popoverClassName, "p-0")}>
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            value={keyword}
                            onValueChange={setKeyword}
                        />
                        <CommandList className="max-h-[420px] overflow-y-auto">
                            <CommandEmpty>{loading ? "Đang tải..." : "Không có dữ liệu"}</CommandEmpty>

                            {selectedInDraft.length > 0 ? (
                                <>
                                    <CommandGroup heading="Đã chọn">
                                        {selectedInDraft.map((option) => (
                                            <CommandItem
                                                key={`selected-${option.value}`}
                                                value={`selected-${option.value}`}
                                                onMouseDown={(event) => event.preventDefault()}
                                                onSelect={() => toggle(option)}
                                            >
                                                <Check className="mr-2 h-4 w-4 opacity-100" />
                                                <span className="flex min-w-0 flex-col gap-0.5">
                                                    <span className="truncate">{option.label}</span>
                                                    {option.description ? <span className="truncate text-xs text-muted-foreground">{option.description}</span> : null}
                                                </span>
                                                <X className="ml-auto h-4 w-4 opacity-60" />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                </>
                            ) : null}

                            <CommandGroup heading="Kết quả">
                                {unselectedOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={`option-${option.value}`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onSelect={() => toggle(option)}
                                    >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        <span className="flex min-w-0 flex-col gap-0.5">
                                            <span className="truncate">{option.label}</span>
                                            {option.description ? <span className="truncate text-xs text-muted-foreground">{option.description}</span> : null}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                    <div className="flex items-center justify-between gap-2 border-t p-2">
                        <Button type="button" variant="ghost" size="sm" disabled={!draft.length} onClick={clear}>
                            Xóa
                        </Button>
                        <Button type="button" size="sm" onClick={apply}>
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function ColumnNumberFilter({
    label,
    field,
    filters,
    onApply,
    onClear,
}: {
    label: string
    field: NumberFilterField
    filters: Filters
    onApply: (field: NumberFilterField, value: string, op: NumberFilterOp) => void
    onClear: (field: NumberFilterField) => void
}) {
    const value = filters[`${field}_value` as keyof Filters] as string | undefined
    const opValue = filters[`${field}_op` as keyof Filters]
    const op = isNumberFilterOp(opValue) ? opValue : undefined
    const [open, setOpen] = useState(false)
    const [draftValue, setDraftValue] = useState(value || "0")
    const [draftOp, setDraftOp] = useState<NumberFilterOp>(op || "gt")
    const active = value !== undefined && value !== ""

    const apply = () => {
        onApply(field, draftValue, draftOp)
        setOpen(false)
    }

    const clear = () => {
        setDraftValue("0")
        setDraftOp("gt")
        onClear(field)
        setOpen(false)
    }

    return (
        <div className="flex min-w-0 items-center justify-center gap-1">
            <span className="truncate">{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6 shrink-0", active && "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800")}
                        onClick={() => {
                            setDraftValue(value || "0")
                            setDraftOp(op || "gt")
                        }}
                    >
                        <Funnel className="h-3.5 w-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 space-y-3 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">Lọc {label.toLowerCase()}</div>
                        <Select value={draftOp} onValueChange={(next) => setDraftOp(next as NumberFilterOp)}>
                            <SelectTrigger className="h-7 w-auto border-0 bg-transparent px-1 text-xs font-semibold shadow-none focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {NUMBER_FILTER_OPERATORS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Input
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") apply()
                        }}
                        inputMode="decimal"
                        placeholder="Nhập giá trị"
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clear}>
                            Xóa
                        </Button>
                        <Button type="button" size="sm" onClick={apply}>
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function ActiveFilterChips({
    filters,
    customerQueries,
    employeeQueries,
    onChange,
}: {
    filters: Filters
    customerQueries: Array<{ data?: any }>
    employeeQueries: Array<{ data?: any }>
    onChange: (filters: Filters) => void
}) {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []

    ;(filters.customer_id ?? []).forEach((id, index) => {
        const customer = unwrapEntity(customerQueries[index]?.data)
        chips.push({
            key: `customer-${id}`,
            label: `Khách hàng: ${customer ? `${customer.code || ""} - ${customer.name || ""}` : `#${id}`}`,
            onRemove: () => onChange({ ...filters, customer_id: (filters.customer_id ?? []).filter((item) => item !== id) }),
        })
    })
    ;(filters.employee_id ?? []).forEach((id, index) => {
        const employee = unwrapEntity(employeeQueries[index]?.data)
        chips.push({
            key: `employee-${id}`,
            label: `NV sale: ${employee ? `${employee.code || ""} - ${employee.name || ""}` : `#${id}`}`,
            onRemove: () => onChange({ ...filters, employee_id: (filters.employee_id ?? []).filter((item) => item !== id) }),
        })
    })
    ;(filters.overdue_bucket ?? []).forEach((bucket) => {
        const option = BUCKET_OPTIONS.find((item) => item.value === bucket)
        chips.push({
            key: `bucket-${bucket}`,
            label: `Nhóm công nợ: ${option?.label || bucket}`,
            onRemove: () => onChange({ ...filters, overdue_bucket: (filters.overdue_bucket ?? []).filter((item) => item !== bucket) }),
        })
    })

    NUMBER_FIELD_LABELS.forEach(({ field, label }) => {
        const value = filters[`${field}_value` as keyof Filters] as string | undefined
        if (!value) return
        const op = filters[`${field}_op` as keyof Filters] as string | undefined
        chips.push({
            key: `number-${field}`,
            label: `${label} ${numberFilterSymbol(op)} ${value}`,
            onRemove: () => onChange({ ...filters, [`${field}_op`]: undefined, [`${field}_value`]: undefined }),
        })
    })

    if (!chips.length) return null

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
                <Badge key={chip.key} variant="secondary" className="gap-1 rounded-md py-1 text-xs">
                    <span className="max-w-[320px] truncate">{chip.label}</span>
                    <button type="button" className="rounded-sm hover:bg-slate-200" onClick={chip.onRemove} aria-label={`Bỏ lọc ${chip.label}`}>
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
    )
}

function BucketFilter({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<string[]>(value)
    const selectedLabels = BUCKET_OPTIONS.filter((option) => value.includes(option.value)).map((option) => option.label)

    const toggle = (optionValue: string) => {
        setDraft((current) => current.includes(optionValue)
            ? current.filter((item) => item !== optionValue)
            : [...current, optionValue])
    }

    return (
        <Popover open={open} onOpenChange={(next) => {
            setOpen(next)
            if (next) setDraft(value)
        }}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={cn(controlClass, "min-w-[220px] flex-1 justify-between px-3")}>
                    <span className="flex min-w-0 items-center gap-2">
                        <Filter className="size-4 text-slate-500" />
                        <span className="truncate">{selectedLabels.length ? selectedLabels.join(", ") : "Nhóm công nợ"}</span>
                    </span>
                    <ChevronsUpDown className="size-4 text-slate-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
                <div className="space-y-1">
                    {BUCKET_OPTIONS.map((option) => (
                        <div
                            key={option.value}
                            role="button"
                            tabIndex={0}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                            onClick={() => toggle(option.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    toggle(option.value)
                                }
                            }}
                        >
                            <Checkbox checked={draft.includes(option.value)} onCheckedChange={() => toggle(option.value)} onClick={(event) => event.stopPropagation()} />
                            <span className="flex-1">{option.label}</span>
                            {draft.includes(option.value) ? <Check className="size-4 text-primary" /> : null}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDraft([])}>Bỏ lọc</Button>
                    <Button type="button" size="sm" onClick={() => {
                        onChange(draft)
                        setOpen(false)
                    }}>
                        Áp dụng
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    loading,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: string
    loading?: boolean
    tone: "opening" | "credit" | "closing" | "danger"
}) {
    const toneClass = {
        opening: {
            card: "border-sky-200 bg-sky-50 text-sky-800",
            icon: "bg-white/75 text-sky-700",
            value: "text-sky-950",
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
        danger: {
            card: "border-rose-200 bg-rose-50 text-rose-800",
            icon: "bg-white/75 text-rose-700",
            value: "text-rose-700",
        },
    }[tone]

    return (
        <div className={cn("rounded-lg border p-2.5 shadow-sm", toneClass.card)}>
            <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-right text-lg font-semibold tabular-nums", toneClass.value)}>
                        {loading ? "..." : value}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ReportTh({
    className,
    children,
    resizeIndex,
    onResizeStart,
}: {
    className?: string
    children: ReactNode
    resizeIndex?: number
    onResizeStart?: (columnIndex: number, event: ReactMouseEvent<HTMLDivElement>) => void
}) {
    return (
        <th className={cn("relative h-14 border border-slate-200 px-2 py-2.5 text-center font-semibold leading-normal align-middle", className)}>
            <span className="flex min-h-9 items-center justify-center whitespace-normal break-words">
                {children}
            </span>
            {resizeIndex !== undefined && onResizeStart ? (
                <div
                    className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/30"
                    onMouseDown={(event) => onResizeStart(resizeIndex, event)}
                />
            ) : null}
        </th>
    )
}

function ReportTd({ className, children, colSpan }: { className?: string; children?: ReactNode; colSpan?: number }) {
    return (
        <td colSpan={colSpan} className={cn("overflow-hidden text-ellipsis whitespace-nowrap border border-slate-200 px-2 py-2 align-middle", className)}>
            {children}
        </td>
    )
}

function MoneyCell({
    value,
    tone,
    strong,
}: {
    value?: number
    tone?: "danger" | "success" | "warning"
    strong?: boolean
}) {
    return (
        <ReportTd
            className={cn(
                "text-right tabular-nums",
                strong ? "font-bold text-slate-950" : "font-semibold",
                tone === "danger" && "text-rose-700",
                tone === "success" && "text-emerald-700",
                tone === "warning" && "text-amber-700",
            )}
        >
            {formatCurrency(Number(value || 0))}
        </ReportTd>
    )
}

type ExportFilters = Omit<Parameters<typeof getArOverdueReportTotals>[0], "page" | "size">

async function fetchAllArOverdueRows(filters: ExportFilters): Promise<ArOverdueReportRow[]> {
    const rows: ArOverdueReportRow[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listArOverdueReport({
            page,
            size: EXPORT_PAGE_SIZE,
            ...filters,
        })
        rows.push(...(res.items ?? []))

        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return rows
}

function buildTotalsFromRows(rows: ArOverdueReportRow[]) {
    return rows.reduce(
        (total, row) => ({
            total_debt: total.total_debt + Number(row.total_debt || 0),
            total_overdue_debt: total.total_overdue_debt + Number(row.total_overdue_debt || 0),
            current_debt: total.current_debt + Number(row.current_debt || 0),
            overdue_1_30: total.overdue_1_30 + Number(row.overdue_1_30 || 0),
            overdue_31_60: total.overdue_31_60 + Number(row.overdue_31_60 || 0),
            overdue_61_90: total.overdue_61_90 + Number(row.overdue_61_90 || 0),
            overdue_91_120: total.overdue_91_120 + Number(row.overdue_91_120 || 0),
            overdue_over_120: total.overdue_over_120 + Number(row.overdue_over_120 || 0),
            unknown_debt: total.unknown_debt + Number(row.unknown_debt || 0),
        }),
        {
            total_debt: 0,
            total_overdue_debt: 0,
            current_debt: 0,
            overdue_1_30: 0,
            overdue_31_60: 0,
            overdue_61_90: 0,
            overdue_91_120: 0,
            overdue_over_120: 0,
            unknown_debt: 0,
        },
    )
}

async function exportArOverdueXlsx(
    rows: ArOverdueReportRow[],
    totals: ReturnType<typeof buildTotalsFromRows>,
    reportDate?: string,
) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Công nợ trễ hạn", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow(["CÔNG NỢ TRỄ HẠN"])
    sheet.addRow([`Ngày báo cáo: ${formatDisplayDate(reportDate)}`])
    sheet.addRow([])
    sheet.addRow(EXCEL_COLUMNS.map((column) => column.label))

    rows.forEach((row, index) => {
        sheet.addRow(EXCEL_COLUMNS.map((column) => normalizeExcelCell(column.value(row, index), column)))
    })

    sheet.addRow([
        "",
        "",
        "",
        "",
        "Tổng cộng",
        toExcelNumber(totals.total_debt),
        toExcelNumber(totals.total_overdue_debt),
        toExcelNumber(totals.current_debt),
        toExcelNumber(totals.overdue_1_30),
        toExcelNumber(totals.overdue_31_60),
        toExcelNumber(totals.overdue_61_90),
        toExcelNumber(totals.overdue_91_120),
        toExcelNumber(totals.overdue_over_120),
        toExcelNumber(totals.unknown_debt),
    ])

    sheet.columns = EXCEL_COLUMNS.map((column) => ({ width: column.width }))
    sheet.mergeCells(1, 1, 1, EXCEL_COLUMNS.length)
    sheet.mergeCells(2, 1, 2, EXCEL_COLUMNS.length)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: EXCEL_COLUMNS.length },
    }
    styleExcelSheet(sheet, EXCEL_COLUMNS)

    const totalRow = sheet.getRow(sheet.rowCount)
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
        }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    downloadExcelBuffer(buffer, `cong-no-tre-han-${todayYmd()}.xlsx`)
}

function normalizeExcelCell(value: string | number | null | undefined, column: ExcelColumn) {
    if (value == null || value === "") return ""
    if (column.type === "number") return toExcelNumber(value)
    return value
}

function toExcelNumber(value?: number | string) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : ""
}

function formatDisplayDate(value?: string): string {
    if (!value) return "-"
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        return `${ymd[3].padStart(2, "0")}/${ymd[2].padStart(2, "0")}/${ymd[1]}`
    }
    return value
}

function todayYmd() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function excelBorder() {
    return {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }
}

function styleExcelSheet(sheet: import("exceljs").Worksheet, columns: ExcelColumn[]) {
    const border = excelBorder()
    const title = sheet.getRow(1)
    title.height = 24
    title.getCell(1).font = { bold: true, size: 16 }
    title.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const period = sheet.getRow(2)
    period.height = 22
    period.getCell(1).font = { italic: true, color: { argb: "FF64748B" } }
    period.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const header = sheet.getRow(4)
    header.height = 28
    header.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0F766E" },
        }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            const column = columns[columnNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column?.align ?? (column?.type === "number" ? "right" : "left"),
                wrapText: false,
            }
            if (column?.type === "number") {
                cell.numFmt = column.numFmt ?? "#,##0"
            }
        })
        row.height = 22
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

function encodeMulti(value?: string[]) {
    return value?.length ? value.join(",") : undefined
}

function getItems(res: any) {
    return res?.items ?? res?.data?.items ?? []
}

function uniqueOptions(options: FilterOption[]) {
    const map = new Map<string, FilterOption>()
    for (const option of options) {
        map.set(option.value, option)
    }
    return Array.from(map.values())
}

function isNumberFilterOp(value: unknown): value is NumberFilterOp {
    return typeof value === "string" && NUMBER_FILTER_OPERATORS.some((item) => item.value === value)
}

function numberFilterSymbol(value: string | undefined) {
    return NUMBER_FILTER_OPERATORS.find((item) => item.value === value)?.chipLabel || "="
}

function unwrapEntity(value: any) {
    return value?.data ?? value
}
