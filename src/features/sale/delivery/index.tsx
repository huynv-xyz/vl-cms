import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { DeliveryTable } from './components/delivery-table'
import { DeliveryDialogs } from './components/delivery-dialogs'
import { CreateDeliveryButton } from './components/create-delivery-button'
import { Route } from '@/routes/_authenticated/sales/deliveries'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { listDeliveries } from '@/api/sale/delivery'
import { DeliveriesProvider } from './components/deliverys-provider'

export default function DeliveryPage() {
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
        ['status'],
        ['order_id', 'warehouse_id', 'company_id', 'from_date', 'to_date']
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'deliveries',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            singleFilters.order_id,
            singleFilters.warehouse_id,
            singleFilters.company_id,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listDeliveries,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,

            order_id: requestFilters.order_id
                ? Number(requestFilters.order_id)
                : undefined,

            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,

            company_id: requestFilters.company_id
                ? Number(requestFilters.company_id)
                : undefined,

            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
        },
    )

    return (
        <DeliveriesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Giao hàng"
                actions={<CreateDeliveryButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">

                        <DeliveryTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={setKeyword}

                            filters={{
                                status: multiFilters.status,
                                order_id: singleFilters.order_id
                                    ? Number(singleFilters.order_id)
                                    : undefined,
                                warehouse_id: singleFilters.warehouse_id
                                    ? Number(singleFilters.warehouse_id)
                                    : undefined,
                                company_id: singleFilters.company_id
                                    ? Number(singleFilters.company_id)
                                    : undefined,
                                from_date: singleFilters.from_date,
                                to_date: singleFilters.to_date,
                            }}

                            onFiltersChange={(next) => {
                                setMultiFilters({
                                    status: next.status,
                                })

                                setSingleFilters({
                                    order_id: next.order_id
                                        ? String(next.order_id)
                                        : undefined,

                                    warehouse_id: next.warehouse_id
                                        ? String(next.warehouse_id)
                                        : undefined,

                                    company_id: next.company_id
                                        ? String(next.company_id)
                                        : undefined,

                                    from_date: next.from_date,
                                    to_date: next.to_date,
                                })
                            }}
                        />

                        <DeliveryDialogs />
                    </div>
                )}
            </PageSection>
        </DeliveriesProvider>
    )
}