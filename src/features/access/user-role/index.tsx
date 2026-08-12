import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listAccessRoles } from "@/api/auth/role"
import { listUsers } from "@/api/user"
import { Route } from "@/routes/_authenticated/access/user-roles"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import type { User } from "@/features/user/data/schema"
import { UserRoleTable } from "./components/user-role-table"
import { AssignRolesDialog } from "./components/assign-roles-dialog"

export default function UserRolePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const [target, setTarget] = useState<User | null>(null)
    const [open, setOpen] = useState(false)

    const rolesQuery = useQuery({
        queryKey: ["admin", "access-roles", "all"],
        queryFn: () => listAccessRoles({ page: 1, size: 1000 }),
        staleTime: 60_000,
    })

    const { data, isLoading, error } = usePaginatedList(
        ["admin", "users"],
        listUsers,
        {
            page: search.page,
            size: search.size,
            email: keyword || undefined,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Phân quyền người dùng"
            description="Xem vai trò hiện tại của từng tài khoản và gán lại khi cần."
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <UserRoleTable
                        data={data.items}
                        roles={rolesQuery.data?.items ?? []}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        onAssign={(u) => {
                            setTarget(u)
                            setOpen(true)
                        }}
                    />
                    <AssignRolesDialog
                        user={target}
                        open={open}
                        onOpenChange={setOpen}
                    />
                </div>
            )}
        </PageSection>
    )
}
