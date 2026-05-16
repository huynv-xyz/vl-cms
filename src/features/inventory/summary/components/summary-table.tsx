import { CrudTable } from "@/components/crud/crud-table"
import type { InventorySummary } from "../data/schema"
import { summaryColumns } from "./summary-columns"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { formatCurrency, formatNumber } from "@/lib/utils"

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
    const totalQuantity = sum(data, "total_quantity")
    const totalValue = sum(data, "total_value")
    const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0
    const warehouseCount = new Set(data.map((row) => row.warehouse_id).filter(Boolean)).size
    const productCount = new Set(data.map((row) => row.product_id).filter(Boolean)).size

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryMetric
                    label="Tổng tồn"
                    value={formatNumber(totalQuantity)}
                    hint="Số lượng của các dòng đang hiển thị"
                />
                <SummaryMetric
                    label="Tổng giá trị"
                    value={formatCurrency(totalValue)}
                    hint="Tổng tiền tồn kho"
                />
                <SummaryMetric
                    label="Giá vốn bình quân"
                    value={formatCurrency(avgCost)}
                    hint="Tổng giá trị / tổng tồn"
                />
                <SummaryMetric
                    label="Phạm vi"
                    value={`${productCount} SP · ${warehouseCount} kho`}
                    hint="Theo bộ lọc hiện tại"
                />
            </div>

            <CrudTable<InventorySummary>
                data={data}
                columns={summaryColumns}
                entityName="dòng tồn kho"
                searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..."
                searchInputClassName="min-w-[280px]"

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
                                className="w-[360px]"
                                value={filters.product_id}
                                onChange={(v: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        product_id: v || undefined,
                                    })
                                }
                                placeholder="Lọc theo sản phẩm"
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
                                className="w-[240px]"
                                value={filters.warehouse_id}
                                onChange={(v: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        warehouse_id: v || undefined,
                                    })
                                }
                                placeholder="Lọc theo kho"
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
        </div>
    )
}

function SummaryMetric({
    label,
    value,
    hint,
}: {
    label: string
    value: React.ReactNode
    hint: string
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        </div>
    )
}

function sum(rows: InventorySummary[], key: "total_quantity" | "total_value") {
    return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)
}
