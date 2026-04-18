import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listRegions } from '@/api/region'
import { RegionTable } from './components/region-table'
import { RegionDialogs } from './components/region-dialogs'
import { RegionsProvider } from './components/regions-provider'
import { CreateRegionButton } from './components/create-region-button'
import { Route } from '@/routes/_authenticated/regions'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function RegionPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const { data, isLoading, error } = usePaginatedList(
        ['region', search.page, search.size, keyword],
        listRegions,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <RegionsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Vùng'
                actions={<CreateRegionButton />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <RegionTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />
                        <RegionDialogs />
                    </div>
                )}
            </PageSection>
        </RegionsProvider>
    )
}