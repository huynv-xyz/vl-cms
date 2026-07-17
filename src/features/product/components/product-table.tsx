import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Boxes, CheckCircle2, Layers, Warehouse as WarehouseIcon, type LucideIcon } from "lucide-react"

import { getProductNatureLookup, listProductNatureLookups } from "@/api/app-lookup"
import { listProductGroups } from "@/api/product-group"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { CrudTable } from "@/components/crud/crud-table"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn, formatNumber } from "@/lib/utils"
import { warehouseOption } from "@/lib/option-mapper"
import type { Product } from "../data/schema"
import { productColumns } from "./product-columns"

type ProductFilters = {
    status?: string
    nature?: string[]
    group_code?: string
    default_warehouse_id?: number
    inventory_account_code?: string
}

export type ProductSummary = {
    total: number
    active: number
    groups: number
    warehouses: number
}

type ProductTableProps = {
    data: Product[]
    summary?: ProductSummary
    isSummaryLoading?: boolean
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductFilters
    onFiltersChange: (filters: ProductFilters) => void
}

export function ProductTable({
    data,
    summary,
    isSummaryLoading,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductTableProps) {
    return (
        <div className="space-y-4">
            <ProductSummaryStrip summary={summary} isLoading={isSummaryLoading} />

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm mã, tên, nhóm, TK kho..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <Select
                        value={filters.status || "all"}
                        onValueChange={(value) =>
                            onFiltersChange({
                                ...filters,
                                status: value === "all" ? undefined : value,
                            })
                        }
                    >
                        <SelectTrigger className={filterControlClass("min-w-[150px] flex-1")}>
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="1">Hoạt động</SelectItem>
                            <SelectItem value="0">Ngừng</SelectItem>
                        </SelectContent>
                    </Select>

                    <AsyncMultiSelect
                        className={filterControlClass("min-w-[180px] flex-1")}
                        value={filters.nature ?? []}
                        onChange={(value: string[]) =>
                            onFiltersChange({
                                ...filters,
                                nature: value.length ? value : undefined,
                            })
                        }
                        placeholder="Tính chất"
                        searchPlaceholder="Tìm tính chất..."
                        dataSource={{
                            getList: listProductNatureLookups,
                            getById: getProductNatureLookup,
                            params: { page: 1, size: 50 },
                        }}
                        mapOption={lookupOption}
                        deferChange
                    />                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <AsyncSelect
                        className={filterControlClass("min-w-[220px] flex-1")}
                        value={filters.group_code || undefined}
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

                    <AsyncSelect
                        className={filterControlClass("min-w-[220px] flex-1")}
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

                    <SearchOnBlurInput
                        value={filters.inventory_account_code ?? ""}
                        onChange={(value) =>
                            onFiltersChange({
                                ...filters,
                                inventory_account_code: value || undefined,
                            })
                        }
                        placeholder="TK kho"
                        wrapperClassName="relative h-10 min-w-[140px] flex-1"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />
                </div>
            </div>

            <CrudTable<Product>
                data={data}
                columns={productColumns}
                entityName="sản phẩm"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                enableColumnResize
                enableStickyHorizontalScroll
                headerVariant="report"
                footer={false}
            />
        </div>
    )
}

async function getProductGroupByCode(code: string) {
    const res: any = await listProductGroups({ page: 1, size: 20, keyword: code })
    const items = res?.items ?? res?.data?.items ?? []
    return items.find((item: any) => String(item.code) === String(code)) ?? items[0]
}

function ProductSummaryStrip({
    summary,
    isLoading,
}: {
    summary?: ProductSummary
    isLoading?: boolean
}) {
    const loadingText = "Đang tải..."

    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                icon={Boxes}
                label="Tổng sản phẩm"
                value={isLoading ? loadingText : formatNumber(summary?.total ?? 0)}
                tone="opening"
            />
            <MetricCard
                icon={CheckCircle2}
                label="Đang hoạt động"
                value={isLoading ? loadingText : formatNumber(summary?.active ?? 0)}
                tone="credit"
            />
            <MetricCard
                icon={Layers}
                label="Nhóm sản phẩm"
                value={isLoading ? loadingText : formatNumber(summary?.groups ?? 0)}
                tone="closing"
            />
            <MetricCard
                icon={WarehouseIcon}
                label="Kho ngầm định"
                value={isLoading ? loadingText : formatNumber(summary?.warehouses ?? 0)}
                tone="neutral"
            />
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: string
    tone: "opening" | "credit" | "closing" | "neutral"
}) {
    const toneClass = {
        opening: {
            card: "border-sky-200 bg-sky-50 text-sky-800",
            icon: "bg-white/75 text-sky-700",
            value: "text-sky-950",
        },
        credit: {
            card: "border-emerald-200 bg-emerald-50 text-emerald-800",
            icon: "bg-white/75 text-emerald-700",
            value: "text-emerald-700",
        },
        closing: {
            card: "border-blue-200 bg-blue-50 text-blue-800",
            icon: "bg-white/75 text-blue-700",
            value: "text-blue-950",
        },
        neutral: {
            card: "border-amber-200 bg-amber-50 text-amber-800",
            icon: "bg-white/75 text-amber-700",
            value: "text-amber-700",
        },
    }[tone]

    return (
        <div className={cn("rounded-lg border p-2.5 shadow-sm", toneClass.card)}>
            <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-right text-lg font-semibold tabular-nums", toneClass.value)}>
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}

function filterControlClass(className?: string) {
    return `h-10 rounded-md border-slate-300 bg-white shadow-xs ${className ?? ""}`
}

function lookupOption(item: any) {
    return {
        value: item.code,
        label: item.name || item.code || "",
    }
}
