import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { InboundTable } from "./components/inbound-table"
import { InboundDialogs } from "./components/inbound-dialogs"
import { CreateInboundButton } from "./components/create-inbound-button"
import { Route } from '@/routes/_authenticated/inventory/inbounds'
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { listInventoryInbounds } from "@/api/inventory/inbound"
import { InventoryInboundsProvider } from "./components/inbounds-provider"

export default function InventoryInboundPage() {
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
        ["source_type"],
        ["product_id", "warehouse_id", "from_date", "to_date"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-inbounds",
            search.page,
            search.size,
            keyword,
            multiFilters.source_type,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listInventoryInbounds,
        {
            page: search.page,
            size: search.size,
            keyword,
            source_type: requestFilters.source_type,

            product_id: requestFilters.product_id
                ? Number(requestFilters.product_id)
                : undefined,

            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,

            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
        }
    )

    return (
        <InventoryInboundsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Nhập hàng"
                actions={<CreateInboundButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <InboundTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            filters={{
                                source_type: multiFilters.source_type,
                                product_id: singleFilters.product_id
                                    ? Number(singleFilters.product_id)
                                    : undefined,
                                warehouse_id: singleFilters.warehouse_id
                                    ? Number(singleFilters.warehouse_id)
                                    : undefined,
                                from_date: singleFilters.from_date,
                                to_date: singleFilters.to_date,
                            }}
                            onFiltersChange={(next: any) => {
                                setMultiFilters({
                                    source_type: next.source_type,
                                })

                                setSingleFilters({
                                    product_id: next.product_id
                                        ? String(next.product_id)
                                        : undefined,

                                    warehouse_id: next.warehouse_id
                                        ? String(next.warehouse_id)
                                        : undefined,

                                    from_date: next.from_date,
                                    to_date: next.to_date,
                                })
                            }}
                        />

                        <InboundDialogs />
                    </div>
                )}
            </PageSection>
        </InventoryInboundsProvider>
    )
}