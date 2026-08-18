import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef, OnChangeFn, PaginationState } from "@tanstack/react-table"
import { AlertTriangle, Filter, RotateCcw } from "lucide-react"

import { listInventoryAccountPostings, type InventoryAccountPosting, type InventoryAccountPostingTotals } from "@/api/inventory/account-posting"
import type { PagedResult } from "@/api/client"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { CrudTable } from "@/components/crud/crud-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/inventory/account-postings"

export default function InventoryAccountPostingsPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const [draft, setDraft] = useState({
        from_date: search.from_date || "",
        to_date: search.to_date || "",
        account: search.account || "",
    })

    const page = Math.max(Number(search.page || 1), 1)
    const size = Math.max(Number(search.size || 50), 1)
    const pageIndex = page - 1
    const pagination = useMemo(() => ({ pageIndex, pageSize: size }), [pageIndex, size])

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: ["inventory-account-postings", page, size, search.from_date, search.to_date, search.account],
        queryFn: () => listInventoryAccountPostings({
            page,
            size,
            from_date: search.from_date,
            to_date: search.to_date,
            account: search.account,
        }),
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
    })

    const pageData = data as (PagedResult<InventoryAccountPosting> & { totals?: InventoryAccountPostingTotals }) | undefined
    const totals = pageData?.totals || { debit_amount: 0, credit_amount: 0, difference: 0, balanced: true }
    const columns = useMemo(() => buildColumns(totals), [totals])

    const setPagination: OnChangeFn<PaginationState> = (updater) => {
        const next = typeof updater === "function" ? updater(pagination) : updater
        navigate({
            search: {
                ...search,
                page: next.pageIndex + 1,
                size: next.pageSize,
            } as any,
        })
    }

    const applyFilters = (override?: Partial<typeof draft>) => {
        const nextDraft = { ...draft, ...(override || {}) }
        navigate({
            search: {
                page: 1,
                size,
                from_date: nextDraft.from_date || undefined,
                to_date: nextDraft.to_date || undefined,
                account: nextDraft.account || undefined,
            } as any,
        })
    }

    const resetFilters = () => {
        const next = { from_date: "", to_date: todayYmd(), account: "" }
        setDraft(next)
        navigate({
            search: {
                page: 1,
                size,
                to_date: next.to_date,
            } as any,
        })
    }

    if (error) {
        return <div className="p-6 text-sm text-red-600">Lỗi tải dữ liệu tài khoản phát sinh.</div>
    }

    return (
        <div className="flex w-full min-w-0 flex-col gap-4 p-6">
            <div>
                <h1 className="text-2xl font-bold">Tài khoản phát sinh</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tổng hợp phát sinh Nợ/Có từ tài khoản hạch toán trên sổ chi tiết vật tư hàng hóa.
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <div className="relative h-10 min-w-[260px] flex-[1.6_1_0]">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                            value={draft.account}
                            onChange={(event) => setDraft((current) => ({ ...current, account: event.target.value }))}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    const account = event.currentTarget.value
                                    setDraft((current) => ({ ...current, account }))
                                    applyFilters({ account })
                                }
                            }}
                            placeholder="Lọc tài khoản"
                            className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                        />
                    </div>
                    <Input
                        type="date"
                        aria-label="Từ ngày"
                        className={filterControlClass("min-w-[160px] flex-1")}
                        value={draft.from_date}
                        onChange={(event) => setDraft((current) => ({ ...current, from_date: event.target.value }))}
                    />
                    <Input
                        type="date"
                        aria-label="Đến ngày"
                        className={filterControlClass("min-w-[160px] flex-1")}
                        value={draft.to_date}
                        onChange={(event) => setDraft((current) => ({ ...current, to_date: event.target.value }))}
                    />
                    <div className="flex gap-2">
                        <Button onClick={() => applyFilters()} disabled={isFetching}>
                            <Filter className="mr-2 h-4 w-4" />
                            Lọc
                        </Button>
                        <Button variant="outline" onClick={resetFilters} disabled={isFetching}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Đặt lại
                        </Button>
                    </div>
                </div>
            </div>

            {!totals.balanced && (
                <Alert className="border-red-200 bg-red-50 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Phát sinh Nợ/Có đang lệch</AlertTitle>
                    <AlertDescription>
                        Chênh lệch: {formatNumber(Number(totals.difference || 0))}. Kiểm tra các dòng thiếu TK Nợ hoặc TK Có trong sổ kho.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                    Tổng {formatNumber(pageData?.total || 0)} tài khoản
                </div>
                <CrudTable<InventoryAccountPosting>
                    data={isLoading ? [] : pageData?.items || []}
                    columns={columns}
                    entityName="tài khoản phát sinh"
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={pageData?.total_page || 0}
                    showToolbar={false}
                    enableColumnResize
                    enableStickyHorizontalScroll
                    headerVariant="report"
                />
            </div>
        </div>
    )
}

function buildColumns(totals: InventoryAccountPostingTotals): ColumnDef<InventoryAccountPosting>[] {
    const gridCell = "border-r border-slate-200 last:border-r-0"
    const centerCell = `${gridCell} text-center`
    const numberCell = `${gridCell} text-right tabular-nums`
    const totalClass = totals.balanced ? "bg-slate-50 font-semibold" : "bg-red-50 font-semibold text-red-700"

    return [
        {
            ...buildIndexColumn<InventoryAccountPosting>(),
            header: "STT",
            size: 70,
            minSize: 60,
            meta: {
                thClassName: `w-[70px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[70px] whitespace-nowrap ${centerCell}`,
                footer: () => <span className={cn("block text-right", totalClass)}>Tổng theo bộ lọc</span>,
            },
        },
        {
            accessorKey: "account",
            header: "Tài khoản",
            size: 240,
            minSize: 180,
            cell: ({ row }) => <span className="block truncate font-mono text-sm font-semibold">{row.original.account}</span>,
            meta: {
                thClassName: `w-[240px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[240px] whitespace-nowrap ${centerCell}`,
                footer: () => <span className={cn("block", totalClass)} />,
            },
        },
        {
            accessorKey: "debit_amount",
            header: "Phát sinh nợ",
            size: 220,
            minSize: 160,
            cell: ({ row }) => formatNumber(Number(row.original.debit_amount || 0)),
            meta: {
                thClassName: `w-[220px] whitespace-nowrap ${numberCell}`,
                tdClassName: `w-[220px] whitespace-nowrap ${numberCell}`,
                footer: () => <span className={cn("block", totalClass)}>{formatNumber(Number(totals.debit_amount || 0))}</span>,
            },
        },
        {
            accessorKey: "credit_amount",
            header: "Phát sinh có",
            size: 220,
            minSize: 160,
            cell: ({ row }) => formatNumber(Number(row.original.credit_amount || 0)),
            meta: {
                thClassName: `w-[220px] whitespace-nowrap ${numberCell}`,
                tdClassName: `w-[220px] whitespace-nowrap ${numberCell}`,
                footer: () => <span className={cn("block", totalClass)}>{formatNumber(Number(totals.credit_amount || 0))}</span>,
            },
        },
    ]
}

function filterControlClass(className?: string) {
    return `h-10 rounded-md border-slate-300 bg-white shadow-xs ${className ?? ""}`
}

function todayYmd() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
