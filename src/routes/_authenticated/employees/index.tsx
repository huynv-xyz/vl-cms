import { createFileRoute } from '@tanstack/react-router'
import Page from '@/features/employee'

export const Route = createFileRoute('/_authenticated/employees/')({
    validateSearch: (search: Record<string, unknown>) => ({
        page: Number(search.page ?? 1),
        size: Number(search.size ?? 20),
        keyword: typeof search.keyword === 'string' ? search.keyword : '',
        status: typeof search.status === 'string' ? search.status : undefined,
    }),
    component: Page,
})