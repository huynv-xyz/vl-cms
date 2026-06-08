import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Coins, FileText, HandCoins, Wallet } from "lucide-react"

import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/purchasing/ap-summary"
import { listContracts } from "@/api/purchasing/contract"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { Contract } from "@/features/purchasing/contract/data/schema"
import { ApSummaryTable } from "./components/ap-summary-table"
import {
    calcRemainingAmount,
    getContractPaymentStatus,
    getPaidAmountVnd,
    type PaymentStatus,
} from "./lib/payment-status"

// Lấy hết HĐ thoả filter cho phần Summary. Doanh nghiệp Vlife có vài trăm HĐ/năm
// nên size 10k đủ để tổng hợp trong 1 lượt fetch (cap dưới 200ms tại p99).
const AGGREGATE_PAGE_SIZE = 10000

/**
 * Báo cáo công nợ NCC (Accounts Payable) — yêu cầu chị KT 06/2026.
 *
 * Mục đích:
 *  - Theo dõi nợ NCC theo từng hợp đồng
 *  - Cho biết: HĐ nào đã trả, chưa trả, cọc bao nhiêu, còn phải trả bao nhiêu
 *  - Tổng công nợ NCC = Σ remaining_amount của các hợp đồng chưa thanh toán đủ
 *
 * Dữ liệu lấy từ /purchasing/contracts (đã có total_amount_vnd, total_paid_amount,
 * remaining_amount, deposit_rate, deposit_date, supplier).
 */
