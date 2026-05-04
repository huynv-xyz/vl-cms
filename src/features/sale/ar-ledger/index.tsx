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
    } = useUrlListFilters(search, navigate, ['doc_type'])

    const docType = multiFilters.doc_type?.[0] ?? ""

    const setDocType = (v: string) => {
        setMultiFilters({ doc_type: v ? [v] : [] })
    }

    const { data, isLoading, error } = usePaginatedList(
        ['ar-ledgers', search.page, search.size, keyword, docType],
        listArLedgers,
        {
            page: search.page,
            size: search.size,
            doc_type: docType,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Công nợ"
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
                    docType={docType}
                    onDocTypeChange={setDocType}
                />
            )}
        </PageSection>
    )
}