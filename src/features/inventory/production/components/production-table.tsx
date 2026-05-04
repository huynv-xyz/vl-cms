import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { DatePicker } from "@/components/date-picker"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import type { ProductionOrder } from "../data/schema"
import { productionColumns } from "./production-columns"

type Props = {
    data: ProductionOrder[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        product_id?: number
        warehouse_id?: number
        status?: string
        from_date?: string
        to_date?: string
    }
    onFiltersChange: (f: Props["filters"]) => void
}

export function ProductionTable({
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
        <CrudTable<ProductionOrder>
            data={data || []}
            columns={productionColumns}
            entityName="lệnh sản xuất"
            searchPlaceholder="Tìm mã lệnh sản xuất..."

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
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    product_id: v || undefined,
                                })
                            }
                            placeholder="Thành phẩm"
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
                                onFiltersChange({
                                    ...filters,
                                    warehouse_id: v || undefined,
                                })
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
                    columnId: "status",
                    title: "",
                    render: () => (
                        <select
                            className="h-9 rounded-md border px-2 text-sm"
                            value={filters.status ?? ""}
                            onChange={(e) =>
                                onFiltersChange({
                                    ...filters,
                                    status: e.target.value || undefined,
                                })
                            }
                        >
                            <option value="">Trạng thái</option>
                            <option value="PLANNED">Kế hoạch</option>
                            <option value="IN_PROGRESS">Đang sản xuất</option>
                            <option value="DONE">Hoàn tất</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    ),
                },
                {
                    columnId: "from",
                    title: "",
                    render: () => (
                        <DatePicker
                            value={filters.from_date}
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    from_date: v,
                                })
                            }
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
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    to_date: v,
                                })
                            }
                            placeholder="Đến ngày"
                        />
                    ),
                },
            ]}
        />
    )
}