import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listUsers } from "@/api/user"
import { UserTable } from "./components/user-table"
import { UserDialogs } from "./components/user-dialogs"
import { UsersProvider } from "./components/users-provider"
import { CreateUserButton } from "./components/create-user-button"
import { Route } from "@/routes/_authenticated/access/users"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"

export default function UserPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const { keyword, setKeyword, multiFilters, setMultiFilters, requestFilters } =
        useUrlListFilters(search, navigate, ["status"])

    const { data, isLoading, error } = usePaginatedList(
        ["admin", "users"],
        listUsers,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,
        },
    )

    return (
        <UsersProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="User quản trị"
                description="Danh sách tài khoản quản trị hệ thống."
                actions={<CreateUserButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <UserTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            filters={{
                                statuses: multiFilters.status,
                            }}
                            onFiltersChange={(next) =>
                                setMultiFilters({
                                    status: next.statuses,
                                })
                            }
                        />
                        <UserDialogs />
                    </div>
                )}
            </PageSection>
        </UsersProvider>
    )
}