export default function PurchasingApSummaryPage() {
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
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ["supplier_ids"],
        ["payment_status", "signed_date_from", "signed_date_to"],
    )

    const filterParams = {
        keyword,
        supplier_ids: requestFilters.supplier_ids,
        signed_date_from: requestFilters.signed_date_from,
        signed_date_to: requestFilters.signed_date_to,
    }

    // Trang hiện tại — phục vụ table
    const { data, isLoading, error } = usePaginatedList(
        [
            "purchasing-ap-summary",
            search.page,
            search.size,
            keyword,
            multiFilters.supplier_ids,
            singleFilters.payment_status,
            singleFilters.signed_date_from,
            singleFilters.signed_date_to,
        ],
        listContracts,
        {
            page: search.page,
            size: search.size,
            ...filterParams,
        },
    )

    // Aggregate query: lấy hết HĐ thoả filter để Summary cards/Status tiles
    // phản ánh đúng tổng công nợ chứ không chỉ trang hiện tại.
    const aggregateQuery = useQuery({
        queryKey: [
            "purchasing-ap-summary",
            "aggregate",
            filterParams,
        ],
        queryFn: () =>
            listContracts({
                page: 1,
                size: AGGREGATE_PAGE_SIZE,
                ...filterParams,
            }),
        staleTime: 60_000,
    })

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Công nợ nhà cung cấp"
            description="Theo dõi cọc, thanh toán dở dang và công nợ còn lại theo từng hợp đồng mua hàng."
            data={data}
        >
            {(data) => (
                <ApSummaryContent
                    items={data.items}
                    allItems={aggregateQuery.data?.items ?? []}
                    totalCount={data.total}
                    aggregateLoading={aggregateQuery.isLoading}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={(value) => {
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                        setKeyword(value)
                    }}
                    filters={{
                        supplier_ids: multiFilters.supplier_ids,
                        payment_status: singleFilters.payment_status,
                        signed_date_from: singleFilters.signed_date_from,
                        signed_date_to: singleFilters.signed_date_to,
                    }}
                    onFiltersChange={(next) => {
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                        setMultiFilters({ supplier_ids: next.supplier_ids })
                        setSingleFilters({
                            payment_status: next.payment_status,
                            signed_date_from: next.signed_date_from,
                            signed_date_to: next.signed_date_to,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}

function ApSummaryContent({
    items,
    allItems,
    totalCount,
    aggregateLoading,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Parameters<typeof ApSummaryTable>[0] & {
    allItems: Contract[]
    totalCount: number
    aggregateLoading: boolean
}) {
    // Filter client-side theo payment_status (BE chưa hỗ trợ filter này riêng).
    const filtered = useMemo(() => {
        if (!filters.payment_status) return items
        return items.filter(
            (c) => getContractPaymentStatus(c) === filters.payment_status,
        )
    }, [items, filters.payment_status])

    // Aggregate trên TOÀN BỘ HĐ thoả filter (không bị bó hẹp theo page).
    const aggregateBase = useMemo(() => {
        if (!filters.payment_status) return allItems
        return allItems.filter(
            (c) => getContractPaymentStatus(c) === filters.payment_status,
        )
    }, [allItems, filters.payment_status])

    const totals = useMemo(() => calculateTotals(aggregateBase), [aggregateBase])

    // Số HĐ đang xem = tổng từ BE (total filtered), không phải length của page.
    // Khi có filter payment_status (client-side) thì dùng aggregateBase.length.
    const visibleCount = filters.payment_status
        ? aggregateBase.length
        : totalCount

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={FileText}
                    label="Tổng HĐ đang lọc"
                    value={
                        aggregateLoading
                            ? "..."
                            : formatNumber(visibleCount)
                    }
                    sub={`Hiển thị ${formatNumber(items.length)} HĐ ở trang này`}
                    tone="muted"
                />
                <SummaryCard
                    icon={Coins}
                    label="Tổng giá trị HĐ"
                    value={
                        aggregateLoading
                            ? "..."
                            : formatCurrency(totals.totalAmount)
                    }
                    tone="muted"
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Đã thanh toán"
                    value={
                        aggregateLoading
                            ? "..."
                            : formatCurrency(totals.totalPaid)
                    }
                    sub={`${formatNumber(totals.fullCount + totals.partialCount + totals.overCount)} HĐ có phát sinh TT`}
                    tone="ok"
                />
                <SummaryCard
                    icon={HandCoins}
                    label="Còn phải thanh toán"
                    value={
                        aggregateLoading
                            ? "..."
                            : formatCurrency(totals.totalRemaining)
                    }
                    sub={`${formatNumber(totals.notPaidCount + totals.partialCount)} HĐ chưa trả đủ`}
                    tone="warn"
                />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatusTile
                    status="NOT_PAID"
                    label="Chưa thanh toán"
                    count={totals.notPaidCount}
                    amount={totals.notPaidAmount}
                />
                <StatusTile
                    status="PARTIAL"
                    label="Thanh toán 1 phần"
                    count={totals.partialCount}
                    amount={totals.partialRemaining}
                />
                <StatusTile
                    status="FULL"
                    label="Đã thanh toán đủ"
                    count={totals.fullCount}
                    amount={totals.fullAmount}
                />
                <StatusTile
                    status="OVER"
                    label="Thanh toán vượt"
                    count={totals.overCount}
                    amount={totals.overExcess}
                />
            </div>

            <ApSummaryTable
                items={filtered}
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={filters}
                onFiltersChange={onFiltersChange}
            />
        </div>
    )
}

function calculateTotals(items: Contract[]) {
    let totalAmount = 0
    let totalPaid = 0
    let totalRemaining = 0
    let notPaidCount = 0
    let notPaidAmount = 0
    let partialCount = 0
    let partialRemaining = 0
    let fullCount = 0
    let fullAmount = 0
    let overCount = 0
    let overExcess = 0

    for (const c of items) {
        const total = Number(c.total_amount_vnd ?? 0)
        const paid = getPaidAmountVnd(c)
        const remaining = calcRemainingAmount(c)
        const status = getContractPaymentStatus(c)

        totalAmount += total
        totalPaid += paid
        totalRemaining += remaining

        if (status === "NOT_PAID") {
            notPaidCount += 1
            notPaidAmount += total
        } else if (status === "PARTIAL") {
            partialCount += 1
            partialRemaining += remaining
        } else if (status === "FULL") {
            fullCount += 1
            fullAmount += paid
        } else if (status === "OVER") {
            overCount += 1
            overExcess += Math.max(paid - total, 0)
        }
    }

    return {
        totalAmount,
        totalPaid,
        totalRemaining,
        notPaidCount,
        notPaidAmount,
        partialCount,
        partialRemaining,
        fullCount,
        fullAmount,
        overCount,
        overExcess,
    }
}

function SummaryCard({
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
    tone?: "ok" | "warn" | "muted"
}) {
    const toneClass =
        tone === "ok"
            ? "text-emerald-700"
            : tone === "warn"
                ? "text-amber-700"
                : "text-muted-foreground"

    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className={`flex items-center gap-2 text-sm font-medium ${toneClass}`}>
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sub}
                </div>
            ) : null}
        </div>
    )
}

function StatusTile({
    status,
    label,
    count,
    amount,
}: {
    status: PaymentStatus
    label: string
    count: number
    amount: number
}) {
    const cls =
        status === "FULL"
            ? "border-emerald-200 bg-emerald-50"
            : status === "PARTIAL"
                ? "border-amber-200 bg-amber-50"
                : status === "OVER"
                    ? "border-rose-200 bg-rose-50"
                    : "border-slate-200 bg-slate-50"

    return (
        <div className={`rounded-md border px-4 py-3 ${cls}`}>
            <div className="flex items-center justify-between gap-2 text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {label}
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {formatNumber(count)} HĐ
                </span>
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(amount)}
            </div>
        </div>
    )
}
