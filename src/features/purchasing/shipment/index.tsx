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
        ["status"],
        ["eta_from", "eta_to", "supplier_id", "product_id", "port_id"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "shipment-items",
            search.page,
            search.size,
            keyword,

            multiFilters.status,

            singleFilters.eta_from,
            singleFilters.eta_to,
            singleFilters.supplier_id,
            singleFilters.product_id,
            singleFilters.port_id,
        ],
        listShipmentItems,
        {
            page: search.page,
            size: search.size,
            keyword,

            status: requestFilters.status,

            eta_from: requestFilters.eta_from,
            eta_to: requestFilters.eta_to,

            supplier_id: requestFilters.supplier_id
                ? Number(requestFilters.supplier_id)
                : undefined,

            product_id: requestFilters.product_id
                ? Number(requestFilters.product_id)
                : undefined,

            port_id: requestFilters.port_id
                ? Number(requestFilters.port_id)
                : undefined,
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

                            supplier_id: singleFilters.supplier_id

                                ? Number(singleFilters.supplier_id)

                                : undefined,

                            product_id: singleFilters.product_id

                                ? Number(singleFilters.product_id)

                                : undefined,

                            port_id: singleFilters.port_id

                                ? Number(singleFilters.port_id)

                                : undefined,

                        }}

                        onFiltersChange={(next) => {
                            setPagination((p: any) => ({
                                ...p,
                                pageIndex: 0,
                            }))

                            setMultiFilters({

                                status: next.status,

                            })

                            setSingleFilters({

                                eta_from: next.eta_from,

                                eta_to: next.eta_to,

                                supplier_id: next.supplier_id

                                    ? String(next.supplier_id)

                                    : undefined,

                                product_id: next.product_id

                                    ? String(next.product_id)

                                    : undefined,

                                port_id: next.port_id

                                    ? String(next.port_id)

                                    : undefined,

                            })
                        }}
                    />
                )}
            </PageSection>
        </ShipmentsProvider>
    )
}