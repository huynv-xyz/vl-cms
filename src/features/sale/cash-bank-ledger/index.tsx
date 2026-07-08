import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listArLedgers } from "@/api/sale/ar-ledger"
import { Route } from "@/routes/_authenticated/sales/cash-bank-ledger"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { CashBankLedgerTable } from "./components/cash-bank-ledger-table"

export default function CashBankLedgerPage() {
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
            "bank",
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
            source_type: "BANK",
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: customerId,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Ngân hàng"
            description="Nhập giao dịch ngân hàng trực tiếp vào sổ công nợ."
            actions={<div id="cash-bank-ledger-actions" />}
            data={data}
        >
            {(data) => (
                <CashBankLedgerTable
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
                    actionsPortalId="cash-bank-ledger-actions"
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
