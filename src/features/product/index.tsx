import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listAllProducts } from '@/api/product'
import { ProductTable } from './components/product-table'
import { ProductDialogs } from './components/product-dialogs'
import { ProductsProvider } from './components/products-provider'
import { CreateProductButton } from './components/create-product-button'
import { ExportProductsButton } from './components/export-products-button'
import { ImportProductButton } from './components/import-product-button'
import { Route } from '@/routes/_authenticated/products'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ProductPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        [],
        ["status", "nature", "group_code", "default_warehouse_id", "inventory_account_code"]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'product',
            search.page,
            search.size,
            keyword,
            singleFilters.status,
            singleFilters.nature,
            singleFilters.group_code,
            singleFilters.default_warehouse_id,
            singleFilters.inventory_account_code,
        ],
        listAllProducts,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,
            nature: requestFilters.nature,
            group_code: requestFilters.group_code,
            default_warehouse_id: requestFilters.default_warehouse_id
                ? Number(requestFilters.default_warehouse_id)
                : undefined,
            inventory_account_code: requestFilters.inventory_account_code,
        },
    )

    return (
        <ProductsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Sản phẩm"
                description="Quản lý danh mục hàng hóa, VTHH, kho ngầm định và tài khoản kho."
                actions={
                    <div className="flex items-center gap-2">
                        <ExportProductsButton
                            keyword={keyword}
                            filters={{
                                status: requestFilters.status,
                                nature: requestFilters.nature,
                                group_code: requestFilters.group_code,
                                default_warehouse_id: requestFilters.default_warehouse_id
                                    ? Number(requestFilters.default_warehouse_id)
                                    : undefined,
                                inventory_account_code: requestFilters.inventory_account_code,
                            }}
                        />
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
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            filters={{
                                status: singleFilters.status,
                                nature: singleFilters.nature,
                                group_code: singleFilters.group_code,
                                default_warehouse_id: singleFilters.default_warehouse_id
                                    ? Number(singleFilters.default_warehouse_id)
                                    : undefined,
                                inventory_account_code: singleFilters.inventory_account_code,
                            }}
                            onFiltersChange={(next) =>
                                setSingleFilters({
                                    status: next.status,
                                    nature: next.nature,
                                    group_code: next.group_code,
                                    default_warehouse_id: next.default_warehouse_id
                                        ? String(next.default_warehouse_id)
                                        : undefined,
                                    inventory_account_code: next.inventory_account_code,
                                })
                            }
                        />
                        <ProductDialogs />
                    </div>
                )}
            </PageSection>
        </ProductsProvider>
    )
}
