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
            "warehouse_ids",
            "from_date",
            "to_date",
            "product_text",
            "product_text_op",
            "product_code_text",
            "product_code_text_op",
            "product_name_text",
            "product_name_text_op",
            "warehouse_code_text",
            "warehouse_code_text_op",
            "warehouse_name_text",
            "warehouse_name_text_op",
            "quote_text",
            "quote_text_op",
            "unit",
            "nature",
            "lot_text",
            "lot_text_op",
            "lot_warning",
            "closing_quantity_op",
            "closing_quantity_value",
        ],
    )

    const requestParams: Omit<InventoryLotListParams, "page" | "size"> = {
        keyword,
        product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
        product_ids: requestFilters.product_ids,
        warehouse_id: undefined,
        warehouse_ids: requestFilters.warehouse_ids,
        from_date: requestFilters.from_date,
        to_date: requestFilters.to_date,
        product_text: requestFilters.product_text,
        product_text_op: requestFilters.product_text_op as LotFilters["product_text_op"],
        product_code_text: requestFilters.product_code_text,
        product_code_text_op: requestFilters.product_code_text_op as LotFilters["product_code_text_op"],
        product_name_text: requestFilters.product_name_text,
        product_name_text_op: requestFilters.product_name_text_op as LotFilters["product_name_text_op"],
        warehouse_code_text: requestFilters.warehouse_code_text,
        warehouse_code_text_op: requestFilters.warehouse_code_text_op as LotFilters["warehouse_code_text_op"],
        warehouse_name_text: requestFilters.warehouse_name_text,
        warehouse_name_text_op: requestFilters.warehouse_name_text_op as LotFilters["warehouse_name_text_op"],
        quote_text: requestFilters.quote_text,
        quote_text_op: requestFilters.quote_text_op as LotFilters["quote_text_op"],
        unit: requestFilters.unit,
        nature: requestFilters.nature,
        lot_text: requestFilters.lot_text,
        lot_text_op: requestFilters.lot_text_op as LotFilters["lot_text_op"],
        lot_warning: requestFilters.lot_warning,
        closing_quantity_op: requestFilters.closing_quantity_op,
        closing_quantity_value: requestFilters.closing_quantity_value,
    }

    const tableFilters: LotFilters = {
        product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
        product_ids: multiFilters.product_ids,
        warehouse_id: undefined,
        warehouse_ids: parseIdList(singleFilters.warehouse_ids),
        from_date: singleFilters.from_date,
        to_date: singleFilters.to_date,
        product_text: singleFilters.product_text,
        product_text_op: singleFilters.product_text_op as LotFilters["product_text_op"],
        product_code_text: singleFilters.product_code_text,
        product_code_text_op: singleFilters.product_code_text_op as LotFilters["product_code_text_op"],
        product_name_text: singleFilters.product_name_text,
        product_name_text_op: singleFilters.product_name_text_op as LotFilters["product_name_text_op"],
        warehouse_code_text: singleFilters.warehouse_code_text,
        warehouse_code_text_op: singleFilters.warehouse_code_text_op as LotFilters["warehouse_code_text_op"],
        warehouse_name_text: singleFilters.warehouse_name_text,
        warehouse_name_text_op: singleFilters.warehouse_name_text_op as LotFilters["warehouse_name_text_op"],
        quote_text: singleFilters.quote_text,
        quote_text_op: singleFilters.quote_text_op as LotFilters["quote_text_op"],
        unit: singleFilters.unit,
        nature: singleFilters.nature,
        lot_text: singleFilters.lot_text,
        lot_text_op: singleFilters.lot_text_op as LotFilters["lot_text_op"],
        lot_warning: singleFilters.lot_warning,
        closing_quantity_op: singleFilters.closing_quantity_op as LotFilters["closing_quantity_op"],
        closing_quantity_value: singleFilters.closing_quantity_value,
    }

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-lots",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            multiFilters.product_ids,
            singleFilters.warehouse_ids,
            singleFilters.from_date,
            singleFilters.to_date,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.product_code_text,
            singleFilters.product_code_text_op,
            singleFilters.product_name_text,
            singleFilters.product_name_text_op,
            singleFilters.warehouse_code_text,
            singleFilters.warehouse_code_text_op,
            singleFilters.warehouse_name_text,
            singleFilters.warehouse_name_text_op,
            singleFilters.quote_text,
            singleFilters.quote_text_op,
            singleFilters.unit,
            singleFilters.nature,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
            singleFilters.lot_warning,
            singleFilters.closing_quantity_op,
            singleFilters.closing_quantity_value,
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
            multiFilters.product_ids,
            singleFilters.warehouse_ids,
            singleFilters.from_date,
            singleFilters.to_date,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.product_code_text,
            singleFilters.product_code_text_op,
            singleFilters.product_name_text,
            singleFilters.product_name_text_op,
            singleFilters.warehouse_code_text,
            singleFilters.warehouse_code_text_op,
            singleFilters.warehouse_name_text,
            singleFilters.warehouse_name_text_op,
            singleFilters.quote_text,
            singleFilters.quote_text_op,
            singleFilters.unit,
            singleFilters.nature,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
            singleFilters.lot_warning,
            singleFilters.closing_quantity_op,
            singleFilters.closing_quantity_value,
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
                    onFiltersChange={(next) => {
                        setMultiFilters({
                            product_ids: next.product_ids || [],
                        })
                        setSingleFilters({
                            product_id: next.product_id ? String(next.product_id) : undefined,
                            warehouse_ids: next.warehouse_ids?.length ? next.warehouse_ids.join(",") : undefined,
                            from_date: next.from_date,
                            to_date: next.to_date,
                            product_text: next.product_text,
                            product_text_op: next.product_text_op,
                            product_code_text: next.product_code_text,
                            product_code_text_op: next.product_code_text_op,
                            product_name_text: next.product_name_text,
                            product_name_text_op: next.product_name_text_op,
                            warehouse_code_text: next.warehouse_code_text,
                            warehouse_code_text_op: next.warehouse_code_text_op,
                            warehouse_name_text: next.warehouse_name_text,
                            warehouse_name_text_op: next.warehouse_name_text_op,
                            quote_text: next.quote_text,
                            quote_text_op: next.quote_text_op,
                            unit: next.unit,
                            nature: next.nature,
                            lot_text: next.lot_text,
                            lot_text_op: next.lot_text_op,
                            lot_warning: next.lot_warning,
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
