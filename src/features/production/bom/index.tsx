import { listProductBoms } from "@/api/production/bom"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/production/boms"
import { ProductBomDialogs } from "./components/bom-dialogs"
import { ProductBomTable } from "./components/bom-table"
import { ProductBomsProvider } from "./components/boms-provider"
import { CreateBomButton } from "./components/create-bom-button"
import { ImportVthhBomButton } from "./components/import-vthh-bom-button"

export default function ProductBomPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(search, navigate, [], ["product_id", "active"])

    const { data, isLoading, error } = usePaginatedList(
        [
            "product-boms",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.active,
        ],
        listProductBoms,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id
                ? Number(requestFilters.product_id)
                : undefined,
            active:
                requestFilters.active === undefined
                    ? undefined
                    : requestFilters.active === "true",
        },
    )

    return (
        <ProductBomsProvider>
            <PageSection
                title="Định mức BOM"
                description="Khai báo vật tư cần dùng cho từng thành phẩm sản xuất."
                isLoading={isLoading}
                error={error}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportVthhBomButton />
                        <CreateBomButton />
                    </div>
                }
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <ProductBomTable
                            data={data.items || []}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            filters={{
                                product_id: singleFilters.product_id
                                    ? Number(singleFilters.product_id)
                                    : undefined,
                                active: singleFilters.active,
                            }}
                            onFiltersChange={(next) =>
                                setSingleFilters({
                                    product_id: next.product_id
                                        ? String(next.product_id)
                                        : undefined,
                                    active: next.active,
                                })
                            }
                        />

                        <ProductBomDialogs />
                    </div>
                )}
            </PageSection>
        </ProductBomsProvider>
    )
}
