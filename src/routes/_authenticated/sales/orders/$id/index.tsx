import OrderDetailPage from '@/features/sale/order/detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/sales/orders/$id/'
)({
    component: OrderDetailRoute,
})

function OrderDetailRoute() {
    const { id } = Route.useParams()

    return <OrderDetailPage id={Number(id)} />
}