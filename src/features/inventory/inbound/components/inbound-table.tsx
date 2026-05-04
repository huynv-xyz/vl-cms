import { CrudTable } from "@/components/crud/crud-table"
import type { InventoryInbound } from "../data/schema"
import { inboundColumns } from "./inbound-columns"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { DatePicker } from "@/components/date-picker"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type InboundTableProps = {
    data: InventoryInbound[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (value: string) => void

    filters: {
        source_type?: string[]
        product_id?: number
        warehouse_id?: number
        from_date?: string
        to_date?: string
    }

    onFiltersChange: (filters: {
        source_type?: string[]
        product_id?: number
        warehouse_id?: number
        from_date?: string
        to_date?: string
    }) => void
}

export function InboundTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: InboundTableProps) {
    return (
        <CrudTable<InventoryInbound>
            data={data}
            columns={inboundColumns}
            entityName="phiếu nhập"
            searchPlaceholder="Tìm theo số chứng từ..."

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

                {
                    columnId: "source_type",
                    title: "",
                    render: () => (
                        <Select
                            value={filters.source_type?.[0] ?? "ALL"}
                            onValueChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    source_type:
                                        v === "ALL" ? undefined : [v],
                                })
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Loại nhập" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ALL">Loại nhập</SelectItem>
                                <SelectItem value="OPENING">Tồn đầu kỳ</SelectItem>
                                <SelectItem value="PURCHASE">Nhập mua hàng</SelectItem>
                                <SelectItem value="PRODUCTION">Nhập sản xuất</SelectItem>
                                <SelectItem value="ADJUSTMENT">Điều chỉnh</SelectItem>
                            </SelectContent>
                        </Select>
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
                            onChange={(v) =>
                                onFiltersChange({
                                    ...filters,
                                    to_date: v,
                                })
                            }
                            placeholder="Đến ngày nhập"
                        />
                    ),
                },
            ]}
        />
    )
}