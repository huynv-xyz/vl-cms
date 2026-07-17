import { useQuery } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listAllProducts, type ProductListParams } from "@/api/product"
import { ProductTable } from "./components/product-table"
import { ProductDialogs } from "./components/product-dialogs"
import { ProductsProvider } from "./components/products-provider"
import { CreateProductButton } from "./components/create-product-button"
import { ExportProductsButton } from "./components/export-products-button"
import { ImportProductButton } from "./components/import-product-button"
import { Route } from "@/routes/_authenticated/products"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import type { Product } from "./data/schema"

const SUMMARY_PAGE_SIZE = 1000

export default function ProductPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        multiFilters,
        setMultiFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ["nature"],
        ["status", "group_code", "default_warehouse_id", "inventory_account_code"]
    )

    const requestParams = {
        keyword,
        status: requestFilters.status,
        nature: requestFilters.nature,
        group_code: requestFilters.group_code,
        default_warehouse_id: requestFilters.default_warehouse_id
            ? Number(requestFilters.default_warehouse_id)
            : undefined,
        inventory_account_code: requestFilters.inventory_account_code,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "product",
            search.page,
            search.size,
            keyword,
            singleFilters.status,
            multiFilters.nature,
            singleFilters.group_code,
            singleFilters.default_warehouse_id,
            singleFilters.inventory_account_code,
        ],
        listAllProducts,
        {
            page: search.page,
            size: search.size,
            ...requestParams,
        },
    )

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: [
            "product-summary",
            keyword,
            singleFilters.status,
            multiFilters.nature,
            singleFilters.group_code,
            singleFilters.default_warehouse_id,
            singleFilters.inventory_account_code,
        ],
        queryFn: () => fetchProductSummary(requestParams),
    })

    return (
        <ProductsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Sản phẩm"
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
                            summary={summary}
                            isSummaryLoading={isSummaryLoading}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={(value) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                setKeyword(value)
                            }}
                            filters={{
                                status: singleFilters.status,
                                nature: multiFilters.nature,
                                group_code: singleFilters.group_code,
                                default_warehouse_id: singleFilters.default_warehouse_id
                                    ? Number(singleFilters.default_warehouse_id)
                                    : undefined,
                                inventory_account_code: singleFilters.inventory_account_code,
                            }}
                            onFiltersChange={(next) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                setSingleFilters({
                                    status: next.status,
                                    group_code: next.group_code,
                                    default_warehouse_id: next.default_warehouse_id
                                        ? String(next.default_warehouse_id)
                                        : undefined,
                                    inventory_account_code: next.inventory_account_code,
                                })
                                setMultiFilters({
                                    nature: next.nature ?? [],
                                })
                            }}
                        />
                        <ProductDialogs />
                    </div>
                )}
            </PageSection>
        </ProductsProvider>
    )
}

async function fetchProductSummary(filters: Omit<ProductListParams, "page" | "size">) {
    const all: Product[] = []
    let page = 1
    let total = 0
    let totalPage = 1

    do {
        const res = await listAllProducts({
            ...filters,
            page,
            size: SUMMARY_PAGE_SIZE,
        })
        all.push(...(res.items ?? []))
        total = res.total ?? all.length
        totalPage = res.total_page ?? page
        page += 1
    } while (page <= totalPage)

    return {
        total,
        active: all.filter((x) => Number(x.status) === 1).length,
        groups: new Set(all.map((x) => x.group?.id ?? x.group_id).filter(Boolean)).size,
        warehouses: new Set(all.map((x) => x.default_warehouse_id).filter(Boolean)).size,
    }
}
