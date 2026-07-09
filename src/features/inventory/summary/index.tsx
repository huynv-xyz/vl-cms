import { listInventorySummarys } from "@/api/inventory/summary"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/inventory/summary"
import { ExportInventorySummaryButton, SummaryTable, type SummaryFilters } from "./components/summary-table"

function today() {
    return dateToYmd(new Date())
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export default function InventorySummaryPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ["product_ids"],
        [
            "product_id",
            "warehouse_id",
            "warehouse_ids",
            "from_date",
            "to_date",
            "product_text",
            "product_text_op",
            "product_code_text",
            "product_code_text_op",
            "product_name_text",
            "product_name_text_op",
            "quote_text",
            "quote_text_op",
            "unit",
            "nature",
            "summary_status",
            "closing_quantity_op",
            "closing_quantity_value",
        ],
    )

    const effectiveToDate = requestFilters.to_date || today()
    const effectiveFromDate = requestFilters.from_date && requestFilters.from_date <= effectiveToDate
        ? requestFilters.from_date
        : undefined
    const tableFilters: SummaryFilters = {
        product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
        product_ids: multiFilters.product_ids,
        warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
        warehouse_ids: parseIdList(singleFilters.warehouse_ids),
        from_date: effectiveFromDate,
        to_date: singleFilters.to_date || effectiveToDate,
        product_text: singleFilters.product_text,
        product_text_op: singleFilters.product_text_op as SummaryFilters["product_text_op"],
        product_code_text: singleFilters.product_code_text,
        product_code_text_op: singleFilters.product_code_text_op as SummaryFilters["product_code_text_op"],
        product_name_text: singleFilters.product_name_text,
        product_name_text_op: singleFilters.product_name_text_op as SummaryFilters["product_name_text_op"],
        quote_text: singleFilters.quote_text,
        quote_text_op: singleFilters.quote_text_op as SummaryFilters["quote_text_op"],
        unit: singleFilters.unit,
        nature: singleFilters.nature,
        summary_status: singleFilters.summary_status,
        closing_quantity_op: singleFilters.closing_quantity_op as SummaryFilters["closing_quantity_op"],
        closing_quantity_value: singleFilters.closing_quantity_value,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-summary",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            multiFilters.product_ids,
            singleFilters.warehouse_id,
            singleFilters.warehouse_ids,
            effectiveFromDate,
            effectiveToDate,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.product_code_text,
            singleFilters.product_code_text_op,
            singleFilters.product_name_text,
            singleFilters.product_name_text_op,
            singleFilters.quote_text,
            singleFilters.quote_text_op,
            singleFilters.unit,
            singleFilters.nature,
            singleFilters.summary_status,
            singleFilters.closing_quantity_op,
            singleFilters.closing_quantity_value,
        ],
        listInventorySummarys,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
            product_ids: requestFilters.product_ids,
            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
            warehouse_ids: requestFilters.warehouse_ids,
            from_date: effectiveFromDate,
            to_date: effectiveToDate,
            product_text: requestFilters.product_text,
            product_text_op: requestFilters.product_text_op,
            product_code_text: requestFilters.product_code_text,
            product_code_text_op: requestFilters.product_code_text_op,
            product_name_text: requestFilters.product_name_text,
            product_name_text_op: requestFilters.product_name_text_op,
            quote_text: requestFilters.quote_text,
            quote_text_op: requestFilters.quote_text_op,
            unit: requestFilters.unit,
            nature: requestFilters.nature,
            summary_status: requestFilters.summary_status,
            closing_quantity_op: requestFilters.closing_quantity_op,
            closing_quantity_value: requestFilters.closing_quantity_value,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Báo cáo tồn kho"
            data={data}
            actions={<ExportInventorySummaryButton keyword={keyword} filters={tableFilters} />}
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
                        onFiltersChange={(next) => {
                        setMultiFilters({
                            product_ids: next.product_ids || [],
                        })
                        setSingleFilters({
                            product_id: next.product_id ? String(next.product_id) : undefined,
                            warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
                            warehouse_ids: next.warehouse_ids?.length ? next.warehouse_ids.join(",") : undefined,
                            from_date: next.from_date,
                            to_date: next.to_date,
                            product_text: next.product_text,
                            product_text_op: next.product_text_op,
                            product_code_text: next.product_code_text,
                            product_code_text_op: next.product_code_text_op,
                            product_name_text: next.product_name_text,
                            product_name_text_op: next.product_name_text_op,
                            quote_text: next.quote_text,
                            quote_text_op: next.quote_text_op,
                            unit: next.unit,
                            nature: next.nature,
                            summary_status: next.summary_status,
                            closing_quantity_op: next.closing_quantity_op,
                            closing_quantity_value: next.closing_quantity_value,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}

function parseIdList(value?: string) {
    if (!value) return undefined
    const ids = value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
    return ids.length ? ids : undefined
}
