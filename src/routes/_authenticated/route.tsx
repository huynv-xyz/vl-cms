import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { getMyPermissions } from '@/api/auth/permission'
import { hasViewPermissionForPath } from '@/lib/navigation-permissions'

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ location }) => {
        const { state, actions } = useAuthStore.getState()
        const allowWithoutViewPermission = location.pathname === '/' || location.pathname === '/user'

        if (!state.initialized) {
            await actions.init()
        }

        const { accessToken, user } = useAuthStore.getState().state

        if (!accessToken || !user) {
            throw redirect({
                to: '/sign-in',
                search: { redirect: `${location.href}` },
                mask: { to: '/sign-in' },
            })
        }

        // ĐÃ login hợp lệ -> cho vào, không cần setUser nữa
        if (!allowWithoutViewPermission) {
            const permissions = await getMyPermissions()
            if (!hasViewPermissionForPath(location.pathname, permissions)) {
                throw redirect({ to: '/403' })
            }
        }

        return null
    },
    component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
    return (
        <SearchProvider>
            <LayoutProvider>
                <SidebarProvider>
                    <div className="flex h-screen w-full">
                        <AppSidebar />
                        {/*<div className="flex h-full min-h-0 min-w-0 flex-1 flex-col border-l bg-background shadow-sm">*/}
                        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                            <Header fixed>
                                <Search />
                                <div className="ms-auto flex items-center space-x-4">
                                    <ThemeSwitch />
                                    <ConfigDrawer />
                                    <ProfileDropdown />
                                </div>
                            </Header>

                            <div className="min-w-0 flex-1">
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </SidebarProvider>
            </LayoutProvider>
        </SearchProvider>
    )
}
