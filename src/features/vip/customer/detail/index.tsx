import { useQuery } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { Route } from "@/routes/_authenticated/vip/customer/$id"
import { getCustomerVipDetail } from "@/api/customer-vip"
import { CustomerVipSummary } from "./components/customer-vip-summary"
import { CustomerVipDetailTable } from "./components/customer-vip-detail-table"

export default function CustomerVipDetailPage() {
    const { id } = Route.useParams()

    const { data, isLoading, error } = useQuery({
        queryKey: ["customer-vip-detail", id],
        queryFn: () => getCustomerVipDetail(id),
    })

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            data={data}
            title="Chi tiết VIP khách hàng"
            description={data?.customer_name}
        >
            {(detail) => (
                <div className="space-y-6">
                    <CustomerVipSummary data={detail} />
                    <CustomerVipDetailTable items={detail.items ?? []} />
                </div>
            )}
        </PageSection>
    )
}