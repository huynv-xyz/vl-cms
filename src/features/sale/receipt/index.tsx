import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { ReceiptTable } from './components/receipt-table'
import { ReceiptDialogs } from './components/receipt-dialogs'
import { ReceiptsProvider } from './components/receipts-provider'
import { CreateReceiptButton } from './components/create-receipt-button'
import { Route } from '@/routes/_authenticated/sales/receipts'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { listReceipts } from '@/api/sale/receipt'

export default function ReceiptPage() {

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
        ['status', 'method'],
        ['customer_id', 'order_id', 'from_date', 'to_date']
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'receipts',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            multiFilters.method,
            singleFilters.customer_id,
            singleFilters.order_id,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listReceipts,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,
            method: requestFilters.method,

            customer_id: requestFilters.customer_id
                ? Number(requestFilters.customer_id)
                : undefined,

            order_id: requestFilters.order_id
                ? Number(requestFilters.order_id)
                : undefined,

            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
        },
    )

    return (
        <ReceiptsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Phiếu thu"
                actions={<CreateReceiptButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">

                        <ReceiptTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={setKeyword}

                            filters={{
                                status: multiFilters.status,
                                method: multiFilters.method,

                                customer_id: singleFilters.customer_id
                                    ? Number(singleFilters.customer_id)
                                    : undefined,

                                order_id: singleFilters.order_id
                                    ? Number(singleFilters.order_id)
                                    : undefined,

                                from_date: singleFilters.from_date,
                                to_date: singleFilters.to_date,
                            }}

                            onFiltersChange={(next) => {
                                setMultiFilters({
                                    status: next.status,
                                    method: next.method,
                                })

                                setSingleFilters({
                                    customer_id: next.customer_id
                                        ? String(next.customer_id)
                                        : undefined,

                                    order_id: next.order_id
                                        ? String(next.order_id)
                                        : undefined,

                                    from_date: next.from_date,
                                    to_date: next.to_date,
                                })
                            }}
                        />

                        <ReceiptDialogs />
                    </div>
                )}
            </PageSection>
        </ReceiptsProvider>
    )
}