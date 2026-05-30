import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listCompanies } from "@/api/company"
import { CompanyTable } from "./components/company-table"
import { CompanyDialogs } from "./components/company-dialogs"
import { CompaniesProvider } from "./components/companies-provider"
import { CreateCompanyButton } from "./components/create-company-button"
import { Route } from "@/routes/_authenticated/companies"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"

export default function CompanyPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

    const { data, isLoading, error } = usePaginatedList(
        ["company", search.page, search.size, keyword],
        listCompanies,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <CompaniesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Công ty"
                actions={<CreateCompanyButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <CompanyTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />
                        <CompanyDialogs />
                    </div>
                )}
            </PageSection>
        </CompaniesProvider>
    )
}
