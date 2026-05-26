import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipRecalcJobs } from "@/api/vip-recalc-job"
import { Route } from "@/routes/_authenticated/vip/recalc-job"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { VipRecalcJobTable } from "./components/vip-recalc-job-table"
import { TriggerVipRecalcButton } from "./components/trigger-vip-recalc-button"

export default function VipRecalcJobPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const { data, isLoading, error } = usePaginatedList(
        ["vip-recalc-job"],
        listVipRecalcJobs,
        {
            page: search.page,
            size: search.size,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Lịch sử tính VIP"
            description="Danh sách các lần chạy tính toán hạng VIP."
            actions={<TriggerVipRecalcButton />}
            data={data}
        >
            {(data) => (
                <VipRecalcJobTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                />
            )}
        </PageSection>
    )
}
