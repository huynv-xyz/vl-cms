import type { OnChangeFn, PaginationState } from "@tanstack/react-table"

import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { InventoryLedgerReportRow } from "../data/schema"
import { INVENTORY_DOC_TYPES } from "../data/schema"
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

export function InventoryLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    return (
        <CrudTable<InventoryLedgerReportRow>
            data={data || []}
            columns={inventoryLedgerColumns}
            entityName="dòng sổ kho"
            searchPlaceholder="Tìm chứng từ, mã hàng, tên hàng..."
            searchInputClassName="min-w-[320px]"
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
                            className="w-[300px]"
                            value={filters.product_id}
                            onChange={(value: any) =>
                                onFiltersChange({
                                    ...filters,
                                    product_id: value || undefined,
                                })
                            }
                            placeholder="Chọn sản phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(product: any) => ({
                                value: product.id,
                                label: `${product.code} - ${product.name}`,
                            })}
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
                            onChange={(value: any) =>
                                onFiltersChange({
                                    ...filters,
                                    warehouse_id: value || undefined,
                                })
                            }
                            placeholder="Chọn kho"
                            dataSource={{
                                getList: listWarehouses,
                                getById: getWarehouse,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(warehouse: any) => ({
                                value: warehouse.id,
                                label: warehouse.name,
                            })}
                        />
                    ),
                },
                {
                    columnId: "doc_type",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.doc_type ?? "ALL"}
                            onValueChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    doc_type: value === "ALL" ? undefined : value,
                                })
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Loại chứng từ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ</SelectItem>
                                {INVENTORY_DOC_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ),
                },
                {
                    columnId: "from_date",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.from_date}
                            onChange={(value) =>
                                onFiltersChange({ ...filters, from_date: value })
                            }
                            placeholder="Từ ngày"
                        />
                    ),
                },
                {
                    columnId: "to_date",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.to_date}
                            onChange={(value) =>
                                onFiltersChange({ ...filters, to_date: value })
                            }
                            placeholder="Đến ngày"
                        />
                    ),
                },
            ]}
        />
    )
}
