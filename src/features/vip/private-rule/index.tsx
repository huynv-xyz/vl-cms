import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipPrivateRules } from "@/api/vip-private-rule"

import { VipPrivateRulesProvider } from "./components/vip-private-rules-provider"
import { CreateVipPrivateRuleButton } from "./components/create-vip-private-rule-button"
import { VipPrivateRuleTable } from "./components/vip-private-rule-table"
import { VipPrivateRuleDialogs } from "./components/vip-private-rule-dialogs"

export default function VipPrivateRulePage() {
    const { data, isLoading, error, pagination, setPagination } =
        usePaginatedList(["vip-private-rule"], listVipPrivateRules)

    return (
        <VipPrivateRulesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Mã riêng"
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
                        />
                        <VipPrivateRuleDialogs />
                    </div>
                )}
            </PageSection>
        </VipPrivateRulesProvider>
    )
}