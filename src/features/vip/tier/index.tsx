import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipTiers } from "@/api/vip-tier"

import { VipTiersProvider } from "./components/vip-tiers-provider"
import { CreateVipTierButton } from "./components/create-vip-tier-button"
import { VipTierTable } from "./components/vip-tier-table"
import { VipTierDialogs } from "./components/vip-tier-dialogs"

export default function VipTierPage() {
    const { data, isLoading, error, pagination, setPagination } = usePaginatedList(
        ["vip-tier"],
        listVipTiers
    )

    return (
        <VipTiersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Cấp bậc VIP"
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
                        />
                        <VipTierDialogs />
                    </div>
                )}
            </PageSection>
        </VipTiersProvider>
    )
}