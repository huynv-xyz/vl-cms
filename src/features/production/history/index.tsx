import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { listProductionHistory } from "@/api/production/history"
import { Route } from "@/routes/_authenticated/production/history"
import { ProductionHistoryTable } from "./components/production-history-table"
import { ExportProductionHistoryButton } from "./components/export-production-history-button"

export default function ProductionHistoryPage() {
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
        ["product_id", "physical_warehouse_id", "status", "from_date", "to_date", "completion"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "production-history",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.physical_warehouse_id,
            singleFilters.status,
            singleFilters.from_date,
            singleFilters.to_date,
            singleFilters.completion,
        ],
        listProductionHistory,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
            physical_warehouse_id: requestFilters.physical_warehouse_id ? Number(requestFilters.physical_warehouse_id) : undefined,
            status: requestFilters.status,
            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
            completion: requestFilters.completion,
        }
    )

    return (
        <PageSection
            title="Lịch sử sản xuất"
            isLoading={isLoading}
            error={error}
            data={data}
            actions={
                <ExportProductionHistoryButton
                    keyword={keyword}
                    filters={{
                        product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
                        physical_warehouse_id: requestFilters.physical_warehouse_id ? Number(requestFilters.physical_warehouse_id) : undefined,
                        status: requestFilters.status,
                        from_date: requestFilters.from_date,
                        to_date: requestFilters.to_date,
                        completion: requestFilters.completion,
                    }}
                />
            }
        >
            {(data) => (
                <ProductionHistoryTable
                    data={data.items || []}
                    total={data.total || 0}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={(value) => {
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                        setKeyword(value)
                    }}
                    filters={{
                        product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
                        physical_warehouse_id: singleFilters.physical_warehouse_id ? Number(singleFilters.physical_warehouse_id) : undefined,
                        status: singleFilters.status,
                        from_date: singleFilters.from_date,
                        to_date: singleFilters.to_date,
                        completion: singleFilters.completion,
                    }}
                    onFiltersChange={(next) => {
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                        setSingleFilters({
                            product_id: next.product_id ? String(next.product_id) : undefined,
                            physical_warehouse_id: next.physical_warehouse_id ? String(next.physical_warehouse_id) : undefined,
                            status: next.status,
                            from_date: next.from_date,
                            to_date: next.to_date,
                            completion: next.completion,
                        } as any)
                    }}
                />
            )}
        </PageSection>
    )
}
