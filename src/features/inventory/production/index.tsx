import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { Route } from "@/routes/_authenticated/inventory/productions"
import { listProductions } from "@/api/inventory/production"
import { ProductionsProvider } from "./components/productions-provider"
import { ProductionTable } from "./components/production-table"
import { ProductionDialogs } from "./components/production-dialogs"
import { CreateProductionButton } from "./components/create-production-button"

export default function ProductionPage() {
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
        ["product_id", "warehouse_id", "status", "from_date", "to_date"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "productions",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.status,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listProductions,
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
            status: requestFilters.status,
            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
        }
    )

    return (
        <ProductionsProvider>
            <PageSection
                title="Lệnh sản xuất"
                isLoading={isLoading}
                error={error}
                actions={<CreateProductionButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <ProductionTable
                            data={data.items || []}
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
                                status: singleFilters.status,
                                from_date: singleFilters.from_date,
                                to_date: singleFilters.to_date,
                            }}

                            onFiltersChange={(next) =>
                                setSingleFilters({
                                    product_id: next.product_id
                                        ? String(next.product_id)
                                        : undefined,
                                    warehouse_id: next.warehouse_id
                                        ? String(next.warehouse_id)
                                        : undefined,
                                    status: next.status,
                                    from_date: next.from_date,
                                    to_date: next.to_date,
                                })
                            }
                        />

                        <ProductionDialogs />
                    </div>
                )}
            </PageSection>
        </ProductionsProvider>
    )
}