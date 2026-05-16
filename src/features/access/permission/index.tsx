import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listPermissions } from "@/api/auth/permission"
import { PermissionTable } from "./components/permission-table"
import { PermissionDialogs } from "./components/permission-dialogs"
import { PermissionsProvider } from "./components/permissions-provider"
import { CreatePermissionButton } from "./components/create-permission-button"
import { Route } from "@/routes/_authenticated/access/permissions"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"

export default function AccessPermissionPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const { data, isLoading, error } = usePaginatedList(
        ["admin", "permissions"],
        listPermissions,
        {
            page: search.page,
            size: search.size,
            module: keyword || undefined,
        },
    )

    return (
        <PermissionsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Quyền hệ thống"
                description="Danh sách quyền (module + hành động) trong hệ thống."
                actions={<CreatePermissionButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <PermissionTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />
                        <PermissionDialogs />
                    </div>
                )}
            </PageSection>
        </PermissionsProvider>
    )
}
