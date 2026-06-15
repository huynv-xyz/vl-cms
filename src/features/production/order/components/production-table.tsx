import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    AlertTriangle,
    CheckCircle2,
    Factory,
    PackageCheck,
    Scale,
} from "lucide-react"

import { getProduct, listProducts } from "@/api/product"
import { getPhysicalWarehouse, listPhysicalWarehouses } from "@/api/physical-warehouse"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatNumber } from "@/lib/utils"
import type { Production } from "../data/schema"
import { productionColumns } from "./production-columns"

type ProductionFilters = {
    product_id?: number
    physical_warehouse_id?: number
    status?: string
    from_date?: string
    to_date?: string
}

type ProductionTableProps = {
    data: Production[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductionFilters
    onFiltersChange: (filters: ProductionFilters) => void
}

const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Nháp" },
    { value: "PLANNED", label: "Kế hoạch" },
    { value: "MATERIAL_GENERATED", label: "Đã sinh vật tư" },
    { value: "FIFO_ALLOCATED", label: "Đã chạy FIFO" },
    { value: "MATERIAL_ISSUED", label: "Đã xuất nguyên liệu" },
    { value: "OUTPUT_RECEIVED", label: "Đã nhập TP" },
    { value: "DONE", label: "Hoàn tất" },
    { value: "CANCELLED", label: "Huỷ" },
]

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
    const totalPlan = data.reduce(
        (sum, item) => sum + sumItems(item.items ?? [], "quantity_plan"),
        0,
    )
    const totalDone = data.reduce(
        (sum, item) => sum + sumItems(item.items ?? [], "quantity_done"),
        0,
    )
    const shortageRows = data.reduce(
        (sum, item) =>
            sum +
            (item.items ?? []).reduce(
                (childSum, productionItem) =>
                    childSum +
                    (productionItem.materials ?? []).filter(
                        (m) => Number(m.shortage_quantity) > 0,
                    ).length,
                0,
            ),
        0,
    )
    const missingBom = data.reduce(
        (sum, item) =>
            sum +
            (item.items ?? []).filter(
                (productionItem) =>
                    !productionItem.bom_id ||
                    productionItem.check_status === "THIEU_BOM",
            ).length,
        0,
    )
    const warningCount = shortageRows + missingBom

    const setFilter = <K extends keyof ProductionFilters>(
        key: K,
        value: ProductionFilters[K],
    ) => onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={Factory}
                    label="Số lệnh"
                    value={formatNumber(data.length)}
                />
                <SummaryCard
                    icon={Scale}
                    label="Tổng SL kế hoạch"
                    value={formatNumber(totalPlan)}
                />
                <SummaryCard
                    icon={PackageCheck}
                    label="Tổng SL nhập TP"
                    value={formatNumber(totalDone)}
                />
                <SummaryCard
                    icon={warningCount ? AlertTriangle : CheckCircle2}
                    label="Cảnh báo"
                    value={formatNumber(warningCount)}
                    sub={
                        warningCount
                            ? `${formatNumber(shortageRows)} thiếu tồn · ${formatNumber(missingBom)} thiếu BOM`
                            : "Không có cảnh báo"
                    }
                    tone={warningCount ? "warn" : undefined}
                />
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm mã lệnh, mã hàng, tên thành phẩm..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.5_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <AsyncSelect
                        className="h-10 min-w-[260px] flex-[1.5_1_0] border-slate-300 bg-white shadow-xs"
                        value={filters.product_id}
                        onChange={(value: number | undefined) =>
                            setFilter("product_id", value || undefined)
                        }
                        placeholder="Sản phẩm"
                        dataSource={{
                            getList: listProducts,
                            getById: getProduct,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={(product: { id: number; code: string; name: string }) => ({
                            value: product.id,
                            label: `${product.code} - ${product.name}`,
                        })}
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <AsyncSelect
                        className="h-10 min-w-[180px] flex-1 border-slate-300 bg-white shadow-xs"
                        value={filters.physical_warehouse_id}
                        onChange={(value: number | undefined) =>
                            setFilter("physical_warehouse_id", value || undefined)
                        }
                        placeholder="Kho vật lý"
                        dataSource={{
                            getList: listPhysicalWarehouses,
                            getById: getPhysicalWarehouse,
                            params: { page: 1, size: 20, status: "ACTIVE" },
                        }}
                        mapOption={(warehouse: { id: number; code?: string; name: string }) => ({
                            value: warehouse.id,
                            label: `${warehouse.code || `#${warehouse.id}`} - ${warehouse.name}`,
                        })}
                    />

                    <Select
                        value={filters.status ?? "ALL"}
                        onValueChange={(value) =>
                            setFilter("status", value === "ALL" ? undefined : value)
                        }
                    >
                        <SelectTrigger className="h-10 min-w-[180px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.from_date}
                        onChange={(value) =>
                            setFilter("from_date", value || undefined)
                        }
                        placeholder="Từ ngày"
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.to_date}
                        onChange={(value) => setFilter("to_date", value || undefined)}
                        placeholder="Đến ngày"
                    />
                </div>
            </div>

            <CrudTable<Production>
                data={data}
                columns={productionColumns}
                entityName="lệnh sản xuất"
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
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    sub?: string
    tone?: "warn"
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div
                className={`flex items-center gap-2 text-sm font-medium ${
                    tone === "warn" ? "text-amber-700" : "text-muted-foreground"
                }`}
            >
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

function sumItems(
    items: Production["items"],
    key: keyof NonNullable<Production["items"]>[number],
) {
    return (items ?? []).reduce(
        (sum, item) => sum + (Number(item[key]) || 0),
        0,
    )
}
