import { ShoppingCart } from 'lucide-react'
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { OrderTable } from './components/order-table'
import { OrderDialogs } from './components/order-dialogs'
import { OrdersProvider } from './components/orders-provider'
import { CreateOrderButton } from './components/create-order-button'
import { Route } from '@/routes/_authenticated/sales/orders'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { listOrders } from '@/api/sale/order'

export default function OrderPage() {
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
        ['customer_id', 'employee_id', 'from_date', 'to_date']
    )

    const orderListParams = {
        keyword,
        status: requestFilters.status,

        customer_id: requestFilters.customer_id
            ? Number(requestFilters.customer_id)
            : undefined,

        employee_id: requestFilters.employee_id
            ? Number(requestFilters.employee_id)
            : undefined,

        from_date: requestFilters.from_date,
        to_date: requestFilters.to_date,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            'orders',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            singleFilters.customer_id,
            singleFilters.employee_id,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listOrders,
        orderListParams,
    )

    return (
        <OrdersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Đơn hàng"
                description="Danh sách đơn bán, theo dõi trạng thái giao hàng và tổng giá trị bán ra."
                icon={ShoppingCart}
                actions={<CreateOrderButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">

                        <OrderTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            exportFilters={orderListParams}

                            filters={{
                                status: multiFilters.status,
                                customer_id: singleFilters.customer_id
                                    ? Number(singleFilters.customer_id)
                                    : undefined,
                                employee_id: singleFilters.employee_id
                                    ? Number(singleFilters.employee_id)
                                    : undefined,
                                from_date: singleFilters.from_date,
                                to_date: singleFilters.to_date,
                            }}

                            onFiltersChange={(next) => {
                                setMultiFilters({
                                    status: next.status,
                                })

                                setSingleFilters({
                                    customer_id: next.customer_id
                                        ? String(next.customer_id)
                                        : undefined,

                                    employee_id: next.employee_id
                                        ? String(next.employee_id)
                                        : undefined,

                                    from_date: next.from_date,
                                    to_date: next.to_date,
                                })
                            }}
                        />

                        <OrderDialogs />
                    </div>
                )}
            </PageSection>
        </OrdersProvider>
    )
}
