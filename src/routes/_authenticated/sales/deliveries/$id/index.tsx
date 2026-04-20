import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/sales/deliveries/$id/',
)({
    component: DeliveryDetailPage,
})

function DeliveryDetailPage() {
    return <>abc</>
}