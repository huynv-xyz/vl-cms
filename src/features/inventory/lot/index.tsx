import { useQuery } from "@tanstack/react-query"

import { getInventoryLotTotals, listInventoryLots, type InventoryLotListParams } from "@/api/inventory/lot"
import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/inventory/lots"
import { ExportInventoryLotsButton } from "./components/export-inventory-lots-button"
import { InventoryLotTable, type LotFilters } from "./components/inventory-lot-table"

export default function InventoryLotPage() {
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
            "lot_text",
            "lot_text_op",
            "lot_warning",
        ],
    )

    const requestParams: Omit<InventoryLotListParams, "page" | "size"> = {
        keyword,
        product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
        warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
        from_date: requestFilters.from_date,
        to_date: requestFilters.to_date,
        product_text: requestFilters.product_text,
        product_text_op: requestFilters.product_text_op as LotFilters["product_text_op"],
        quote_text: requestFilters.quote_text,
        quote_text_op: requestFilters.quote_text_op as LotFilters["quote_text_op"],
        unit: requestFilters.unit,
        lot_text: requestFilters.lot_text,
        lot_text_op: requestFilters.lot_text_op as LotFilters["lot_text_op"],
        lot_warning: requestFilters.lot_warning,
    }

    const tableFilters: LotFilters = {
        product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
        warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
        from_date: singleFilters.from_date,
        to_date: singleFilters.to_date,
        product_text: singleFilters.product_text,
        product_text_op: singleFilters.product_text_op as LotFilters["product_text_op"],
        quote_text: singleFilters.quote_text,
        quote_text_op: singleFilters.quote_text_op as LotFilters["quote_text_op"],
        unit: singleFilters.unit,
        lot_text: singleFilters.lot_text,
        lot_text_op: singleFilters.lot_text_op as LotFilters["lot_text_op"],
        lot_warning: singleFilters.lot_warning,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-lots",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.from_date,
            singleFilters.to_date,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.quote_text,
            singleFilters.quote_text_op,
            singleFilters.unit,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
            singleFilters.lot_warning,
        ],
        listInventoryLots,
        {
            page: search.page,
            size: search.size,
            ...requestParams,
        },
    )

    const { data: totals } = useQuery({
        queryKey: [
            "inventory-lots-totals",
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.from_date,
            singleFilters.to_date,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.quote_text,
            singleFilters.quote_text_op,
            singleFilters.unit,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
            singleFilters.lot_warning,
        ],
        queryFn: () => getInventoryLotTotals(requestParams),
    })

    return (
        <PageSection
            title="Tồn kho theo lô"
            actions={<ExportInventoryLotsButton keyword={keyword} filters={requestParams} />}
            isLoading={isLoading}
            error={error}
            data={data}
        >
            {(data) => (
                <InventoryLotTable
                    data={data.items || []}
                    totals={totals}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    filters={tableFilters}
                    onFiltersChange={(next) =>
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
                            lot_text: next.lot_text,
                            lot_text_op: next.lot_text_op,
                            lot_warning: next.lot_warning,
                        })
                    }
                />
            )}
        </PageSection>
    )
}
