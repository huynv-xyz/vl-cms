import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'

import { PortTable } from './components/port-table'
import { PortDialogs } from './components/port-dialogs'
import { CreatePortButton } from './components/create-port-button'

import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { Route } from '@/routes/_authenticated/purchasing/ports'
import { listPorts } from '@/api/purchasing/port'
import { PortsProvider } from './components/ports-provider'

export default function PortPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
    } = useUrlListFilters(search, navigate, ['keyword'])

    const { data, isLoading, error } = usePaginatedList(
        ['ports', search.page, search.size, keyword],
        listPorts,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <PortsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Cảng'
                actions={<CreatePortButton />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <PortTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <PortDialogs />
                    </div>
                )}
            </PageSection>
        </PortsProvider>
    )
}