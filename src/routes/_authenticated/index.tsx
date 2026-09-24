import { createFileRoute, redirect } from '@tanstack/react-router'
import { getMyAdminStatus, getMyPermissions } from '@/api/auth/permission'
import { getFirstPermittedPath } from '@/lib/navigation-permissions'
import { Dashboard } from '@/features/dashboard'

export const Route = createFileRoute('/_authenticated/')({
    beforeLoad: async () => {
        const { admin } = await getMyAdminStatus()
        if (!admin) {
            const permissions = await getMyPermissions()
            throw redirect({ to: getFirstPermittedPath(permissions) as never })
        }
    },
    component: Dashboard,
})
