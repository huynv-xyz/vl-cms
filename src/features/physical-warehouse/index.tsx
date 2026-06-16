import { listPhysicalWarehouses } from "@/api/physical-warehouse"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/physical-warehouses"
import { CreatePhysicalWarehouseButton } from "./components/create-physical-warehouse-button"
import { PhysicalWarehouseDialogs } from "./components/physical-warehouse-dialogs"
import { PhysicalWarehouseTable } from "./components/physical-warehouse-table"
import { PhysicalWarehousesProvider } from "./components/physical-warehouses-provider"

export default function PhysicalWarehousePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const filters = useUrlListFilters(search, navigate, ["status"] as const)
    const status = filters.getMulti("status")

    const { data, isLoading, error } = usePaginatedList(
        [
            "physical-warehouse",
            search.page,
            search.size,
            filters.keyword,
            status,
        ],
        listPhysicalWarehouses,
        {
            page: search.page,
            size: search.size,
            keyword: filters.keyword,
            status: filters.requestFilters.status,
        },
    )

    return (
        <PhysicalWarehousesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Địa điểm kho"
                actions={<CreatePhysicalWarehouseButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <PhysicalWarehouseTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={filters.keyword}
                            onKeywordChange={filters.setKeyword}
                            status={status}
                            onStatusChange={(value: any) =>
                                filters.setMulti("status", value)
                            }
                        />
                        <PhysicalWarehouseDialogs />
                    </div>
                )}
            </PageSection>
        </PhysicalWarehousesProvider>
    )
}
