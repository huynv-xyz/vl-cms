import { useMemo } from "react"
import { AlertOctagon, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/inventory/alerts"
import { listInventoryLots } from "@/api/inventory/lot"
import type { InventoryLot } from "@/features/inventory/lot/data/schema"
import { AlertsTable } from "./components/alerts-table"

/**
 * Dashboard cảnh báo HSD (BA Spec M7).
 *
 *  - "EXPIRED"     : ngày hiện tại > expiry_date AND còn tồn
 *  - "NEAR_EXPIRY" : expiry_date - today <= 180 ngày AND còn tồn (BR-05.3)
 *
 * Dữ liệu lấy từ /inventory/lots với `only_remaining=true` + `expiry_status`.
 * Sort mặc định ưu tiên hết hạn → cận date → còn hạn.
 */
export default function InventoryAlertsPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        [],
        ["expiry_status", "warehouse_id"],
    )

    // Mặc định chỉ load lô có cảnh báo. Nếu user chọn ALL hoặc cụ thể thì dùng giá trị đó.
    const expiryFilter =
        requestFilters.expiry_status === "ALL"
            ? undefined
            : (requestFilters.expiry_status ?? "EXPIRED,NEAR_EXPIRY")

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-alerts",
            search.page,
            search.size,
            keyword,
            expiryFilter,
            requestFilters.warehouse_id,
        ],
        listInventoryLots,
        {
            page: search.page,
            size: search.size,
            keyword,
            expiry_status: expiryFilter,
            only_remaining: true,
            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Cảnh báo hạn sử dụng"
            description="Danh sách lô tồn cận date (≤ 180 ngày) hoặc đã hết hạn. Sắp xếp ưu tiên lô gấp nhất."
            data={data}
        >
            {(data) => (
                <AlertsContent
                    items={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={(value) => {
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                        setKeyword(value)
                    }}
                    filters={{
                        expiry_status: singleFilters.expiry_status,
                        warehouse_id: singleFilters.warehouse_id
                            ? Number(singleFilters.warehouse_id)
                            : undefined,
                    }}
                    onFiltersChange={(next) => {
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                        setSingleFilters({
                            expiry_status: next.expiry_status,
                            warehouse_id: next.warehouse_id
                                ? String(next.warehouse_id)
                                : undefined,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}

function AlertsContent({
    items,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Parameters<typeof AlertsTable>[0]) {
    const counters = useMemo(() => countByStatus(items), [items])

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={AlertOctagon}
                    label="Đã hết hạn"
                    value={counters.expired}
                    tone="bad"
                />
                <SummaryCard
                    icon={AlertTriangle}
                    label="Cận date ≤ 180 ngày"
                    value={counters.nearExpiry}
                    tone="warn"
                />
                <SummaryCard
                    icon={Clock}
                    label="Cần xử lý sớm (≤ 30 ngày)"
                    value={counters.urgent}
                    tone="warn"
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Tổng lô đang xem"
                    value={items.length}
                    tone="ok"
                />
            </div>

            <AlertsTable
                items={items}
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

function countByStatus(items: InventoryLot[]) {
    let expired = 0
    let nearExpiry = 0
    let urgent = 0

    for (const lot of items) {
        if (lot.expiry_status === "EXPIRED") {
            expired += 1
        } else if (lot.expiry_status === "NEAR_EXPIRY") {
            nearExpiry += 1
            if ((lot.days_to_expiry ?? 999) <= 30) urgent += 1
        }
    }

    return { expired, nearExpiry, urgent }
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: number
    tone: "bad" | "warn" | "ok"
}) {
    const toneClass =
        tone === "bad"
            ? "text-destructive"
            : tone === "warn"
                ? "text-amber-700"
                : "text-emerald-700"

    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div
                className={`flex items-center gap-2 text-sm font-medium ${toneClass}`}
            >
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {value.toLocaleString("vi-VN")}
            </div>
        </div>
    )
}
