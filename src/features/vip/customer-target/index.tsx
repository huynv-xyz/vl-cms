import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipCustomerTargets } from "@/api/vip-customer-target"
import { Route } from "@/routes/_authenticated/vip/customer-target"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { VipCustomerTargetsProvider } from "./components/vip-customer-target-provider"
import { CreateVipCustomerTargetButton } from "./components/create-vip-customer-target-button"
import { VipCustomerTargetTable } from "./components/vip-customer-target-table"
import { VipCustomerTargetDialogs } from "./components/vip-customer-target-dialogs"

export default function VipCustomerTargetPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const keyword = search.keyword ?? ""

    const { data, isLoading, error } = usePaginatedList(
        ["vip-customer-target"],
        listVipCustomerTargets,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <VipCustomerTargetsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Chỉ tiêu khách hàng VIP"
                description="Danh sách chỉ tiêu mục tiêu hạng VIP cho từng khách hàng."
                actions={<CreateVipCustomerTargetButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <VipCustomerTargetTable
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
                        <VipCustomerTargetDialogs />
                    </div>
                )}
            </PageSection>
        </VipCustomerTargetsProvider>
    )
}
