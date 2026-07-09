import { useQuery } from '@tanstack/react-query'
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listCustomers, type CustomerListParams } from '@/api/customer'
import { CustomerTable } from './components/customer-table'
import { CustomerDialogs } from './components/customer-dialogs'
import { CustomersProvider } from './components/customers-provider'
import { CreateCustomerButton } from './components/create-customer-button'
import { ImportCustomersButton } from './components/import-customers-button'
import { ImportInvoiceAliasesButton } from './components/import-invoice-aliases-button'
import { ExportCustomersButton } from './components/export-customers-button'
import { Route } from '@/routes/_authenticated/customers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function CustomerPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(search, navigate, [], ['type', 'region', 'status'])

    const requestParams = {
        keyword,
        type: requestFilters.type,
        region: requestFilters.region,
        status: requestFilters.status,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            'customer',
            search.page,
            search.size,
            keyword,
            singleFilters.type,
            singleFilters.region,
            singleFilters.status,
        ],
        listCustomers,
        {
            page: search.page,
            size: search.size,
            ...requestParams,
        },
    )

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: [
            'customer-summary',
            keyword,
            singleFilters.type,
            singleFilters.region,
            singleFilters.status,
        ],
        queryFn: () => fetchCustomerSummary(requestParams),
    })

    return (
        <CustomersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Khách hàng'
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <ExportCustomersButton
                            keyword={keyword}
                            filters={{
                                type: requestFilters.type,
                                region: requestFilters.region,
                                status: requestFilters.status,
                            }}
                        />
                        <ImportCustomersButton />
                        <ImportInvoiceAliasesButton />
                        <CreateCustomerButton />
                    </div>
                }
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <CustomerTable
                            data={data.items}
                            summary={summary}
                            isSummaryLoading={isSummaryLoading}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={(value) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                setKeyword(value)
                            }}
                            filters={{
                                type: singleFilters.type,
                                region: singleFilters.region,
                                status: singleFilters.status,
                            }}
                            onFiltersChange={(next) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                setSingleFilters({
                                    type: next.type,
                                    region: next.region,
                                    status: next.status,
                                })
                            }}
                        />
                        <CustomerDialogs />
                    </div>
                )}
            </PageSection>
        </CustomersProvider>
    )
}

async function fetchCustomerSummary(filters: Omit<CustomerListParams, 'page' | 'size'>) {
    const baseParams = { ...filters, page: 1, size: 1 }
    const [totalRes, activeRes, b2bRes, b2cRes] = await Promise.all([
        listCustomers(baseParams),
        filters.status && filters.status !== '1'
            ? Promise.resolve({ total: 0 })
            : listCustomers({ ...baseParams, status: '1' }),
        filters.type && filters.type !== 'B2B'
            ? Promise.resolve({ total: 0 })
            : listCustomers({ ...baseParams, type: 'B2B' }),
        filters.type && filters.type !== 'B2C'
            ? Promise.resolve({ total: 0 })
            : listCustomers({ ...baseParams, type: 'B2C' }),
    ])

    return {
        total: totalRes.total ?? 0,
        active: activeRes.total ?? 0,
        b2b: b2bRes.total ?? 0,
        b2c: b2cRes.total ?? 0,
    }
}
