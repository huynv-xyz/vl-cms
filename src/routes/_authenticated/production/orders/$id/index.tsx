import { createFileRoute } from "@tanstack/react-router"
import ProductionOrderDetailPage from "@/features/production/order/detail"

export const Route = createFileRoute("/_authenticated/production/orders/$id/")({
    component: ProductionOrderDetailRoute,
})

function ProductionOrderDetailRoute() {
    const { id } = Route.useParams()

    return <ProductionOrderDetailPage id={Number(id)} />
}
