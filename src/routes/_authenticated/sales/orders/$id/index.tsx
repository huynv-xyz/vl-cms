import OrderDetailPage from '@/features/sale/order-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/sales/orders/$id/'
)({
    validateSearch: (search: Record<string, unknown>) => ({
        return_to:
            typeof search.return_to === 'string'
                ? search.return_to
                : undefined,
    }),
    component: OrderDetailRoute,
})

function OrderDetailRoute() {
    const { id } = Route.useParams()
    const search = Route.useSearch()

    return <OrderDetailPage id={Number(id)} returnTo={search.return_to} />
}
