import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listProducts } from '@/api/product'
import { ProductTable } from './components/product-table'
import { ProductDialogs } from './components/product-dialogs'
import { ProductsProvider } from './components/products-provider'
import { CreateProductButton } from './components/create-product-button'
import { ImportProductButton } from './components/import-product-button'
import { Route } from '@/routes/_authenticated/products'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ProductPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const filters = useUrlListFilters(search, navigate, ['status'] as const)

    const status = filters.getMulti('status')

    const { data, isLoading, error } = usePaginatedList(
        ['product', search.page, search.size, filters.keyword, status],
        listProducts,
        {
            page: search.page,
            size: search.size,
            keyword: filters.keyword,
            status: filters.requestFilters.status,
        },
    )

    return (
        <ProductsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Sản phẩm"
                actions={
                    <div className="flex items-center gap-2">
                        <ImportProductButton />
                        <CreateProductButton />
                    </div>
                }
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <ProductTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={filters.keyword}
                            onKeywordChange={filters.setKeyword}
                            status={status}
                            onStatusChange={(value: any) => filters.setMulti('status', value)}
                        />
                        <ProductDialogs />
                    </div>
                )}
            </PageSection>
        </ProductsProvider>
    )
}