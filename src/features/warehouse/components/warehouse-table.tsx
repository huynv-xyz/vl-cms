import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Building2, CheckCircle2, Eye, Warehouse as WarehouseIcon, type LucideIcon } from "lucide-react"

import { getPhysicalWarehouse, listPhysicalWarehouses } from "@/api/physical-warehouse"
import { CrudTable } from "@/components/crud/crud-table"
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
import type { Warehouse } from "../data/schema"
import { warehouseColumns } from "./warehouse-columns"

type WarehouseFilters = {
    status?: string[]
    physical_warehouse_id?: number
    sales_inventory_visible?: string
}

export type WarehouseSummary = {
    total: number
    active: number
    salesVisible: number
    physicalWarehouses: number
}

type WarehouseTableProps = {
    data: Warehouse[]
    summary?: WarehouseSummary
    isSummaryLoading?: boolean
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: WarehouseFilters
    onFiltersChange: (filters: WarehouseFilters) => void
}

export function WarehouseTable({
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
}: WarehouseTableProps) {
    return (
        <div className="space-y-4">
            <WarehouseSummaryStrip summary={summary} isLoading={isSummaryLoading} />

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm mã kho, tên kho, TK kho..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <Select
                    value={(filters.status?.length === 1 ? filters.status[0] : "all") || "all"}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            status: value === "all" ? undefined : [value],
                        })
                    }
                >
                    <SelectTrigger className={filterControlClass("min-w-[150px] flex-1")}>
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Ngừng</SelectItem>
                    </SelectContent>
                </Select>

                <AsyncSelect
                    className={filterControlClass("min-w-[220px] flex-1")}
                    value={filters.physical_warehouse_id}
                    onChange={(value: any) =>
                        onFiltersChange({
                            ...filters,
                            physical_warehouse_id: value || undefined,
                        })
                    }
                    placeholder="Địa điểm kho"
                    dataSource={{
                        getList: listPhysicalWarehouses,
                        getById: getPhysicalWarehouse,
                        params: { page: 1, size: 20, status: "ACTIVE" },
                    }}
                    mapOption={(physical: any) => ({
                        value: physical.id,
                        label: `${physical.name}${physical.code ? ` (${physical.code})` : ""}`,
                        raw: physical,
                    })}
                />

                <Select
                    value={filters.sales_inventory_visible || "all"}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            sales_inventory_visible: value === "all" ? undefined : value,
                        })
                    }
                >
                    <SelectTrigger className={filterControlClass("min-w-[190px] flex-1")}>
                        <SelectValue placeholder="Tồn kho kinh doanh" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả tồn kho KD</SelectItem>
                        <SelectItem value="true">Hiện tồn kho KD</SelectItem>
                        <SelectItem value="false">Ẩn tồn kho KD</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <CrudTable<Warehouse>
                data={data}
                columns={warehouseColumns}
                entityName="kho"
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

function WarehouseSummaryStrip({
    summary,
    isLoading,
}: {
    summary?: WarehouseSummary
    isLoading?: boolean
}) {
    const loadingText = "Đang tải..."

    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                icon={WarehouseIcon}
                label="Tổng kho"
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
                icon={Building2}
                label="Địa điểm kho"
                value={isLoading ? loadingText : formatNumber(summary?.physicalWarehouses ?? 0)}
                tone="closing"
            />
            <MetricCard
                icon={Eye}
                label="Hiện tồn kho KD"
                value={isLoading ? loadingText : formatNumber(summary?.salesVisible ?? 0)}
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

function filterControlClass(extra?: string) {
    return cn("h-10 rounded-md border-slate-300 bg-white shadow-xs", extra)
}
