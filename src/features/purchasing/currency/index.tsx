import { listCurrencies } from "@/api/purchasing/currency"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/currencies"
import { CreateCurrencyButton } from "./components/create-currency-button"
import { CurrenciesProvider } from "./components/currencies-provider"
import { CurrencyDialogs } from "./components/currency-dialogs"
import { CurrencyTable } from "./components/currency-table"

export default function CurrencyPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])

    const { data, isLoading, error } = usePaginatedList(
        ["currencies", search.page, search.size, keyword],
        listCurrencies,
        {
            page: search.page,
            size: search.size,
            keyword,
        }
    )

    return (
        <CurrenciesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Tiền tệ"
                description="Quản lý mã tiền tệ, ký hiệu và tỷ giá mặc định dùng cho hợp đồng nhập khẩu."
                actions={<CreateCurrencyButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <CurrencyTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <CurrencyDialogs />
                    </div>
                )}
            </PageSection>
        </CurrenciesProvider>
    )
}
