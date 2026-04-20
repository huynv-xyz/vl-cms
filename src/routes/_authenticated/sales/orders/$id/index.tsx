import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
    '/_authenticated/sales/orders/$id/',
)({
    component: Page,
})

function Page() {
    return <>abc</>
}