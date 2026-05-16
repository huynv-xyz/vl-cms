import { listNations } from "@/api/purchasing/nation"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/nations"
import { CreateNationButton } from "./components/create-nation-button"
import { NationDialogs } from "./components/nation-dialogs"
import { NationTable } from "./components/nation-table"
import { NationsProvider } from "./components/nations-provider"

export default function NationPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])

    const { data, isLoading, error } = usePaginatedList(
        ["nations", search.page, search.size, keyword],
        listNations,
        {
            page: search.page,
            size: search.size,
            keyword,
        }
    )

    return (
        <NationsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Quốc gia"
                description="Quản lý danh mục quốc gia dùng cho nhà cung cấp và hợp đồng nhập khẩu."
                actions={<CreateNationButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <NationTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <NationDialogs />
                    </div>
                )}
            </PageSection>
        </NationsProvider>
    )
}
