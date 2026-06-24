import { listInventorySummaryForSales } from "@/api/inventory/summary"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/sales/inventory-summary"
import { ExportInventorySummaryButton, SummaryTable, type SummaryFilters } from "@/features/inventory/summary/components/summary-table"

function today() {
    return new Date().toISOString().slice(0, 10)
}

export default function SalesInventorySummaryPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        [],
        [
            "product_id",
            "warehouse_id",
            "from_date",
            "to_date",
            "product_text",
            "product_text_op",
            "quote_text",
            "quote_text_op",
            "unit",
            "summary_status",
        ],
    )

    const effectiveToDate = requestFilters.to_date || today()
    const effectiveFromDate = requestFilters.from_date && requestFilters.from_date <= effectiveToDate
        ? requestFilters.from_date
        : undefined
    const tableFilters: SummaryFilters = {
        product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
        warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
        from_date: effectiveFromDate,
        to_date: singleFilters.to_date || effectiveToDate,
        product_text: singleFilters.product_text,
        product_text_op: singleFilters.product_text_op as SummaryFilters["product_text_op"],
        quote_text: singleFilters.quote_text,
        quote_text_op: singleFilters.quote_text_op as SummaryFilters["quote_text_op"],
        unit: singleFilters.unit,
        summary_status: singleFilters.summary_status,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "sales-inventory-summary",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            effectiveFromDate,
            effectiveToDate,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.quote_text,
            singleFilters.quote_text_op,
            singleFilters.unit,
            singleFilters.summary_status,
        ],
        listInventorySummaryForSales,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
            from_date: effectiveFromDate,
            to_date: effectiveToDate,
            product_text: requestFilters.product_text,
            product_text_op: requestFilters.product_text_op,
            quote_text: requestFilters.quote_text,
            quote_text_op: requestFilters.quote_text_op,
            unit: requestFilters.unit,
            summary_status: requestFilters.summary_status,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Tồn kho"
            data={data}
            actions={
                <ExportInventorySummaryButton
                    keyword={keyword}
                    filters={tableFilters}
                    showValues={false}
                    listFn={listInventorySummaryForSales as any}
                />
            }
        >
            {(data) => (
                <SummaryTable
                    data={data.items}
                    totals={(data as any).totals}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    filters={tableFilters}
                    showValues={false}
                    onFiltersChange={(next) => {
                        setSingleFilters({
                            product_id: next.product_id ? String(next.product_id) : undefined,
                            warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
                            from_date: next.from_date,
                            to_date: next.to_date,
                            product_text: next.product_text,
                            product_text_op: next.product_text_op,
                            quote_text: next.quote_text,
                            quote_text_op: next.quote_text_op,
                            unit: next.unit,
                            summary_status: next.summary_status,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}
