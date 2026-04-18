export function pageTemplate({ Entity, entity }) {
    return `
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { list${Entity}s } from '@/api/${entity}'
import { ${Entity}Table } from './components/${entity}-table'
import { ${Entity}Dialogs } from './components/${entity}-dialogs'
import { ${Entity}sProvider } from './components/${entity}s-provider'
import { Create${Entity}Button } from './components/create-${entity}-button'
import { Route } from '@/routes/_authenticated/${entity}'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ${Entity}Page() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        status,
        setStatus,
    } = useUrlListFilters(search, navigate, ['keyword', 'status'])

    const { data, isLoading, error } = usePaginatedList(
        ['${entity}', search.page, search.size, keyword, status],
        list${Entity}s,
        {
            page: search.page,
            size: search.size,
            keyword,
            status,
        },
    )

    return (
        <${Entity}sProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='${Entity}'
                actions={<Create${Entity}Button />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <${Entity}Table
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            status={status}
                            onStatusChange={setStatus}
                        />
                        <${Entity}Dialogs />
                    </div>
                )}
            </PageSection>
        </${Entity}sProvider>
    )
}
`
}