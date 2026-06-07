import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Boxes, Layers3, PackageCheck, ScrollText } from "lucide-react"

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
import { formatNumber } from "@/lib/utils"
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
    const totalItemLines = data.reduce(
        (sum, bom) => sum + (bom.items?.length ?? 0),
        0,
    )
    const nvlLines = data.reduce(
        (sum, bom) => sum + countByMaterialType(bom.items ?? [], "NVL"),
        0,
    )
    const packagingLines = data.reduce(
        (sum, bom) => sum + countByMaterialType(bom.items ?? [], "BB"),
        0,
    )
    const activeCount = data.filter(activeOf).length

    const setFilter = <K extends keyof ProductBomFilters>(
        key: K,
        value: ProductBomFilters[K],
    ) => onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={Layers3}
                    label="Số BOM"
                    value={formatNumber(data.length)}
                />
                <SummaryCard
                    icon={PackageCheck}
                    label="Đang dùng"
                    value={formatNumber(activeCount)}
                />
                <SummaryCard
                    icon={ScrollText}
                    label="Dòng vật tư"
                    value={formatNumber(totalItemLines)}
                    sub={`${formatNumber(nvlLines)} NVL · ${formatNumber(packagingLines)} bao bì`}
                />
                <SummaryCard
                    icon={Boxes}
                    label="Bình quân"
                    value={
                        data.length
                            ? formatNumber(totalItemLines / data.length)
                            : "0"
                    }
                    sub="Dòng vật tư / BOM"
                />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm mã, tên thành phẩm hoặc phiên bản..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.5_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <AsyncSelect
                    className="h-10 min-w-[260px] flex-[1.5_1_0] border-slate-300 bg-white shadow-xs"
                    value={filters.product_id}
                    onChange={(value: number | undefined) =>
                        setFilter("product_id", value || undefined)
                    }
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
                    value={filters.active || "ALL"}
                    onValueChange={(value) =>
                        setFilter("active", value === "ALL" ? undefined : value)
                    }
                >
                    <SelectTrigger className="h-10 min-w-[180px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
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
            />
        </div>
    )
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    sub?: string
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sub}
                </div>
            ) : null}
        </div>
    )
}

function countByMaterialType(items: ProductBomItem[], type: string) {
    return items.filter(
        (item) => String(item.material_type || "").toUpperCase() === type,
    ).length
}

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? false
}
