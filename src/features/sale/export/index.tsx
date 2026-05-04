import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listExports } from '@/api/sale/export'
import { ExportTable } from './components/export-table'
import { Route } from '@/routes/_authenticated/sales/exports'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ExportPage() {

    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
    } = useUrlListFilters(search, navigate, ['keyword', 'status'])

    const status = multiFilters.status?.[0] ?? ""

    const setStatus = (v: string) => {
        setMultiFilters({ status: v ? [v] : [] })
    }

    const { data, isLoading, error } = usePaginatedList(
        ['exports', search.page, search.size, keyword, status],
        listExports,
        {
            page: search.page,
            size: search.size,
            keyword,
            status,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Phiếu xuất"
            data={data}
        >
            {(data) => (
                <ExportTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    status={status}
                    onStatusChange={setStatus}
                />
            )}
        </PageSection>
    )
}