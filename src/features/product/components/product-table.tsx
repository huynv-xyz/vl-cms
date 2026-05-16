import type { OnChangeFn, PaginationState } from "@tanstack/react-table"

import { listProductGroups } from "@/api/product-group"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatNumber } from "@/lib/utils"
import { warehouseOption } from "@/lib/option-mapper"
import type { Product } from "../data/schema"
import { productColumns } from "./product-columns"

type ProductFilters = {
    status?: string
    nature?: string
    group_code?: string
    default_warehouse_id?: number
    inventory_account_code?: string
}

type ProductTableProps = {
    data: Product[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductFilters
    onFiltersChange: (filters: ProductFilters) => void
}

const NATURE_OPTIONS = [
    "Thành phẩm",
    "Nguyên vật liệu",
    "Bao bì",
    "Công cụ dụng cụ",
    "Hàng hóa",
]

export function ProductTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductTableProps) {
    const activeCount = data.filter((x) => Number(x.status) === 1).length
    const groupCount = new Set(data.map((x) => x.group_code).filter(Boolean)).size
    const warehouseCount = new Set(data.map((x) => x.default_warehouse_id).filter(Boolean)).size

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard label="Sản phẩm đang xem" value={formatNumber(data.length)} />
                <SummaryCard label="Đang hoạt động" value={formatNumber(activeCount)} />
                <SummaryCard label="Nhóm sản phẩm" value={formatNumber(groupCount)} />
                <SummaryCard label="Kho ngầm định" value={formatNumber(warehouseCount)} />
            </div>

            <CrudTable<Product>
                data={data}
                columns={productColumns}
                entityName="sản phẩm"
                searchPlaceholder="Tìm mã, tên, nhóm, TK kho..."
                searchInputClassName="w-[320px]"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                keyword={keyword}
                onKeywordChange={onKeywordChange}
                filters={[
                    {
                        columnId: "status",
                        title: "",
                        render: () => (
                            <Select
                                value={filters.status || "all"}
                                onValueChange={(value) =>
                                    onFiltersChange({
                                        ...filters,
                                        status: value === "all" ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="1">Hoạt động</SelectItem>
                                    <SelectItem value="0">Ngừng</SelectItem>
                                </SelectContent>
                            </Select>
                        ),
                    },
                    {
                        columnId: "nature",
                        title: "",
                        render: () => (
                            <Select
                                value={filters.nature || "all"}
                                onValueChange={(value) =>
                                    onFiltersChange({
                                        ...filters,
                                        nature: value === "all" ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[190px]">
                                    <SelectValue placeholder="Tính chất" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả tính chất</SelectItem>
                                    {NATURE_OPTIONS.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {item}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ),
                    },
                    {
                        columnId: "warehouse",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                className="w-[220px]"
                                value={filters.default_warehouse_id}
                                onChange={(value: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        default_warehouse_id: value || undefined,
                                    })
                                }
                                placeholder="Kho ngầm định"
                                dataSource={{
                                    getList: listWarehouses,
                                    getById: getWarehouse,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={warehouseOption}
                            />
                        ),
                    },
                    {
                        columnId: "group_code",
                        title: "",
                        render: () => (
                            <AsyncSelect
                                className="w-[220px]"
                                value={filters.group_code ?? ""}
                                onChange={(value: any) =>
                                    onFiltersChange({
                                        ...filters,
                                        group_code: value || undefined,
                                    })
                                }
                                placeholder="Nhóm sản phẩm"
                                dataSource={{
                                    getList: listProductGroups,
                                    getById: getProductGroupByCode,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={(group: any) => ({
                                    value: group.code,
                                    label: `${group.code || `#${group.id}`} - ${group.name || ""}`,
                                })}
                            />
                        ),
                    },
                    {
                        columnId: "account",
                        title: "",
                        render: () => (
                            <Input
                                className="w-[130px]"
                                value={filters.inventory_account_code ?? ""}
                                onChange={(event) =>
                                    onFiltersChange({
                                        ...filters,
                                        inventory_account_code: event.target.value || undefined,
                                    })
                                }
                                placeholder="TK kho"
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

async function getProductGroupByCode(code: string) {
    const res: any = await listProductGroups({ page: 1, size: 20, keyword: code })
    const items = res?.items ?? res?.data?.items ?? []
    return items.find((item: any) => String(item.code) === String(code)) ?? items[0]
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
    )
}
