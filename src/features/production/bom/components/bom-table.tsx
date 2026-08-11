import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Boxes, CheckCircle2, Layers3, ScrollText, type LucideIcon } from "lucide-react"

import { getProduct, listProducts } from "@/api/product"
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
import type { Product } from "@/features/product/data/schema"
import { cn, formatNumber } from "@/lib/utils"
import type { ProductBom, ProductBomItem } from "../data/schema"
import { productBomColumns } from "./bom-columns"

type ProductBomFilters = {
    product_id?: number
    active?: string
}

type ProductBomTableProps = {
    data: ProductBom[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductBomFilters
    onFiltersChange: (filters: ProductBomFilters) => void
}

const mapProductOption = (x: Product) => ({
    value: x.id,
    label: `${x.code} - ${x.name}`,
})

export function ProductBomTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductBomTableProps) {
    const totalItemLines = data.reduce((sum, bom) => sum + (bom.items?.length ?? 0), 0)
    const nvlLines = data.reduce((sum, bom) => sum + countByMaterialType(bom.items ?? [], "NVL"), 0)
    const packagingLines = data.reduce((sum, bom) => sum + countByMaterialType(bom.items ?? [], "BB"), 0)
    const activeCount = data.filter(activeOf).length

    const setFilter = <K extends keyof ProductBomFilters>(key: K, value: ProductBomFilters[K]) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    return (
        <div className="space-y-4">
            <ProductBomSummaryStrip
                total={data.length}
                active={activeCount}
                itemLines={totalItemLines}
                nvlLines={nvlLines}
                packagingLines={packagingLines}
            />

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm mã BOM, thành phẩm, phiên bản, ghi chú..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <AsyncSelect
                    className={filterControlClass("min-w-[260px] flex-[1.5_1_0]")}
                    value={filters.product_id}
                    onChange={(value: number | undefined) => setFilter("product_id", value || undefined)}
                    placeholder="Thành phẩm"
                    searchPlaceholder="Tìm thành phẩm"
                    dataSource={{
                        getList: listProducts,
                        getById: getProduct,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={mapProductOption}
                />

                <Select
                    value={filters.active || "all"}
                    onValueChange={(value) => setFilter("active", value === "all" ? undefined : value)}
                >
                    <SelectTrigger className={filterControlClass("min-w-[170px] flex-1")}>
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="true">Đang dùng</SelectItem>
                        <SelectItem value="false">Ngưng dùng</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <CrudTable<ProductBom>
                data={data}
                columns={productBomColumns}
                entityName="định mức BOM"
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

function ProductBomSummaryStrip({
    total,
    active,
    itemLines,
    nvlLines,
    packagingLines,
}: {
    total: number
    active: number
    itemLines: number
    nvlLines: number
    packagingLines: number
}) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Layers3} label="Tổng BOM" value={formatNumber(total)} tone="opening" />
            <MetricCard icon={CheckCircle2} label="Đang dùng" value={formatNumber(active)} tone="credit" />
            <MetricCard icon={ScrollText} label="Dòng vật tư" value={formatNumber(itemLines)} tone="closing" />
            <MetricCard icon={Boxes} label="NVL / Bao bì" value={`${formatNumber(nvlLines)} / ${formatNumber(packagingLines)}`} tone="neutral" />
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

function countByMaterialType(items: ProductBomItem[], type: string) {
    return items.filter((item) => String(item.material_type || "").toUpperCase() === type).length
}

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? false
}

function filterControlClass(className?: string) {
    return `h-10 rounded-md border-slate-300 bg-white shadow-xs ${className ?? ""}`
}
