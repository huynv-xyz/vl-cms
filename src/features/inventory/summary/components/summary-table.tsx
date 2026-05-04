import { CrudTable } from "@/components/crud/crud-table"
import type { InventorySummary } from "../data/schema"
import { summaryColumns } from "./summary-columns"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

type Props = {
    data: InventorySummary[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: {
        product_id?: number
        warehouse_id?: number
    }

    onFiltersChange: (f: {
        product_id?: number
        warehouse_id?: number
    }) => void
}

export function SummaryTable({
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
        <CrudTable<InventorySummary>
            data={data}
            columns={summaryColumns}
            entityName="mặt hàng tồn kho"
            searchPlaceholder="Tìm sản phẩm..."

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
                            onChange={(v: any) =>
                                onFiltersChange({
                                    ...filters,
                                    product_id: v || undefined,
                                })
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
            ]}
        />
    )
}