import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipPrivateRules } from "@/api/vip-private-rule"
import { Route } from "@/routes/_authenticated/vip/private-rules"
import { useUrlPagination } from "@/hooks/use-url-pagination"

import { VipPrivateRulesProvider } from "./components/vip-private-rules-provider"
import { CreateVipPrivateRuleButton } from "./components/create-vip-private-rule-button"
import { VipPrivateRuleTable } from "./components/vip-private-rule-table"
import { VipPrivateRuleDialogs } from "./components/vip-private-rule-dialogs"

export default function VipPrivateRulePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const keyword = search.keyword ?? ""

    const { data, isLoading, error } = usePaginatedList(
        ["vip-private-rule"],
        listVipPrivateRules,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <VipPrivateRulesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Thưởng"
                description="Danh sách quy tắc thưởng riêng VIP."
                actions={<CreateVipPrivateRuleButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <VipPrivateRuleTable
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
                        <VipPrivateRuleDialogs />
                    </div>
                )}
            </PageSection>
        </VipPrivateRulesProvider>
    )
}
