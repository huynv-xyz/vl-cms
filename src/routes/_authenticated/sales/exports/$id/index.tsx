import ExportDetailPage from '@/features/sale/export-detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/sales/exports/$id/')({
    component: DetailRoute,
})

function DetailRoute() {
    const { id } = Route.useParams()

    return <ExportDetailPage id={Number(id)} />
}