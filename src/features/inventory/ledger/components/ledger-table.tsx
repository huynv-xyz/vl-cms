import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { DatePicker } from "@/components/date-picker"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import type { InventoryLedgerReportRow } from "../data/schema"
import { inventoryLedgerColumns } from "./ledger-columns"

type Props = {
    data: InventoryLedgerReportRow[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        product_id?: number
        warehouse_id?: number
        doc_type?: string
        from_date?: string
        to_date?: string
    }
    onFiltersChange: (f: Props["filters"]) => void
}

export function InventoryLedgerTable(props: Props) {
    const { data, pagination, onPaginationChange, pageCount, keyword, onKeywordChange, filters, onFiltersChange } = props

    return (
        <CrudTable<InventoryLedgerReportRow>
            data={data || []}
            columns={inventoryLedgerColumns}
            entityName="dòng sổ kho"
            searchPlaceholder="Tìm số chứng từ..."
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
            keyword={keyword}
            onKeywordChange={onKeywordChange}
            filters={[
                {
                    columnId: "product",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[280px]"
                            value={filters.product_id}
                            onChange={(v: any) => onFiltersChange({ ...filters, product_id: v || undefined })}
                            placeholder="Sản phẩm"
                            dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                            mapOption={(x: any) => ({ value: x.id, label: `${x.code} - ${x.name}` })}
                        />
                    ),
                },
                {
                    columnId: "warehouse",
                    title: "",
                    render: () => (
                        <AsyncSelect
                            className="w-[220px]"
                            value={filters.warehouse_id}
                            onChange={(v: any) => onFiltersChange({ ...filters, warehouse_id: v || undefined })}
                            placeholder="Kho"
                            dataSource={{ getList: listWarehouses, getById: getWarehouse, params: { page: 1, size: 20 } }}
                            mapOption={(x: any) => ({ value: x.id, label: x.name })}
                        />
                    ),
                },
                {
                    columnId: "doc_type",
                    title: "",
                    render: () => (
                        <select
                            className="h-9 rounded-md border px-2 text-sm"
                            value={filters.doc_type ?? ""}
                            onChange={(e) => onFiltersChange({ ...filters, doc_type: e.target.value || undefined })}
                        >
                            <option value="">Loại chứng từ</option>
                            <option value="OPENING">Tồn đầu kỳ</option>
                            <option value="PURCHASE">Nhập mua</option>
                            <option value="PRODUCTION">Nhập sản xuất</option>
                            <option value="ADJUSTMENT">Điều chỉnh</option>
                            <option value="EXPORT">Xuất kho</option>
                        </select>
                    ),
                },
                {
                    columnId: "from",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.from_date}
                            onChange={(v) => onFiltersChange({ ...filters, from_date: v })}
                            placeholder="Từ ngày"
                        />
                    ),
                },
                {
                    columnId: "to",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.to_date}
                            onChange={(v) => onFiltersChange({ ...filters, to_date: v })}
                            placeholder="Đến ngày"
                        />
                    ),
                },
            ]}
        />
    )
}