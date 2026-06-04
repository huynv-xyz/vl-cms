import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listVipRecalcJobs } from "@/api/vip-recalc-job"
import { Route } from "@/routes/_authenticated/vip/recalc-job"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { VipRecalcJobTable } from "./components/vip-recalc-job-table"
import { TriggerVipRecalcButton } from "./components/trigger-vip-recalc-button"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

export default function VipRecalcJobPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()
    const hadRunningJobRef = useRef(false)

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const { data, isLoading, error, refetch } = usePaginatedList(
        ["vip-recalc-job"],
        listVipRecalcJobs,
        {
            page: search.page,
            size: search.size,
        },
    )

    const hasRunningJob = data?.items?.some((job) =>
        job.status === "PENDING" || job.status === "PROCESSING"
    ) ?? false

    useEffect(() => {
        if (!hasRunningJob) return

        const timer = window.setInterval(() => {
            void refetch()
        }, 5_000)

        return () => window.clearInterval(timer)
    }, [hasRunningJob, refetch])

    useEffect(() => {
        if (hasRunningJob) {
            hadRunningJobRef.current = true
            return
        }

        if (!hadRunningJobRef.current) return

        hadRunningJobRef.current = false
        queryClient.invalidateQueries({ queryKey: ["customer-vip"] })
        queryClient.invalidateQueries({ queryKey: ["customer-vip-detail"] })
        queryClient.invalidateQueries({ queryKey: ["customer-vip-audit"] })
    }, [hasRunningJob, queryClient])

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
