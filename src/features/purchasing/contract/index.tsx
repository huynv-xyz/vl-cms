import { useQuery } from '@tanstack/react-query'
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listContracts } from '@/api/purchasing/contract'
import { ContractTable } from './components/contract-table'
import { ContractDialogs } from './components/contract-dialogs'
import { ContractsProvider } from './components/contracts-provider'
import { CreateContractButton } from './components/create-contract-button'
import { Route } from '@/routes/_authenticated/purchasing/contracts'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

// Size đủ lớn để gom toàn bộ HĐ thoả filter cho summary. Vlife có vài trăm HĐ/năm.
const AGGREGATE_PAGE_SIZE = 10000

export default function ContractPage() {
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
        ['status', 'product_ids', 'supplier_ids', 'nation_ids'],
        ['signed_date_from', 'signed_date_to']
    )
    const filterParams = {
        keyword,
        status: requestFilters.status,
        product_ids: requestFilters.product_ids,
        supplier_ids: requestFilters.supplier_ids,
        nation_ids: requestFilters.nation_ids,
        signed_date_from: requestFilters.signed_date_from,
        signed_date_to: requestFilters.signed_date_to,
    }

    // Page query — phục vụ table
    const { data, isLoading, error } = usePaginatedList(
        [
            'contracts',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            multiFilters.product_ids,
            multiFilters.supplier_ids,
            multiFilters.nation_ids,
            singleFilters.signed_date_from,
            singleFilters.signed_date_to,
        ],
        listContracts,
        {
            page: search.page,
            size: search.size,
            ...filterParams,
        },
    )

    // Aggregate query — phục vụ Summary cards + footer Tổng tiền (lấy hết HĐ thoả filter)
    const aggregateQuery = useQuery({
        queryKey: ['contracts', 'aggregate', filterParams],
        queryFn: () =>
            listContracts({
                page: 1,
                size: AGGREGATE_PAGE_SIZE,
                ...filterParams,
            }),
        staleTime: 60_000,
    })

    return (
        <ContractsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Hợp đồng"
                actions={<CreateContractButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">

                        <ContractTable
                            data={data.items}
                            allItems={aggregateQuery.data?.items ?? []}
                            totalCount={data.total}
                            aggregateLoading={aggregateQuery.isLoading}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={(value) => {
                                setPagination((p) => ({
                                    ...p,
                                    pageIndex: 0,
                                }))
                                setKeyword(value)
                            }}

                            filters={{
                                status: multiFilters.status,
                                product_ids: multiFilters.product_ids,
                                supplier_ids: multiFilters.supplier_ids,
                                nation_ids: multiFilters.nation_ids,
                                signed_date_from: singleFilters.signed_date_from,
                                signed_date_to: singleFilters.signed_date_to,
                            }}

                            onFiltersChange={(next) => {
                                setPagination((p) => ({
                                    ...p,
                                    pageIndex: 0,
                                }))

                                setMultiFilters({
                                    status: next.status,
                                    product_ids: next.product_ids,
                                    supplier_ids: next.supplier_ids,
                                    nation_ids: next.nation_ids,
                                })

                                setSingleFilters({
                                    signed_date_from: next.signed_date_from,
                                    signed_date_to: next.signed_date_to,
                                })
                            }}
                        />

                        <ContractDialogs />
                    </div>
                )}
            </PageSection>
        </ContractsProvider>
    )
}
