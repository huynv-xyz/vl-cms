import { CrudTable } from "@/components/crud/crud-table"
import type { Production } from "../data/schema"
import { productionColumns } from "./production-columns"
import { formatNumber } from "@/lib/utils"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"

import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"

import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { DatePicker } from "@/components/date-picker"

type ProductionTableProps = {
    data: Production[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (value: string) => void

    filters: {
        product_id?: number
        warehouse_id?: number
        status?: string[]
        from_date?: string
        to_date?: string
    }

    onFiltersChange: (filters: {
        product_id?: number
        warehouse_id?: number
        status?: string[]
        from_date?: string
        to_date?: string
    }) => void
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
}: ProductionTableProps) {

    const totalPlan = 0;

    const totalDone = 0;

    return (
        <CrudTable<Production>
            data={data}
            columns={productionColumns}
            entityName="lệnh sản xuất"
            searchPlaceholder="Tìm theo mã lệnh..."

            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}

            keyword={keyword}
            onKeywordChange={onKeywordChange}

            filters={[
                // ===== PRODUCT =====
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

                // ===== WAREHOUSE =====
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

                // ===== STATUS =====
                {
                    columnId: "status",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.status?.[0] ?? "ALL"}
                            onValueChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    status: v === "ALL" ? undefined : [v],
                                })
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ALL">Trạng thái</SelectItem>
                                <SelectItem value="PLANNED">Kế hoạch</SelectItem>
                                <SelectItem value="READY">Sẵn sàng</SelectItem>
                                <SelectItem value="DONE">Hoàn tất</SelectItem>
                                <SelectItem value="CANCELLED">Huỷ</SelectItem>
                            </SelectContent>
                        </Select>
                    ),
                },

                // ===== DATE FROM =====
                {
                    columnId: "from",
                    title: "",
                    render: () => (
                        <DatePicker
                            className="w-[120px]"
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

                // ===== DATE TO =====
                {
                    columnId: "to",
                    title: "",
                    render: () => (
                        <DatePicker
                            className="w-[120px]"
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

            footer={
                <div className="flex justify-end w-full gap-6">
                    <div>
                        <span className="text-muted-foreground mr-2">
                            Tổng KH:
                        </span>
                        <span className="font-bold">
                            {formatNumber(totalPlan)}
                        </span>
                    </div>

                    <div>
                        <span className="text-muted-foreground mr-2">
                            Tổng TT:
                        </span>
                        <span className="font-bold">
                            {formatNumber(totalDone)}
                        </span>
                    </div>
                </div>
            }
        />
    )
}