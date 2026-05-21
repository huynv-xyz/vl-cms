import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listArLedgers } from '@/api/sale/ar-ledger'
import { ArLedgerTable } from './components/ar-ledger-table'
import { Route } from '@/routes/_authenticated/sales/ar-ledgers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ArLedgerPage() {

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
    } = useUrlListFilters(
        search,
        navigate,
        ['source_type'], // multi
        ['from_date', 'to_date', 'customer_id'] // single
    )

    const sourceType = multiFilters.source_type?.[0] ?? ""

    const { data, isLoading, error } = usePaginatedList(
        [
            'ar-ledgers',
            search.page,
            search.size,
            keyword,
            sourceType,
            singleFilters,
        ],
        listArLedgers,
        {
            page: search.page,
            size: search.size,
            keyword,
            source_type: sourceType,
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: singleFilters.customer_id
                ? Number(singleFilters.customer_id)
                : undefined,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Công nợ phải thu"
            description="Sổ chi tiết công nợ phải thu khách hàng (tài khoản 131)."
            data={data}
        >
            {(data) => (
                <ArLedgerTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}

                    filters={{
                        ...singleFilters,
                        source_type: multiFilters.source_type,
                        customer_id: singleFilters.customer_id
                            ? Number(singleFilters.customer_id)
                            : undefined,
                    }}

                    onFiltersChange={(f) => {
                        setSingleFilters({
                            ...f,
                            customer_id: f.customer_id?.toString(),
                        })

                        setMultiFilters({
                            source_type: f.source_type,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}
