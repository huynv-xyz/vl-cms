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
        ['status'],
        ['product_id', 'supplier_id', 'signed_date_from', 'signed_date_to']
    )
    const { data, isLoading, error } = usePaginatedList(
        [
            'contracts',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            singleFilters.product_id,
            singleFilters.supplier_id,
            singleFilters.signed_date_from,
            singleFilters.signed_date_to,
        ],
        listContracts,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,
            product_id: requestFilters.product_id,
            supplier_id: requestFilters.supplier_id,
            signed_date_from: requestFilters.signed_date_from,
            signed_date_to: requestFilters.signed_date_to,
        },
    )

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
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={setKeyword}

                            filters={{
                                status: multiFilters.status,
                                product_id: singleFilters.product_id
                                    ? Number(singleFilters.product_id)
                                    : undefined,
                                supplier_id: singleFilters.supplier_id
                                    ? Number(singleFilters.supplier_id)
                                    : undefined,
                                signed_date_from: singleFilters.signed_date_from,
                                signed_date_to: singleFilters.signed_date_to,
                            }}

                            onFiltersChange={(next) => {
                                setMultiFilters({
                                    status: next.status,
                                })

                                setSingleFilters({
                                    product_id: next.product_id
                                        ? String(next.product_id)
                                        : undefined,

                                    supplier_id: next.supplier_id
                                        ? String(next.supplier_id)
                                        : undefined,

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