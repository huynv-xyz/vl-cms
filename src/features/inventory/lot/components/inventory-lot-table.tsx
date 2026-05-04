import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import type { InventoryLot } from "../data/schema"
import { inventoryLotColumns } from "./inventory-lot-columns"

type Props = {
    data: InventoryLot[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        product_id?: number
        warehouse_id?: number
        source_type?: string
        from_date?: string
        to_date?: string
    }
    onFiltersChange: (f: Props["filters"]) => void
}

export function InventoryLotTable({
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
        <CrudTable<InventoryLot>
            data={data || []}
            columns={inventoryLotColumns}
            entityName="lô tồn kho"
            searchPlaceholder="Tìm theo số lô..."

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
                            className="w-[250px]"
                            value={filters.product_id}
                            onChange={(v: any) =>
                                onFiltersChange({ ...filters, product_id: v || undefined })
                            }
                            placeholder="Sản phẩm"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: `${x.code} - ${x.name}`,
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
                            onChange={(v: any) =>
                                onFiltersChange({ ...filters, warehouse_id: v || undefined })
                            }
                            placeholder="Kho"
                            dataSource={{
                                getList: listWarehouses,
                                getById: getWarehouse,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: x.name,
                            })}
                        />
                    ),
                },
                {
                    columnId: "source_type",
                    title: "",
                    render: () => (
                        <select
                            className="h-9 rounded-md border px-2 text-sm"
                            value={filters.source_type ?? ""}
                            onChange={(e) =>
                                onFiltersChange({
                                    ...filters,
                                    source_type: e.target.value || undefined,
                                })
                            }
                        >
                            <option value="">Nguồn nhập</option>
                            <option value="OPENING">Tồn đầu kỳ</option>
                            <option value="PURCHASE">Mua hàng</option>
                            <option value="PRODUCTION">Sản xuất</option>
                            <option value="ADJUSTMENT">Điều chỉnh</option>
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
                            placeholder="Từ ngày nhập"
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
                            placeholder="Đến ngày nhập"
                        />
                    ),
                },
            ]}
        />
    )
}