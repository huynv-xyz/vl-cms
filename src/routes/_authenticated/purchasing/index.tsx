import { createFileRoute } from '@tanstack/react-router'
import Page from '@/features/purchasing'

export const Route = createFileRoute('/_authenticated/purchasing/')({
    component: Page,
})
