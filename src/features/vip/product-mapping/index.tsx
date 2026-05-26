import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipProductMappings } from "@/api/vip-product-mapping"
import { Route } from "@/routes/_authenticated/vip/product-mapping"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { VipProductMappingsProvider } from "./components/vip-product-mapping-provider"
import { CreateVipProductMappingButton } from "./components/create-vip-product-mapping-button"
import { VipProductMappingTable } from "./components/vip-product-mapping-table"
import { VipProductMappingDialogs } from "./components/vip-product-mapping-dialogs"

export default function VipProductMappingPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const keyword = search.keyword ?? ""

    const { data, isLoading, error } = usePaginatedList(
        ["vip-product-mapping"],
        listVipProductMappings,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <VipProductMappingsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Mapping hàng hóa VIP"
                description="Danh sách mapping mã hàng hóa dùng để tính điểm và thưởng VIP."
                actions={<CreateVipProductMappingButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <VipProductMappingTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={(value) =>
                                navigate({
                                    search: (prev) => ({
                                        ...prev,
                                        keyword: value || "",
                                        page: 1,
                                    }),
                                    replace: true,
                                })
                            }
                        />
                        <VipProductMappingDialogs />
                    </div>
                )}
            </PageSection>
        </VipProductMappingsProvider>
    )
}
