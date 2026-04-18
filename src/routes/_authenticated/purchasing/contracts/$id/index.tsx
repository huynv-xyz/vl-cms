import { createFileRoute } from '@tanstack/react-router'

import ContractDetailPage from "@/features/purchasing/contract/detail"

export const Route = createFileRoute(
    '/_authenticated/purchasing/contracts/$id/',
)({
    component: ContractDetailPage,
})
