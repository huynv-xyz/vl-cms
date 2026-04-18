import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listProvinces } from '@/api/province'
import { ProvinceTable } from './components/province-table'
import { ProvinceDialogs } from './components/province-dialogs'
import { ProvincesProvider } from './components/provinces-provider'
import { CreateProvinceButton } from './components/create-province-button'
import { Route } from '@/routes/_authenticated/provinces'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ProvincePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const { data, isLoading, error } = usePaginatedList(
        ['province', search.page, search.size, keyword],
        listProvinces,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <ProvincesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Khu vực'
                actions={<CreateProvinceButton />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <ProvinceTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />
                        <ProvinceDialogs />
                    </div>
                )}
            </PageSection>
        </ProvincesProvider>
    )
}