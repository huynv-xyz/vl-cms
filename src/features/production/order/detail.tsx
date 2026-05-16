import { useQuery } from "@tanstack/react-query"

import { getProductionDetail } from "@/api/production/order"
import { PageSection } from "@/components/page-section"
import { ProductionDetailPanel } from "./components/production-detail-panel"

type Props = {
    id: number
}

export default function ProductionOrderDetailPage({ id }: Props) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["production-order-detail", id],
        queryFn: () => getProductionDetail(id),
        enabled: Number.isFinite(id) && id > 0,
    })

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            data={data}
            title="Chi tiết lệnh sản xuất"
            description={data?.production_no}
            showBack
            backTo="/production/orders"
        >
            {(production) => <ProductionDetailPanel production={production} />}
        </PageSection>
    )
}
