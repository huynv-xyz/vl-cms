import { PageSection } from "@/components/page-section"
import { listArLedgers } from "@/api/sale/ar-ledger"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/ar-openings"
import { CashBankLedgerTable } from "../cash-bank-ledger/components/cash-bank-ledger-table"

export default function ArOpeningPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
    } = useUrlListFilters(
        search,
        navigate,
        [],
        ["from_date", "to_date", "customer_id"],
    )

    const customerId = singleFilters.customer_id
        ? Number(singleFilters.customer_id)
        : undefined

    const { data, isLoading, error } = usePaginatedList(
        [
            "ar-ledgers",
            "opening",
            search.page,
            search.size,
            keyword,
            singleFilters,
        ],
        listArLedgers,
        {
            page: search.page,
            size: search.size,
            keyword,
            source_type: "OPENING",
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: customerId,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Nợ đầu kỳ"
            description="Nhập số dư công nợ đầu kỳ theo từng khách hàng."
            data={data}
        >
            {(data) => (
                <CashBankLedgerTable
                    sourceType="OPENING"
                    title="Số dư đầu kỳ"
                    createLabel="Thêm nợ đầu kỳ"
                    emptyText="Chưa có số dư đầu kỳ."
                    descriptionPlaceholder="Nội dung nợ đầu kỳ"
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    filters={{
                        ...singleFilters,
                        customer_id: customerId,
                    }}
                    onFiltersChange={(next) =>
                        setSingleFilters({
                            from_date: next.from_date,
                            to_date: next.to_date,
                            customer_id: next.customer_id
                                ? String(next.customer_id)
                                : undefined,
                        })
                    }
                />
            )}
        </PageSection>
    )
}
