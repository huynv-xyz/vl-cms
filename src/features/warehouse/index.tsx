import { useQuery } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listWarehouses, type WarehouseListParams } from "@/api/warehouse"
import { WarehouseTable } from "./components/warehouse-table"
import { WarehouseDialogs } from "./components/warehouse-dialogs"
import { WarehousesProvider } from "./components/warehouses-provider"
import { CreateWarehouseButton } from "./components/create-warehouse-button"
import { Route } from "@/routes/_authenticated/warehouses"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import type { Warehouse } from "./data/schema"

const SUMMARY_PAGE_SIZE = 1000

export default function WarehousePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const filters = useUrlListFilters(
        search,
        navigate,
        ["status", "physical_warehouse_id"] as const,
        ["sales_inventory_visible"] as const,
    )

    const status = filters.getMulti("status")
    const physicalWarehouseIds = filters.getMulti("physical_warehouse_id")
    const salesInventoryVisible = filters.getSingle("sales_inventory_visible")

    const requestParams = {
        keyword: filters.keyword,
        status: filters.requestFilters.status,
        physical_warehouse_id: filters.requestFilters.physical_warehouse_id,
        sales_inventory_visible: filters.requestFilters.sales_inventory_visible,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "warehouse",
            search.page,
            search.size,
            filters.keyword,
            status,
            physicalWarehouseIds,
            salesInventoryVisible,
        ],
        listWarehouses,
        {
            page: search.page,
            size: search.size,
            ...requestParams,
        },
    )

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: [
            "warehouse-summary",
            filters.keyword,
            status,
            physicalWarehouseIds,
            salesInventoryVisible,
        ],
        queryFn: () => fetchWarehouseSummary(requestParams),
    })

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
                            summary={summary}
                            isSummaryLoading={isSummaryLoading}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={filters.keyword}
                            onKeywordChange={(value) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                filters.setKeyword(value)
                            }}
                            filters={{
                                status,
                                physical_warehouse_ids: physicalWarehouseIds,
                                sales_inventory_visible: salesInventoryVisible,
                            }}
                            onFiltersChange={(next) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                navigate({
                                    search: (prev) => ({
                                        ...prev,
                                        page: 1,
                                        status: next.status?.length ? next.status.join(",") : undefined,
                                        physical_warehouse_id: next.physical_warehouse_ids?.length
                                            ? next.physical_warehouse_ids.join(",")
                                            : undefined,
                                        sales_inventory_visible: next.sales_inventory_visible || undefined,
                                    }),
                                    replace: true,
                                })
                            }}
                        />
                        <WarehouseDialogs />
                    </div>
                )}
            </PageSection>
        </WarehousesProvider>
    )
}

async function fetchWarehouseSummary(filters: Omit<WarehouseListParams, "page" | "size">) {
    const all: Warehouse[] = []
    let page = 1
    let total = 0
    let totalPage = 1

    do {
        const res = await listWarehouses({
            ...filters,
            page,
            size: SUMMARY_PAGE_SIZE,
        })
        all.push(...(res.items ?? []))
        total = res.total ?? all.length
        totalPage = res.total_page ?? page
        page += 1
    } while (page <= totalPage)

    return {
        total,
        active: all.filter((x) => x.status === "ACTIVE").length,
        salesVisible: all.filter((x) => x.visible_in_sales_inventory_summary !== false).length,
        physicalWarehouses: new Set(all.map((x) => x.physical_warehouse_id).filter(Boolean)).size,
    }
}
