import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listWarehouses } from "@/api/warehouse"
import { WarehouseTable } from "./components/warehouse-table"
import { WarehouseDialogs } from "./components/warehouse-dialogs"
import { WarehousesProvider } from "./components/warehouses-provider"
import { CreateWarehouseButton } from "./components/create-warehouse-button"
import { Route } from "@/routes/_authenticated/warehouses"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"

export default function WarehousePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const filters = useUrlListFilters(search, navigate, ["status"] as const)

    const status = filters.getMulti("status")

    const { data, isLoading, error } = usePaginatedList(
        ["warehouse", search.page, search.size, filters.keyword, status],
        listWarehouses,
        {
            page: search.page,
            size: search.size,
            keyword: filters.keyword,
            status: filters.requestFilters.status,
        },
    )

    return (
        <WarehousesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Kho hàng"
                actions={<CreateWarehouseButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <WarehouseTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={filters.keyword}
                            onKeywordChange={filters.setKeyword}
                            status={status}
                            onStatusChange={(value: any) => filters.setMulti("status", value)}
                        />
                        <WarehouseDialogs />
                    </div>
                )}
            </PageSection>
        </WarehousesProvider>
    )
}
