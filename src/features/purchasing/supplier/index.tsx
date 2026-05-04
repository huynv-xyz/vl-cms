import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listSuppliers } from '@/api/purchasing/supplier'
import { SupplierTable } from './components/supplier-table'
import { SupplierDialogs } from './components/supplier-dialogs'
import { SuppliersProvider } from './components/suppliers-provider'
import { CreateSupplierButton } from './components/create-supplier-button'
import { Route } from '@/routes/_authenticated/purchasing/suppliers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function SupplierPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
    } = useUrlListFilters(search, navigate, ['keyword'])

    const { data, isLoading, error } = usePaginatedList(
        ['suppliers', search.page, search.size, keyword],
        listSuppliers,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <SuppliersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Nhà cung cấp'
                actions={<CreateSupplierButton />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <SupplierTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />
                        <SupplierDialogs />
                    </div>
                )}
            </PageSection>
        </SuppliersProvider>
    )
}