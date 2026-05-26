import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { Route } from "@/routes/_authenticated/purchasing/shipments"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { ShipmentsProvider } from "./components/shipments-provider"
import { listShipmentItems } from "@/api/purchasing/shipment_items"
import { ShipmentItemTableV2 } from "../shipment-item/components/shipment-item-table-v2"
import { ShipmentScheduleExportButton } from "./components/shipment-schedule-export-button"

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
        ["status", "product_ids", "port_ids"],
        ["date_type", "date_from", "date_to"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "shipment-items",
            search.page,
            search.size,
            keyword,

            multiFilters.status,
            multiFilters.product_ids,
            multiFilters.port_ids,

            singleFilters.date_type,
            singleFilters.date_from,
            singleFilters.date_to,
        ],
        listShipmentItems,
        {
            page: search.page,
            size: search.size,
            keyword,

            status: requestFilters.status,

            date_type: requestFilters.date_type,
            date_from: requestFilters.date_from,
            date_to: requestFilters.date_to,

            product_ids: requestFilters.product_ids,
            port_ids: requestFilters.port_ids,
        },
        20,
        true,
    )

    const exportParams = {
        keyword,
        status: requestFilters.status,
        date_type: requestFilters.date_type,
        date_from: requestFilters.date_from,
        date_to: requestFilters.date_to,
        product_ids: requestFilters.product_ids,
        port_ids: requestFilters.port_ids,
    }

    return (
        <ShipmentsProvider>
            <PageSection
                isLoading={isLoading && !data}
                error={error}
                title="Lịch hàng về"
                data={data}
                actions={<ShipmentScheduleExportButton params={exportParams} />}
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

                            date_type: singleFilters.date_type as "SIGNED_DATE" | "ETD" | "ETA" | undefined,

                            date_from: singleFilters.date_from,

                            date_to: singleFilters.date_to,

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
                                product_ids: next.product_ids,
                                port_ids: next.port_ids,

                            })

                            setSingleFilters({

                                date_type: next.date_type,

                                date_from: next.date_from,

                                date_to: next.date_to,

                            })
                        }}
                    />
                )}
            </PageSection>
        </ShipmentsProvider>
    )
}
