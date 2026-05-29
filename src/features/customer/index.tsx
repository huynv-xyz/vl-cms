import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listCustomers } from '@/api/customer'
import { CustomerTable } from './components/customer-table'
import { CustomerDialogs } from './components/customer-dialogs'
import { CustomersProvider } from './components/customers-provider'
import { CreateCustomerButton } from './components/create-customer-button'
import { ImportCustomersButton } from './components/import-customers-button'
import { ImportInvoiceAliasesButton } from './components/import-invoice-aliases-button'
import { Route } from '@/routes/_authenticated/customers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function CustomerPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const { keyword, setKeyword, multiFilters, setMultiFilters, requestFilters } =
        useUrlListFilters(search, navigate, ['type', 'region', 'status'])

    const { data, isLoading, error } = usePaginatedList(
        ['customer'],
        listCustomers,
        {
            page: search.page,
            size: search.size,
            keyword,
            type: requestFilters.type,
            region: requestFilters.region,
            status: requestFilters.status,
        },
    )

    return (
        <CustomersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Khách hàng'
                actions={
                    <div className="flex flex-wrap items-center gap-2">
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
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            filters={{
                                types: multiFilters.type,
                                regions: multiFilters.region,
                                statuses: multiFilters.status,
                            }}
                            onFiltersChange={(next) =>
                                setMultiFilters({
                                    type: next.types,
                                    region: next.regions,
                                    status: next.statuses,
                                })
                            }
                        />
                        <CustomerDialogs />
                    </div>
                )}
            </PageSection>
        </CustomersProvider>
    )
}
