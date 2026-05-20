import { listGoodsDescriptions } from "@/api/sale/goods-description"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/goods-descriptions"
import { CreateGoodsDescriptionButton } from "./components/create-goods-description-button"
import { GoodsDescriptionDialogs } from "./components/goods-description-dialogs"
import { GoodsDescriptionTable } from "./components/goods-description-table"
import { GoodsDescriptionsProvider } from "./components/goods-descriptions-provider"
import { ImportGoodsDescriptionButton } from "./components/import-goods-description-button"

export default function GoodsDescriptionPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])

    const { data, isLoading, error } = usePaginatedList(
        ["goods-descriptions", search.page, search.size, keyword],
        listGoodsDescriptions,
        {
            page: search.page,
            size: search.size,
            keyword,
        }
    )

    return (
        <GoodsDescriptionsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Mô tả HH"
                description="Quản lý danh mục mô tả hàng hóa dùng khi tạo và sửa đơn hàng."
                actions={
                    <div className="flex items-center gap-2">
                        <ImportGoodsDescriptionButton />
                        <CreateGoodsDescriptionButton />
                    </div>
                }
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <GoodsDescriptionTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <GoodsDescriptionDialogs />
                    </div>
                )}
            </PageSection>
        </GoodsDescriptionsProvider>
    )
}
