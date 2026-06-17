import { listInventoryLots } from "@/api/inventory/lot"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { formatNumber } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/inventory/lots"
import { ExportInventoryLotsButton } from "./components/export-inventory-lots-button"
import { InventoryLotTable } from "./components/inventory-lot-table"
import type { InventoryLot } from "./data/schema"

export default function InventoryLotPage() {
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
        [
            "product_id",
            "warehouse_id",
            "source_type",
            "expiry_status",
            "from_date",
            "to_date",
        ],
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-lots",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.source_type,
            singleFilters.expiry_status,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listInventoryLots,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
            source_type: requestFilters.source_type,
            expiry_status: requestFilters.expiry_status,
            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
            only_remaining: true,
        },
    )

    return (
        <PageSection
            title="Tồn kho theo lô (FIFO)"
            description="Xem tồn theo sản phẩm, kho, số lô, HSD và giá vốn để phục vụ FIFO."
            actions={
                <ExportInventoryLotsButton
                    keyword={keyword}
                    filters={{
                        product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
                        warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
                        source_type: requestFilters.source_type,
                        expiry_status: requestFilters.expiry_status,
                        from_date: requestFilters.from_date,
                        to_date: requestFilters.to_date,
                        only_remaining: true,
                    }}
                />
            }
            isLoading={isLoading}
            error={error}
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <LotWarningSummary data={data.items || []} />

                    <InventoryLotTable
                        data={data.items || []}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        filters={{
                            product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
                            warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
                            source_type: singleFilters.source_type,
                            expiry_status: singleFilters.expiry_status,
                            from_date: singleFilters.from_date,
                            to_date: singleFilters.to_date,
                        }}
                        onFiltersChange={(next) =>
                            setSingleFilters({
                                product_id: next.product_id ? String(next.product_id) : undefined,
                                warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
                                source_type: next.source_type,
                                expiry_status: next.expiry_status,
                                from_date: next.from_date,
                                to_date: next.to_date,
                            })
                        }
                    />
                </div>
            )}
        </PageSection>
    )
}

function LotWarningSummary({ data }: { data: InventoryLot[] }) {
    const remainingLots = data.filter((lot) => Number(lot.quantity_remaining ?? 0) > 0)
    const expired = remainingLots.filter((lot) => lot.expiry_status === "EXPIRED").length
    const nearExpiry = remainingLots.filter((lot) => lot.expiry_status === "NEAR_EXPIRY").length
    const noExpiry = remainingLots.filter((lot) => lot.expiry_status === "NO_EXPIRY").length

    return (
        <div className="grid gap-3 md:grid-cols-4">
            <LotMetric label="Lô còn tồn" value={formatNumber(remainingLots.length)} />
            <LotMetric label="Hết hạn" value={formatNumber(expired)} tone={expired > 0 ? "bad" : undefined} />
            <LotMetric label="Cận date 180 ngày" value={formatNumber(nearExpiry)} tone={nearExpiry > 0 ? "warn" : undefined} />
            <LotMetric label="Chưa có HSD" value={formatNumber(noExpiry)} tone={noExpiry > 0 ? "warn" : undefined} />
        </div>
    )
}

function LotMetric({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "bad" | "warn"
}) {
    const color =
        tone === "bad"
            ? "text-destructive"
            : tone === "warn"
                ? "text-amber-600"
                : "text-emerald-700"

    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
        </div>
    )
}
