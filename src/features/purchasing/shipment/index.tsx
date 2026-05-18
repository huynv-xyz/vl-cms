import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { Route } from "@/routes/_authenticated/purchasing/shipments"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { ShipmentsProvider } from "./components/shipments-provider"
import { listShipmentItems } from "@/api/purchasing/shipment_items"
import { ShipmentItemTableV2 } from "../shipment-item/components/shipment-item-table-v2"

export default function ShipmentPage() {
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
        ["status", "supplier_ids", "product_ids", "port_ids"],
        ["eta_from", "eta_to"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "shipment-items",
            search.page,
            search.size,
            keyword,

            multiFilters.status,
            multiFilters.supplier_ids,
            multiFilters.product_ids,
            multiFilters.port_ids,

            singleFilters.eta_from,
            singleFilters.eta_to,
        ],
        listShipmentItems,
        {
            page: search.page,
            size: search.size,
            keyword,

            status: requestFilters.status,

            eta_from: requestFilters.eta_from,
            eta_to: requestFilters.eta_to,

            supplier_ids: requestFilters.supplier_ids,
            product_ids: requestFilters.product_ids,
            port_ids: requestFilters.port_ids,
        }
    )

    return (
        <ShipmentsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Lịch hàng về"
                data={data}
            >
                {(data) => (
                    <ShipmentItemTableV2
                        data={data.items}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}

                        keyword={keyword}
                        onKeywordChange={setKeyword}

                        filters={{

                            status: multiFilters.status,

                            eta_from: singleFilters.eta_from,

                            eta_to: singleFilters.eta_to,

                            supplier_ids: multiFilters.supplier_ids,
                            product_ids: multiFilters.product_ids,
                            port_ids: multiFilters.port_ids,

                        }}

                        onFiltersChange={(next) => {
                            setPagination((p) => ({
                                ...p,
                                pageIndex: 0,
                            }))

                            setMultiFilters({

                                status: next.status,
                                supplier_ids: next.supplier_ids,
                                product_ids: next.product_ids,
                                port_ids: next.port_ids,

                            })

                            setSingleFilters({

                                eta_from: next.eta_from,

                                eta_to: next.eta_to,

                            })
                        }}
                    />
                )}
            </PageSection>
        </ShipmentsProvider>
    )
}
