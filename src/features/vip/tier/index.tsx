import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipTiers } from "@/api/vip-tier"
import { Route } from "@/routes/_authenticated/vip/tiers"
import { useUrlPagination } from "@/hooks/use-url-pagination"

import { VipTiersProvider } from "./components/vip-tiers-provider"
import { CreateVipTierButton } from "./components/create-vip-tier-button"
import { VipTierTable } from "./components/vip-tier-table"
import { VipTierDialogs } from "./components/vip-tier-dialogs"

export default function VipTierPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const keyword = search.keyword ?? ""

    const { data, isLoading, error } = usePaginatedList(
        ["vip-tier"],
        listVipTiers,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <VipTiersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Cấp bậc"
                description="Danh sách cấp bậc VIP."
                actions={<CreateVipTierButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <VipTierTable
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
                        <VipTierDialogs />
                    </div>
                )}
            </PageSection>
        </VipTiersProvider>
    )
}
