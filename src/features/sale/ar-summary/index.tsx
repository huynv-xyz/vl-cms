import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { BarChart3 } from "lucide-react"

import { listArLedgerSummary, type ArLedgerSummary } from "@/api/sale/ar-ledger"
import { getCustomer, listCustomers } from "@/api/customer"
import { DatePicker } from "@/components/date-picker"
import { PageSection } from "@/components/page-section"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { cn } from "@/lib/utils"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/ar-summary"

type Filters = {
    from_date?: string
    to_date?: string
    customer_id?: number
}

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

export default function ArSummaryPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
    } = useUrlListFilters(
        search,
        navigate,
        [],
        ["from_date", "to_date", "customer_id"],
    )

    const customerId = singleFilters.customer_id
        ? Number(singleFilters.customer_id)
        : undefined

    const { data, isLoading, error } = usePaginatedList(
        [
            "ar-summary",
            search.page,
            search.size,
            keyword,
            singleFilters,
        ],
        listArLedgerSummary,
        {
            page: search.page,
            size: search.size,
            keyword,
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: customerId,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Tổng hợp công nợ"
            description="Tổng hợp số dư đầu kỳ, phát sinh và số dư cuối kỳ theo khách hàng."
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
                    filters={{ ...singleFilters, customer_id: customerId }}
                    onFiltersChange={(next) =>
                        setSingleFilters({
                            from_date: next.from_date,
                            to_date: next.to_date,
                            customer_id: next.customer_id
                                ? String(next.customer_id)
                                : undefined,
                        })
                    }
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
    filters,
    onFiltersChange,
}: {
    data: ArLedgerSummary[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}) {
    const totals = data.reduce(
        (acc, row) => ({
            opening: acc.opening + Number(row.opening_balance || 0),
            debit: acc.debit + Number(row.debit_amount || 0),
            credit: acc.credit + Number(row.credit_amount || 0),
            closing: acc.closing + Number(row.closing_balance || 0),
        }),
        { opening: 0, debit: 0, credit: 0, closing: 0 },
    )

    const setFilter = (key: keyof Filters, value: unknown) =>
        onFiltersChange({ ...filters, [key]: value })
    const today = todayYmd()

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
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                    <BarChart3 className="h-4 w-4 text-slate-500" />
                    Bộ lọc tổng hợp
                </div>
                <div className="space-y-2 p-4">
                    <div className="flex w-full flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm mã hoặc tên khách hàng..."
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
                            mapOption={customerOption}
                        />
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2">
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

            <div className="grid gap-3 md:grid-cols-4">
                <Summary label="Đầu kỳ" value={formatMoney(totals.opening)} />
                <Summary label="Phát sinh nợ" value={formatMoney(totals.debit)} />
                <Summary label="Phát sinh có" value={formatMoney(totals.credit)} />
                <Summary label="Cuối kỳ" value={formatMoney(totals.closing)} strong />
            </div>

            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-sm">
                        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="w-12 px-3 py-3 text-center">#</th>
                                <th className="px-3 py-3 text-left">Khách hàng</th>
                                <th className="px-3 py-3 text-right">Đầu kỳ</th>
                                <th className="px-3 py-3 text-right">Phát sinh nợ</th>
                                <th className="px-3 py-3 text-right">Phát sinh có</th>
                                <th className="px-3 py-3 text-right">Cuối kỳ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                                        Không có dữ liệu công nợ.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, index) => (
                                    <tr key={row.customer_id} className="border-b last:border-b-0 hover:bg-slate-50">
                                        <td className="px-3 py-3 text-center text-xs text-slate-500">
                                            {pagination.pageIndex * pagination.pageSize + index + 1}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Link
                                                to="/sales/ar-ledgers"
                                                search={{
                                                    page: 1,
                                                    size: pagination.pageSize,
                                                    keyword: "",
                                                    source_type: undefined,
                                                    from_date: filters.from_date ?? today,
                                                    to_date: filters.to_date ?? today,
                                                    customer_id: row.customer_id,
                                                    ...returnSearch,
                                                }}
                                                className="inline-flex min-w-0 flex-col rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                <span className="font-medium text-primary">{row.customer_name || "-"}</span>
                                                <span className="mt-0.5 text-xs text-slate-500">{row.customer_code || "-"}</span>
                                            </Link>
                                        </td>
                                        <MoneyCell value={row.opening_balance} />
                                        <MoneyCell value={row.debit_amount} tone="debit" />
                                        <MoneyCell value={row.credit_amount} tone="credit" />
                                        <MoneyCell value={row.closing_balance} strong />
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data.length > 0 ? (
                            <tfoot className="border-t bg-slate-50">
                                <tr>
                                    <td colSpan={2} className="px-3 py-3 text-right font-bold text-slate-950">
                                        Tổng
                                    </td>
                                    <MoneyCell value={totals.opening} strong />
                                    <MoneyCell value={totals.debit} tone="debit" strong />
                                    <MoneyCell value={totals.credit} tone="credit" strong />
                                    <MoneyCell value={totals.closing} strong />
                                </tr>
                            </tfoot>
                        ) : null}
                    </table>
                </div>
            </div>

            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
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
    tone?: "debit" | "credit"
    strong?: boolean
}) {
    return (
        <td
            className={cn(
                "px-3 py-3 text-right tabular-nums",
                strong ? "font-bold text-slate-950" : "font-semibold",
                tone === "debit" && "text-rose-700",
                tone === "credit" && "text-emerald-700",
                !tone && !strong && "text-slate-800",
            )}
        >
            {formatMoney(value)}
        </td>
    )
}

function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
            <div className={cn("mt-1 text-xl tabular-nums", strong ? "font-bold text-slate-950" : "font-semibold text-slate-800")}>
                {value}
            </div>
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

function formatMoney(value?: number | string) {
    const amount = Number(value || 0)
    if (!amount) return "-"
    return amount.toLocaleString("vi-VN")
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
