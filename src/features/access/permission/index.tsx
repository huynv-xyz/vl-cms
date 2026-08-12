import { useQuery } from "@tanstack/react-query"

import { PageSection } from "@/components/page-section"
import { Input } from "@/components/ui/input"
import { listPermissions } from "@/api/auth/permission"
import { PermissionDialogs } from "./components/permission-dialogs"
import { PermissionsProvider } from "./components/permissions-provider"
import { CreatePermissionButton } from "./components/create-permission-button"
import { PermissionModuleGroups } from "./components/permission-module-groups"
import { Route } from "@/routes/_authenticated/access/permissions"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import type { PermissionRow } from "./data/schema"

export default function AccessPermissionPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const query = useQuery({
        queryKey: ["admin", "permissions", "all"],
        queryFn: fetchAllPermissions,
        staleTime: 60_000,
    })

    return (
        <PermissionsProvider>
            <PageSection
                isLoading={query.isLoading}
                error={query.error}
                title="Danh mục quyền"
                description="Nhóm theo module để tra cứu quyền và vai trò đang dùng."
                actions={<CreatePermissionButton />}
                data={query.data}
            >
                {(permissions) => (
                    <div className="space-y-4">
                        <div className="max-w-xl">
                            <Input
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder="Tìm module, route, hành động hoặc tên quyền..."
                            />
                        </div>

                        <PermissionModuleGroups
                            data={permissions}
                            keyword={keyword}
                        />
                        <PermissionDialogs />
                    </div>
                )}
            </PageSection>
        </PermissionsProvider>
    )
}

async function fetchAllPermissions(): Promise<PermissionRow[]> {
    const size = 500
    const first = await listPermissions({ page: 1, size })
    const items = [...(first.items ?? [])]
    const totalPage = Number(first.total_page ?? 1)

    for (let page = 2; page <= totalPage; page += 1) {
        const res = await listPermissions({ page, size })
        items.push(...(res.items ?? []))
    }

    return items
}
