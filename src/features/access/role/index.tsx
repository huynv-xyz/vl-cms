import { useState } from "react"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listAccessRoles } from "@/api/auth/role"
import { RoleTable } from "./components/role-table"
import { RoleDialogs } from "./components/role-dialogs"
import { RolesProvider } from "./components/roles-provider"
import { CreateRoleButton } from "./components/create-role-button"
import { AssignPermissionsDialog } from "./components/assign-permissions-dialog"
import { Route } from "@/routes/_authenticated/access/roles"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import type { AccessRole } from "./data/schema"

export default function AccessRolePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const [permRole, setPermRole] = useState<AccessRole | null>(null)
    const [permOpen, setPermOpen] = useState(false)

    const { data, isLoading, error } = usePaginatedList(
        ["admin", "access-roles"],
        listAccessRoles,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <RolesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Vai trò"
                description="Danh sách vai trò trong hệ thống phân quyền."
                actions={<CreateRoleButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <RoleTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            onAssignPermissions={(role) => {
                                setPermRole(role)
                                setPermOpen(true)
                            }}
                        />
                        <RoleDialogs />
                        <AssignPermissionsDialog
                            role={permRole}
                            open={permOpen}
                            onOpenChange={setPermOpen}
                        />
                    </div>
                )}
            </PageSection>
        </RolesProvider>
    )
}
