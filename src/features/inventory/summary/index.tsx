import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { Route } from "@/routes/_authenticated/inventory/summary"
import { SummaryTable } from "./components/summary-table"
import { listInventorySummarys } from "@/api/inventory/summary"

export default function InventorySummaryPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } =
        useUrlPagination(search, navigate)

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
        ["product_id", "warehouse_id"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-summary",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
        ],
        listInventorySummarys,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id
                ? Number(requestFilters.product_id)
                : undefined,
            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,
        }
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Tồn kho"
            data={data}
        >
            {(data) => (
                <SummaryTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}

                    keyword={keyword}
                    onKeywordChange={setKeyword}

                    filters={{
                        product_id: singleFilters.product_id
                            ? Number(singleFilters.product_id)
                            : undefined,
                        warehouse_id: singleFilters.warehouse_id
                            ? Number(singleFilters.warehouse_id)
                            : undefined,
                    }}

                    onFiltersChange={(next) => {
                        setSingleFilters({
                            product_id: next.product_id
                                ? String(next.product_id)
                                : undefined,
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