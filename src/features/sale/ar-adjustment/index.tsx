import { PageSection } from "@/components/page-section"
import { listArLedgers } from "@/api/sale/ar-ledger"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/ar-adjustments"
import { CashBankLedgerTable } from "../cash-bank-ledger/components/cash-bank-ledger-table"

export default function ArAdjustmentPage() {
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
            "adjust",
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
            source_type: "ADJUST",
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: customerId,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Điều chỉnh công nợ"
            description="Tạo bút toán tăng hoặc giảm công nợ thủ công theo khách hàng."
            data={data}
        >
            {(data) => (
                <CashBankLedgerTable
                    sourceType="ADJUST"
                    title="Bút toán điều chỉnh"
                    createLabel="Thêm điều chỉnh"
                    emptyText="Không có bút toán điều chỉnh."
                    descriptionPlaceholder="Nội dung điều chỉnh công nợ"
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
