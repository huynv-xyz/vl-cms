import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { AlertTriangle, Factory, PackageCheck, Scale } from "lucide-react"
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
import type { ProductionHistoryRow } from "../data/schema"
import { ProductionHistoryDetail } from "./production-history-detail"
import { productionHistoryColumns } from "./production-history-columns"

export type ProductionHistoryFilters = {
    product_id?: number
    physical_warehouse_id?: number
    warehouse_id?: number
    status?: string
    from_date?: string
    to_date?: string
    completion?: string
}

type Props = {
    data: ProductionHistoryRow[]
    total: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductionHistoryFilters
    onFiltersChange: (filters: ProductionHistoryFilters) => void
}

const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Nháp" },
    { value: "MATERIAL_GENERATED", label: "Đã sinh vật tư" },
    { value: "FIFO_ALLOCATED", label: "Đã chạy FIFO" },
    { value: "MATERIAL_ISSUED", label: "Đã xuất NVL" },
    { value: "OUTPUT_RECEIVED", label: "Đã nhập TP" },
    { value: "DONE", label: "Hoàn tất" },
    { value: "CANCELLED", label: "Huỷ" },
]

export function ProductionHistoryTable({
    data,
    total,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const totalPlan = data.reduce((sum, row) => sum + Number(row.quantity_plan || 0), 0)
    const totalDone = data.reduce((sum, row) => sum + Number(row.quantity_done || 0), 0)
    const incomplete = data.filter((row) => Number(row.quantity_done || 0) < Number(row.quantity_plan || 0)).length

    const setFilter = <K extends keyof ProductionHistoryFilters>(
        key: K,
        value: ProductionHistoryFilters[K],
    ) => onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Factory} label="Dòng lịch sử" value={formatNumber(total)} />
                <Metric icon={Scale} label="SL kế hoạch trang này" value={formatNumber(totalPlan)} />
                <Metric icon={PackageCheck} label="SL nhập TP trang này" value={formatNumber(totalDone)} />
                <Metric icon={AlertTriangle} label="Dòng chưa đủ SL" value={formatNumber(incomplete)} tone={incomplete ? "warn" : undefined} />
            </div>

            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm lệnh, mã hàng, tên thành phẩm, lô TP..."
                        wrapperClassName="relative h-10 min-w-[300px] flex-[1.7_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <AsyncSelect
                        className="h-10 min-w-[260px] flex-[1.4_1_0] border-slate-300 bg-white shadow-xs"
                        value={filters.product_id}
                        onChange={(value: number | undefined) => setFilter("product_id", value || undefined)}
                        placeholder="Thành phẩm"
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
                        className="h-10 min-w-[190px] flex-1 border-slate-300 bg-white shadow-xs"
                        value={filters.physical_warehouse_id}
                        onChange={(value: number | undefined) => setFilter("physical_warehouse_id", value || undefined)}
                        placeholder="Địa điểm kho"
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
                        onValueChange={(value) => setFilter("status", value === "ALL" ? undefined : value)}
                    >
                        <SelectTrigger className="h-10 min-w-[170px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                            {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.completion ?? "ALL"}
                        onValueChange={(value) => setFilter("completion", value === "ALL" ? undefined : value)}
                    >
                        <SelectTrigger className="h-10 min-w-[170px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                            <SelectValue placeholder="Tiến độ" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả tiến độ</SelectItem>
                            <SelectItem value="HAS_OUTPUT">Đã có nhập TP</SelectItem>
                            <SelectItem value="DONE">Đủ SL kế hoạch</SelectItem>
                            <SelectItem value="INCOMPLETE">Chưa đủ SL</SelectItem>
                        </SelectContent>
                    </Select>

                    <DatePicker
                        className="min-w-[145px] flex-1 [&_button]:h-10"
                        value={filters.from_date}
                        onChange={(value) => setFilter("from_date", value || undefined)}
                        placeholder="Từ ngày"
                    />

                    <DatePicker
                        className="min-w-[145px] flex-1 [&_button]:h-10"
                        value={filters.to_date}
                        onChange={(value) => setFilter("to_date", value || undefined)}
                        placeholder="Đến ngày"
                    />
                </div>
            </div>

            <CrudTable<ProductionHistoryRow>
                data={data}
                columns={productionHistoryColumns}
                entityName="lịch sử sản xuất"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                enableExpand
                renderExpanded={(row) => <ProductionHistoryDetail row={row} />}
                enableColumnResize
                enableStickyHorizontalScroll
                headerVariant="report"
                footer={false}
            />
        </div>
    )
}

function Metric({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: string
    tone?: "warn"
}) {
    return (
        <div className={`rounded-md border px-4 py-3 ${tone === "warn" ? "border-amber-200 bg-amber-50" : "bg-background"}`}>
            <div className={`flex items-center gap-2 text-sm font-medium ${tone === "warn" ? "text-amber-700" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        </div>
    )
}
