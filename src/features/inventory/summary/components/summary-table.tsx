import { useEffect, useMemo, useState } from "react"
import type React from "react"
import { useQuery } from "@tanstack/react-query"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    AlertTriangle,
    CircleCheck,
    CircleMinus,
    Download,
    Funnel,
    Loader2,
    Package,
    TrendingDown,
    TrendingUp,
    Warehouse,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { listInventorySummaryNatureOptions, listInventorySummarys, type SummaryListParams } from "@/api/inventory/summary"
import { listPhysicalWarehouses } from "@/api/physical-warehouse"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { ProductMultiFilter } from "@/features/inventory/components/product-multi-filter"
import { StickyReportTable } from "@/features/inventory/components/sticky-report-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type { InventorySummary, InventorySummaryTotals } from "../data/schema"

type TextFilterOp = "contains" | "equals" | "not_equals" | "not_contains"
type NumberFilterOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte"

export type SummaryFilters = {
    product_id?: number
    product_ids?: string[]
    warehouse_id?: number
    warehouse_ids?: number[]
    from_date?: string
    to_date?: string
    product_text?: string
    product_text_op?: TextFilterOp
    product_code_text?: string
    product_code_text_op?: TextFilterOp
    product_name_text?: string
    product_name_text_op?: TextFilterOp
    warehouse_code_text?: string
    warehouse_code_text_op?: TextFilterOp
    warehouse_name_text?: string
    warehouse_name_text_op?: TextFilterOp
    quote_text?: string
    quote_text_op?: TextFilterOp
    unit?: string
    nature?: string
    summary_status?: string
    closing_quantity_op?: NumberFilterOp
    closing_quantity_value?: string
}

type Props = {
    data: InventorySummary[]
    totals?: InventorySummaryTotals
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: SummaryFilters
    onFiltersChange: (f: SummaryFilters) => void
    showValues?: boolean
}

type ExportColumn = {
    label: string
    value: (row: InventorySummary, index: number) => string | number | null | undefined
    width?: number
    type?: "number" | "text"
    numberFormat?: "integer" | "quantity" | "money"
}

type ExportColumnGroup = {
    label: string
    columns: ExportColumn[]
}

const EXPORT_PAGE_SIZE = 200
const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

const TEXT_FILTER_OPERATORS: Array<{ value: TextFilterOp; label: string }> = [
    { value: "contains", label: "Chứa" },
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Khác" },
    { value: "not_contains", label: "Không chứa" },
]

const NUMBER_FILTER_OPERATORS: Array<{ value: NumberFilterOp; label: string; chipLabel: string }> = [
    { value: "eq", label: "Bằng (=)", chipLabel: "=" },
    { value: "ne", label: "Khác (!=)", chipLabel: "!=" },
    { value: "lt", label: "Nhỏ hơn (<)", chipLabel: "<" },
    { value: "lte", label: "Nhỏ hơn hoặc bằng (<=)", chipLabel: "<=" },
    { value: "gt", label: "Lớn hơn (>)", chipLabel: ">" },
    { value: "gte", label: "Lớn hơn hoặc bằng (>=)", chipLabel: ">=" },
]

const UNIT_OPTIONS = ["Kg", "Lít", "Bao", "Cái", "Thùng", "Mét"]

const SUMMARY_STATUS_OPTIONS = [
    { value: "NEGATIVE", label: "Âm tồn" },
    { value: "OUT_OF_STOCK", label: "Hết hàng" },
    { value: "DECREASE", label: "Giảm tồn" },
    { value: "INCREASE", label: "Tăng tồn" },
    { value: "STABLE", label: "Ổn định" },
]

const EXPORT_COLUMN_GROUPS: ExportColumnGroup[] = [
    { label: "STT", columns: [{ label: "STT", value: (_row, index) => index + 1, width: 8, type: "number", numberFormat: "integer" }] },
    {
        label: "Hàng hóa",
        columns: [
            { label: "Mã hàng", value: (row) => row.product_code, width: 22 },
            { label: "Tên hàng", value: (row) => row.product_name, width: 40 },
        ],
    },
    { label: "ĐVT", columns: [{ label: "ĐVT", value: (row) => row.unit, width: 10 }] },
    {
        label: "Kho",
        columns: [
            { label: "Mã kho", value: (row) => row.warehouse_code, width: 24 },
            { label: "Tên kho", value: (row) => row.warehouse_name, width: 28 },
        ],
    },
    {
        label: "Tồn đầu kỳ",
        columns: [
            { label: "Số lượng", value: (row) => row.opening_quantity, width: 14, type: "number", numberFormat: "quantity" },
            { label: "Giá trị", value: (row) => row.opening_value, width: 16, type: "number", numberFormat: "money" },
        ],
    },
    {
        label: "Nhập kho",
        columns: [
            { label: "Số lượng", value: (row) => row.inbound_quantity, width: 14, type: "number", numberFormat: "quantity" },
            { label: "Giá trị", value: (row) => row.inbound_value, width: 16, type: "number", numberFormat: "money" },
        ],
    },
    {
        label: "Xuất kho",
        columns: [
            { label: "Số lượng", value: (row) => row.outbound_quantity, width: 14, type: "number", numberFormat: "quantity" },
            { label: "Giá xuất BQ", value: (row) => row.avg_issue_unit_cost, width: 16, type: "number", numberFormat: "money" },
            { label: "Giá trị", value: (row) => row.outbound_value, width: 16, type: "number", numberFormat: "money" },
        ],
    },
    {
        label: "Tồn cuối kỳ",
        columns: [
            { label: "Số lượng", value: (row) => row.closing_quantity, width: 14, type: "number", numberFormat: "quantity" },
            { label: "Giá trị", value: (row) => row.closing_value, width: 16, type: "number", numberFormat: "money" },
        ],
    },
    { label: "Nhóm hàng", columns: [{ label: "Nhóm hàng", value: (row) => row.quote_name, width: 24 }] },
    { label: "Tính chất", columns: [{ label: "Tính chất", value: (row) => row.nature, width: 16 }] },
    { label: "Tình trạng", columns: [{ label: "Tình trạng", value: (row) => getInventoryStatus(row).label, width: 14 }] },
    { label: "Dạng hàng", columns: [{ label: "Dạng hàng", value: () => "", width: 14 }] },
]

const EXPORT_COLUMNS = EXPORT_COLUMN_GROUPS.flatMap((group) => group.columns)

const VALUE_GROUP_LABELS = new Set(["Tồn đầu kỳ", "Nhập kho", "Xuất kho", "Tồn cuối kỳ"])

function exportColumnGroups(showValues: boolean) {
    if (showValues) return EXPORT_COLUMN_GROUPS
    return EXPORT_COLUMN_GROUPS.map((group) => {
        if (!VALUE_GROUP_LABELS.has(group.label)) return group
        return {
            ...group,
            columns: group.columns
                .filter((column) => column.numberFormat !== "money")
                .map((column) => ({ ...column, label: group.label })),
        }
    })
}

const emptyTotals: InventorySummaryTotals = {
    opening_quantity: 0,
    opening_value: 0,
    inbound_quantity: 0,
    inbound_value: 0,
    outbound_quantity: 0,
    outbound_value: 0,
    closing_quantity: 0,
    closing_value: 0,
}

export function SummaryTable({
    data,
    totals,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
    showValues = true,
}: Props) {
    const { data: natureOptions = [] } = useQuery({
        queryKey: ["inventory-summary-nature-options"],
        queryFn: listInventorySummaryNatureOptions,
    })

    const summaryTotals = normalizeTotals(totals)
    const today = todayYmd()

    const setFilter = <K extends keyof SummaryFilters>(key: K, value: SummaryFilters[K] | undefined) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        })
    }

    const setTextFilter = (
        textKey: "product_text" | "product_code_text" | "product_name_text" | "warehouse_code_text" | "warehouse_name_text" | "quote_text",
        opKey: "product_text_op" | "product_code_text_op" | "product_name_text_op" | "warehouse_code_text_op" | "warehouse_name_text_op" | "quote_text_op",
        value: string,
        op: TextFilterOp,
    ) => {
        onFiltersChange({
            ...filters,
            [textKey]: value.trim() || undefined,
            [opKey]: value.trim() ? op : undefined,
        })
    }

    const clearTextFilter = (
        textKey: "product_text" | "product_code_text" | "product_name_text" | "warehouse_code_text" | "warehouse_name_text" | "quote_text",
        opKey: "product_text_op" | "product_code_text_op" | "product_name_text_op" | "warehouse_code_text_op" | "warehouse_name_text_op" | "quote_text_op",
    ) => {
        onFiltersChange({
            ...filters,
            [textKey]: undefined,
            [opKey]: undefined,
        })
    }

    const setNumberFilter = (
        opKey: "closing_quantity_op",
        valueKey: "closing_quantity_value",
        value: string,
        op: NumberFilterOp,
    ) => {
        const normalized = value.trim()
        onFiltersChange({
            ...filters,
            [opKey]: normalized ? op : undefined,
            [valueKey]: normalized || undefined,
        })
    }

    const clearNumberFilter = (opKey: "closing_quantity_op", valueKey: "closing_quantity_value") => {
        onFiltersChange({
            ...filters,
            [opKey]: undefined,
            [valueKey]: undefined,
        })
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    const activeFilterChips = [
        keyword
            ? {
                key: "keyword",
                label: `Tìm kiếm "${keyword}"`,
                onClear: () => onKeywordChange(""),
            }
            : null,
        filters.product_text
            ? {
                key: "product_text",
                label: textFilterDescription("Hàng hóa", filters.product_text_op, filters.product_text),
                onClear: () => clearTextFilter("product_text", "product_text_op"),
            }
            : null,
        filters.product_code_text
            ? {
                key: "product_code_text",
                label: textFilterDescription("Mã hàng", filters.product_code_text_op, filters.product_code_text),
                onClear: () => clearTextFilter("product_code_text", "product_code_text_op"),
            }
            : null,
        filters.product_name_text
            ? {
                key: "product_name_text",
                label: textFilterDescription("Tên hàng", filters.product_name_text_op, filters.product_name_text),
                onClear: () => clearTextFilter("product_name_text", "product_name_text_op"),
            }
            : null,
        false && filters.warehouse_id
            ? {
                key: "warehouse_id",
                label: "Kho: đã chọn",
                onClear: () => setFilter("warehouse_id", undefined),
            }
            : null,
        false && filters.warehouse_ids?.length
            ? {
                key: "warehouse_ids",
                label: `Kho: ${filters.warehouse_ids?.length || 0} kho`,
                onClear: () => setFilter("warehouse_ids", undefined),
            }
            : null,
        false && filters.warehouse_code_text
            ? {
                key: "warehouse_code_text",
                label: textFilterDescription("Mã kho", filters.warehouse_code_text_op, filters.warehouse_code_text),
                onClear: () => clearTextFilter("warehouse_code_text", "warehouse_code_text_op"),
            }
            : null,
        false && filters.warehouse_name_text
            ? {
                key: "warehouse_name_text",
                label: textFilterDescription("Tên kho", filters.warehouse_name_text_op, filters.warehouse_name_text),
                onClear: () => clearTextFilter("warehouse_name_text", "warehouse_name_text_op"),
            }
            : null,
        filters.quote_text
            ? {
                key: "quote_text",
                label: textFilterDescription("Nhóm hàng", filters.quote_text_op, filters.quote_text),
                onClear: () => clearTextFilter("quote_text", "quote_text_op"),
            }
            : null,
        filters.unit
            ? {
                key: "unit",
                label: `ĐVT: ${filters.unit}`,
                onClear: () => setFilter("unit", undefined),
            }
            : null,
        filters.nature
            ? {
                key: "nature",
                label: `Tính chất: ${natureOptions.find((item) => item.value === filters.nature)?.label || filters.nature}`,
                onClear: () => setFilter("nature", undefined),
            }
            : null,
        filters.summary_status
            ? {
                key: "summary_status",
                label: `Tình trạng: ${SUMMARY_STATUS_OPTIONS.find((item) => item.value === filters.summary_status)?.label || filters.summary_status}`,
                onClear: () => setFilter("summary_status", undefined),
            }
            : null,
        filters.closing_quantity_value !== undefined && filters.closing_quantity_value !== ""
            ? {
                key: "closing_quantity",
                label: numberFilterDescription("Tồn cuối kỳ", filters.closing_quantity_op, filters.closing_quantity_value),
                onClear: () => clearNumberFilter("closing_quantity_op", "closing_quantity_value"),
            }
            : null,
    ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>

    const clearAllActiveFilters = () => {
        onKeywordChange("")
        onFiltersChange({
            ...filters,
            product_id: undefined,
            product_ids: undefined,
            warehouse_id: undefined,
            warehouse_ids: undefined,
            product_text: undefined,
            product_text_op: undefined,
            product_code_text: undefined,
            product_code_text_op: undefined,
            product_name_text: undefined,
            product_name_text_op: undefined,
            warehouse_code_text: undefined,
            warehouse_code_text_op: undefined,
            warehouse_name_text: undefined,
            warehouse_name_text_op: undefined,
            quote_text: undefined,
            quote_text_op: undefined,
            unit: undefined,
            nature: undefined,
            summary_status: undefined,
            closing_quantity_op: undefined,
            closing_quantity_value: undefined,
        })
    }

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric
                    icon={Package}
                    label="Tồn đầu kỳ"
                    quantity={summaryTotals.opening_quantity}
                    value={summaryTotals.opening_value}
                    showValue={showValues}
                />
                <SummaryMetric
                    icon={TrendingUp}
                    label="Nhập kho"
                    quantity={summaryTotals.inbound_quantity}
                    value={summaryTotals.inbound_value}
                    tone="in"
                    showValue={showValues}
                />
                <SummaryMetric
                    icon={TrendingDown}
                    label="Xuất kho"
                    quantity={summaryTotals.outbound_quantity}
                    value={summaryTotals.outbound_value}
                    tone="out"
                    showValue={showValues}
                />
                <SummaryMetric
                    icon={Warehouse}
                    label="Tồn cuối kỳ"
                    quantity={summaryTotals.closing_quantity}
                    value={summaryTotals.closing_value}
                    tone="stock"
                    showValue={showValues}
                />
            </div>

            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="bg-muted/40 border-b px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm mã hàng, tên hàng, ĐVT, kho, nhóm hàng, tính chất..."
                            wrapperClassName="relative h-10 min-w-[220px] flex-[1_1_240px] xl:max-w-[320px]"
                            className={cn(controlClass, "pl-10")}
                        />

                        <ProductMultiFilter
                            className="min-w-[280px] flex-[1.6_1_320px] xl:max-w-[460px]"
                            value={filters.product_ids}
                            onChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    product_id: undefined,
                                    product_ids: value,
                                })
                            }
                        />

                        <WarehouseTreeFilter
                            value={filters.warehouse_ids || []}
                            onChange={(value) =>
                                onFiltersChange({
                                    ...filters,
                                    warehouse_id: undefined,
                                    warehouse_ids: value.length ? value : undefined,
                                })
                            }
                        />

                        <DatePicker
                            className="h-10 min-w-[170px] flex-1 [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.from_date}
                            onChange={(value) => setFilter("from_date", value || undefined)}
                            disabled={(date) => {
                                const value = dateToYmd(date)
                                return value > today || Boolean(filters.to_date && value > filters.to_date)
                            }}
                            placeholder="Từ ngày"
                        />

                        <DatePicker
                            className="h-10 min-w-[170px] flex-1 [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.to_date}
                            onChange={(value) => setFilter("to_date", value || undefined)}
                            disabled={(date) => {
                                const value = dateToYmd(date)
                                return Boolean(filters.from_date && value < filters.from_date)
                            }}
                            placeholder="Đến ngày"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {activeFilterChips.length ? (
                        <div className="flex flex-wrap items-center gap-2 border-b bg-white px-4 py-2">
                            {activeFilterChips.map((chip) => (
                                <Badge key={chip.key} variant="secondary" className="gap-1.5 rounded-md font-medium">
                                    {chip.label}
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={chip.onClear}
                                        aria-label={`Xóa bộ lọc ${chip.label}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={clearAllActiveFilters}
                            >
                                <X className="mr-1 h-3 w-3" />
                                Xóa tất cả
                            </Button>
                        </div>
                    ) : null}
                    <StickyReportTable
                        columnWidths={showValues
                            ? [64, 150, 320, 90, 150, 220, 130, 140, 130, 140, 130, 130, 140, 130, 140, 180, 120, 150, 120]
                            : [64, 150, 320, 90, 150, 220, 130, 130, 130, 130, 180, 120, 150, 120]}
                        renderHeader={() => (
                            <>
                                <tr>
                                    <Th rowSpan={showValues ? 2 : 1} className="text-center">STT</Th>
                                    <Th rowSpan={showValues ? 2 : 1} className="min-w-[150px]">
                                        <ColumnTextFilter
                                            label="Mã hàng"
                                            value={filters.product_code_text}
                                            op={filters.product_code_text_op}
                                            onApply={(value, op) => setTextFilter("product_code_text", "product_code_text_op", value, op)}
                                            onClear={() => clearTextFilter("product_code_text", "product_code_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1} className="min-w-[300px]">
                                        <ColumnTextFilter
                                            label="Tên hàng"
                                            value={filters.product_name_text}
                                            op={filters.product_name_text_op}
                                            onApply={(value, op) => setTextFilter("product_name_text", "product_name_text_op", value, op)}
                                            onClear={() => clearTextFilter("product_name_text", "product_name_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1}>
                                        <ColumnSelectFilter
                                            label="ĐVT"
                                            value={filters.unit}
                                            options={UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit }))}
                                            onChange={(value) => setFilter("unit", value)}
                                        />
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1} className="min-w-[150px]">Mã kho</Th>
                                    <Th rowSpan={showValues ? 2 : 1} className="min-w-[220px]">Tên kho</Th>
                                    <Th colSpan={showValues ? 2 : 1} className="text-center">Tồn đầu kỳ</Th>
                                    <Th colSpan={showValues ? 2 : 1} className="text-center">Nhập kho</Th>
                                    <Th colSpan={showValues ? 3 : 1} className="text-center">Xuất kho</Th>
                                    <Th colSpan={showValues ? 2 : 1} className="text-center">
                                        {showValues ? (
                                            "Tồn cuối kỳ"
                                        ) : (
                                            <ColumnNumberFilter
                                                label="Tồn cuối kỳ"
                                                value={filters.closing_quantity_value}
                                                op={filters.closing_quantity_op}
                                                onApply={(value, op) => setNumberFilter("closing_quantity_op", "closing_quantity_value", value, op)}
                                                onClear={() => clearNumberFilter("closing_quantity_op", "closing_quantity_value")}
                                            />
                                        )}
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1}>
                                        <ColumnTextFilter
                                            label="Nhóm hàng"
                                            value={filters.quote_text}
                                            op={filters.quote_text_op}
                                            onApply={(value, op) => setTextFilter("quote_text", "quote_text_op", value, op)}
                                            onClear={() => clearTextFilter("quote_text", "quote_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1}>
                                        <ColumnSelectFilter
                                            label="Tính chất"
                                            value={filters.nature}
                                            options={natureOptions}
                                            onChange={(value) => setFilter("nature", value)}
                                        />
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1}>
                                        <ColumnSelectFilter
                                            label="Tình trạng"
                                            value={filters.summary_status}
                                            options={SUMMARY_STATUS_OPTIONS}
                                            onChange={(value) => setFilter("summary_status", value)}
                                        />
                                    </Th>
                                    <Th rowSpan={showValues ? 2 : 1}>Dạng hàng</Th>
                                </tr>
                                {showValues ? (
                                <tr>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá xuất BQ</Th>
                                    <Th>Giá trị</Th>
                                    <Th>
                                        <ColumnNumberFilter
                                            label="Số lượng"
                                            value={filters.closing_quantity_value}
                                            op={filters.closing_quantity_op}
                                            onApply={(value, op) => setNumberFilter("closing_quantity_op", "closing_quantity_value", value, op)}
                                            onClear={() => clearNumberFilter("closing_quantity_op", "closing_quantity_value")}
                                        />
                                    </Th>
                                    <Th>Giá trị</Th>
                                </tr>
                                ) : null}
                            </>
                        )}
                        renderBody={() => (
                            <>
                                {data.map((item, index) => (
                                    <SummaryRow
                                        key={`${item.product_id}-${item.warehouse_id ?? "warehouse"}-${index}`}
                                        index={pagination.pageIndex * pagination.pageSize + index + 1}
                                        item={item}
                                        showValues={showValues}
                                    />
                                ))}
                            </>
                        )}
                        renderFooter={() => (
                            <>
                                <tr>
                                    <Td colSpan={6}>Tổng cộng theo bộ lọc</Td>
                                    <NumberTd>{summaryTotals.opening_quantity}</NumberTd>
                                    {showValues ? (
                                    <MoneyTd>{summaryTotals.opening_value}</MoneyTd>
                                    ) : null}
                                    <NumberTd>{summaryTotals.inbound_quantity}</NumberTd>
                                    {showValues ? (
                                    <MoneyTd>{summaryTotals.inbound_value}</MoneyTd>
                                    ) : null}
                                    <NumberTd>{summaryTotals.outbound_quantity}</NumberTd>
                                    {showValues ? (
                                    <MoneyTd>-</MoneyTd>
                                    ) : null}
                                    {showValues ? (
                                    <MoneyTd>{summaryTotals.outbound_value}</MoneyTd>
                                    ) : null}
                                    <NumberTd>{summaryTotals.closing_quantity}</NumberTd>
                                    {showValues ? (
                                    <MoneyTd>{summaryTotals.closing_value}</MoneyTd>
                                    ) : null}
                                    <Td colSpan={4} />
                                </tr>
                            </>
                        )}
                    />

                    {!data.length ? (
                        <div className="text-muted-foreground flex min-h-[180px] items-center justify-center text-sm">
                            Không tìm thấy dữ liệu nhập xuất tồn.
                        </div>
                    ) : null}
                </CardContent>

                <div className="bg-muted/30 border-t px-4 py-3">
                    <CardPagination
                        pageIndex={pagination.pageIndex}
                        pageCount={pageCount}
                        onPageChange={setPageIndex}
                        className="px-0"
                    />
                </div>
            </Card>
        </div>
    )
}

function SummaryRow({ index, item, showValues }: { index: number; item: InventorySummary; showValues: boolean }) {
    const status = getInventoryStatus(item)

    return (
        <tr className="hover:bg-muted/30 border-b">
            <Td className="text-muted-foreground text-center font-mono">{formatNumber(index)}</Td>
            <Td className="text-muted-foreground text-center font-mono text-xs">
                {item.product_code || "-"}
            </Td>
            <Td className="font-semibold text-foreground">
                {item.product_name || "-"}
            </Td>
            <Td className="text-muted-foreground text-center">{item.unit || "-"}</Td>
            <Td className="text-muted-foreground text-center font-mono text-xs">
                {item.warehouse_code || "-"}
            </Td>
            <Td className="text-center text-xs">
                {item.warehouse_name || "-"}
            </Td>
            <NumberTd>{item.opening_quantity}</NumberTd>
            {showValues ? (
            <MoneyTd>{item.opening_value}</MoneyTd>
            ) : null}
            <NumberTd>{item.inbound_quantity}</NumberTd>
            {showValues ? (
            <MoneyTd>{item.inbound_value}</MoneyTd>
            ) : null}
            <NumberTd>{item.outbound_quantity}</NumberTd>
            {showValues ? (
            <MoneyTd>{item.avg_issue_unit_cost ?? 0}</MoneyTd>
            ) : null}
            {showValues ? (
            <MoneyTd>{item.outbound_value}</MoneyTd>
            ) : null}
            <NumberTd className={Number(item.closing_quantity || 0) < 0 ? "text-destructive font-bold" : ""}>
                {item.closing_quantity}
            </NumberTd>
            {showValues ? (
            <MoneyTd>{item.closing_value}</MoneyTd>
            ) : null}
            <Td className="text-center text-xs">
                {item.quote_name || "-"}
            </Td>
            <Td className="text-center text-xs">{item.nature || "-"}</Td>
            <Td className="text-center">
                <Badge variant={status.variant} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", status.className)}>
                    <status.icon className="h-3.5 w-3.5 shrink-0" />
                    {status.label}
                </Badge>
            </Td>
            <Td className="text-center text-muted-foreground">-</Td>
        </tr>
    )
}

function WarehouseTreeFilter({
    value,
    onChange,
}: {
    value: number[]
    onChange: (value: number[]) => void
}) {
    const [open, setOpen] = useState(false)
    const [draftValue, setDraftValue] = useState<number[]>(value)
    const [warehouseKeyword, setWarehouseKeyword] = useState("")
    const selected = useMemo(() => new Set(draftValue), [draftValue])
    const appliedSelected = useMemo(() => new Set(value), [value])

    useEffect(() => {
        if (open) {
            setDraftValue(value)
            setWarehouseKeyword("")
        }
    }, [open, value])

    const { data: physicalData, isLoading: loadingPhysical } = useQuery({
        queryKey: ["inventory-summary-physical-warehouses"],
        queryFn: () => listPhysicalWarehouses({ page: 1, size: 500, status: "ACTIVE" }),
    })
    const { data: warehouseData, isLoading: loadingWarehouses } = useQuery({
        queryKey: ["inventory-summary-warehouses"],
        queryFn: () => listWarehouses({ page: 1, size: 1000, status: "ACTIVE" }),
    })

    const physicalWarehouses = physicalData?.items || []
    const warehouses = warehouseData?.items || []
    const warehousesByPhysical = useMemo(() => {
        const map = new Map<number, any[]>()
        for (const warehouse of warehouses) {
            const physicalId = Number(warehouse.physical_warehouse_id || 0)
            if (!map.has(physicalId)) map.set(physicalId, [])
            map.get(physicalId)!.push(warehouse)
        }
        return map
    }, [warehouses])

    const selectedWarehouses = useMemo(
        () => warehouses.filter((warehouse: any) => appliedSelected.has(Number(warehouse.id))),
        [warehouses, appliedSelected],
    )
    const triggerLabel = selectedWarehouses.length
        ? selectedWarehouses.length <= 2
            ? selectedWarehouses.map((warehouse: any) => warehouse.name).join(", ")
            : `${selectedWarehouses.length} kho đã chọn`
        : "Chọn kho"

    const setSelected = (ids: number[]) => {
        setDraftValue(Array.from(new Set(ids)).sort((a, b) => a - b))
    }

    const togglePhysical = (physicalId: number) => {
        const childIds = (warehousesByPhysical.get(physicalId) || []).map((warehouse: any) => Number(warehouse.id))
        if (!childIds.length) return

        const allSelected = childIds.every((id) => selected.has(id))
        if (allSelected) {
            setSelected(draftValue.filter((id) => !childIds.includes(id)))
            return
        }
        setSelected([...draftValue, ...childIds])
    }

    const toggleWarehouse = (warehouseId: number) => {
        if (selected.has(warehouseId)) {
            setSelected(draftValue.filter((id) => id !== warehouseId))
            return
        }
        setSelected([...draftValue, warehouseId])
    }

    const filteredWarehouses = useMemo(() => {
        const keyword = warehouseKeyword.trim().toLowerCase()
        if (!keyword) return warehouses
        return warehouses.filter((warehouse: any) => {
            const text = `${warehouse.code || ""} ${warehouse.name || ""}`.toLowerCase()
            return text.includes(keyword)
        })
    }, [warehouses, warehouseKeyword])

    const allWarehouseIds = useMemo(() => warehouses.map((warehouse: any) => Number(warehouse.id)), [warehouses])
    const filteredWarehouseIds = useMemo(() => filteredWarehouses.map((warehouse: any) => Number(warehouse.id)), [filteredWarehouses])
    const selectedAllCount = allWarehouseIds.filter((id) => selected.has(id)).length
    const selectedFilteredCount = filteredWarehouseIds.filter((id) => selected.has(id)).length
    const allPhysicalChecked =
        selectedAllCount === 0 ? false : selectedAllCount === allWarehouseIds.length ? true : "indeterminate"
    const filteredWarehousesChecked =
        selectedFilteredCount === 0 ? false : selectedFilteredCount === filteredWarehouseIds.length ? true : "indeterminate"

    const toggleAllWarehouses = (ids: number[]) => {
        if (!ids.length) return
        const allSelected = ids.every((id) => selected.has(id))
        if (allSelected) {
            setSelected(draftValue.filter((id) => !ids.includes(id)))
            return
        }
        setSelected([...draftValue, ...ids])
    }

    const loading = loadingPhysical || loadingWarehouses

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(controlClass, "min-w-[240px] flex-[1_1_280px] justify-start overflow-hidden px-3 text-left font-normal xl:max-w-[360px]")}
                >
                    <Warehouse className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{triggerLabel}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[720px] max-w-[calc(100vw-32px)] p-0">
                <div className="grid max-h-[420px] grid-cols-[260px_1fr] overflow-hidden">
                    <div className="border-r bg-muted/30">
                        <div className="border-b px-3 py-2 text-sm font-semibold">Địa điểm kho</div>
                        <label className="mx-2 mt-2 flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-white">
                            <Checkbox
                                checked={allPhysicalChecked}
                                disabled={!allWarehouseIds.length}
                                onCheckedChange={() => toggleAllWarehouses(allWarehouseIds)}
                                className="mt-0.5"
                            />
                            <span className="min-w-0">
                                <span className="block truncate font-medium">Chọn tất cả</span>
                                <span className="text-xs text-muted-foreground">{selectedAllCount}/{allWarehouseIds.length} kho</span>
                            </span>
                        </label>
                        <div className="max-h-[318px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Đang tải...</div>
                            ) : physicalWarehouses.length ? (
                                physicalWarehouses.map((physical: any) => {
                                    const childIds = (warehousesByPhysical.get(Number(physical.id)) || []).map((warehouse: any) => Number(warehouse.id))
                                    const checkedCount = childIds.filter((id) => selected.has(id)).length
                                    const checked = checkedCount === 0 ? false : checkedCount === childIds.length ? true : "indeterminate"
                                    return (
                                        <label
                                            key={physical.id}
                                            className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-white"
                                        >
                                            <Checkbox
                                                checked={checked}
                                                disabled={!childIds.length}
                                                onCheckedChange={() => togglePhysical(Number(physical.id))}
                                                className="mt-0.5"
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{physical.name}</span>
                                                <span className="text-xs text-muted-foreground">{checkedCount}/{childIds.length} kho</span>
                                            </span>
                                        </label>
                                    )
                                })
                            ) : (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Chưa có địa điểm kho.</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="space-y-2 border-b px-3 py-2">
                            <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Kho</div>
                            {draftValue.length ? (
                                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelected([])}>
                                    Xóa chọn
                                </Button>
                            ) : null}
                            </div>
                            <Input
                                value={warehouseKeyword}
                                onChange={(event) => setWarehouseKeyword(event.target.value)}
                                placeholder="Tìm kho"
                                className="h-9"
                            />
                            <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted/50">
                                <Checkbox
                                    checked={filteredWarehousesChecked}
                                    disabled={!filteredWarehouseIds.length}
                                    onCheckedChange={() => toggleAllWarehouses(filteredWarehouseIds)}
                                />
                                <span className="min-w-0 flex-1 truncate font-medium">Chọn tất cả kết quả</span>
                                <span className="text-xs text-muted-foreground">{selectedFilteredCount}/{filteredWarehouseIds.length}</span>
                            </label>
                        </div>
                        <div className="max-h-[318px] overflow-y-auto p-2">
                            {loading ? (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Đang tải...</div>
                            ) : filteredWarehouses.length ? (
                                filteredWarehouses.map((warehouse: any) => {
                                    const physical = physicalWarehouses.find((item: any) => Number(item.id) === Number(warehouse.physical_warehouse_id))
                                    return (
                                        <label
                                            key={warehouse.id}
                                            className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                checked={selected.has(Number(warehouse.id))}
                                                onCheckedChange={() => toggleWarehouse(Number(warehouse.id))}
                                                className="mt-0.5"
                                            />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{warehouse.name}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{physical?.name || "Chưa gắn địa điểm kho"}</span>
                                            </span>
                                        </label>
                                    )
                                })
                            ) : (
                                <div className="px-2 py-3 text-sm text-muted-foreground">Chưa có kho.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between border-t px-3 py-2">
                    <div className="text-xs text-muted-foreground">{draftValue.length ? `${draftValue.length} kho đang chọn` : "Chưa chọn kho"}</div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setDraftValue(value)
                                setOpen(false)
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                onChange(draftValue)
                                setOpen(false)
                            }}
                        >
                            Áp dụng
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function ColumnTextFilter({
    label,
    value,
    op,
    onApply,
    onClear,
}: {
    label: string
    value?: string
    op?: TextFilterOp
    onApply: (value: string, op: TextFilterOp) => void
    onClear: () => void
}) {
    const [open, setOpen] = useState(false)
    const [draftValue, setDraftValue] = useState(value || "")
    const [draftOp, setDraftOp] = useState<TextFilterOp>(op || "contains")
    const active = Boolean(value)
    const normalizedLabel = label.toLowerCase()

    if (normalizedLabel.includes("kho")) {
        return <span>{label}</span>
    }

    const apply = () => {
        onApply(draftValue, draftOp)
        setOpen(false)
    }

    const clear = () => {
        setDraftValue("")
        setDraftOp("contains")
        onClear()
        setOpen(false)
    }

    return (
        <div className="flex items-center justify-center gap-1">
            <span>{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", active && "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800")}
                        onClick={() => {
                            setDraftValue(value || "")
                            setDraftOp(op || "contains")
                        }}
                    >
                        <Funnel className="h-3.5 w-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 space-y-3 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">Lọc {label.toLowerCase()}</div>
                        <Select value={draftOp} onValueChange={(next) => setDraftOp(next as TextFilterOp)}>
                            <SelectTrigger className="h-7 w-auto border-0 bg-transparent px-1 text-xs font-semibold shadow-none focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {TEXT_FILTER_OPERATORS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Input
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") apply()
                        }}
                        placeholder={`Nhập ${label.toLowerCase()}`}
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clear}>
                            Xóa
                        </Button>
                        <Button type="button" size="sm" onClick={apply}>
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function ColumnNumberFilter({
    label,
    value,
    op,
    onApply,
    onClear,
}: {
    label: string
    value?: string
    op?: NumberFilterOp
    onApply: (value: string, op: NumberFilterOp) => void
    onClear: () => void
}) {
    const [open, setOpen] = useState(false)
    const [draftValue, setDraftValue] = useState(value || "0")
    const [draftOp, setDraftOp] = useState<NumberFilterOp>(op || "gt")
    const active = value !== undefined && value !== ""

    const apply = () => {
        onApply(draftValue, draftOp)
        setOpen(false)
    }

    const clear = () => {
        setDraftValue("0")
        setDraftOp("gt")
        onClear()
        setOpen(false)
    }

    return (
        <div className="flex items-center justify-center gap-1">
            <span>{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", active && "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800")}
                        onClick={() => {
                            setDraftValue(value || "0")
                            setDraftOp(op || "gt")
                        }}
                    >
                        <Funnel className="h-3.5 w-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 space-y-3 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">Lọc {label.toLowerCase()}</div>
                        <Select value={draftOp} onValueChange={(next) => setDraftOp(next as NumberFilterOp)}>
                            <SelectTrigger className="h-7 w-auto border-0 bg-transparent px-1 text-xs font-semibold shadow-none focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {NUMBER_FILTER_OPERATORS.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Input
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") apply()
                        }}
                        inputMode="decimal"
                        placeholder="Nhập số lượng"
                    />
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clear}>
                            Xóa
                        </Button>
                        <Button type="button" size="sm" onClick={apply}>
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function ColumnWarehouseFilter({
    label,
    value,
    onChange,
}: {
    label: string
    value?: number
    onChange: (value: number | undefined) => void
}) {
    const active = Boolean(value)

    return (
        <div className="flex items-center justify-center gap-1">
            <span>{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", active && "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800")}
                    >
                        <Funnel className="h-3.5 w-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 space-y-2 p-3">
                    <div className="text-sm font-semibold">Lọc {label.toLowerCase()}</div>
                    <AsyncSelect
                        className="h-9 min-h-9 rounded-md border-slate-300 bg-white py-0"
                        autoOpen
                        value={value}
                        onChange={(next: any) => onChange(next ? Number(next) : undefined)}
                        placeholder="Tìm và chọn kho"
                        dataSource={{
                            getList: listWarehouses,
                            getById: getWarehouse,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={(warehouse: any) => ({
                            value: warehouse.id,
                            label: warehouse.name,
                        })}
                    />
                    {active ? (
                        <div className="flex justify-end">
                            <Button type="button" variant="outline" size="sm" onClick={() => onChange(undefined)}>
                                Xóa
                            </Button>
                        </div>
                    ) : null}
                </PopoverContent>
            </Popover>
            {active && (
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => onChange(undefined)}>
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}

function ColumnSelectFilter({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value?: string
    options: Array<{ value: string; label: string }>
    onChange: (value: string | undefined) => void
}) {
    const active = Boolean(value)

    return (
        <div className="flex items-center justify-center gap-1">
            <span>{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", active && "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800")}
                    >
                        <Funnel className="h-3.5 w-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-48 p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Lọc {label.toLowerCase()}</div>
                    <FilterOptionButton active={!value} onClick={() => onChange(undefined)}>
                        Tất cả
                    </FilterOptionButton>
                    {options.map((item) => (
                        <FilterOptionButton key={item.value} active={item.value === value} onClick={() => onChange(item.value)}>
                            {item.label}
                        </FilterOptionButton>
                    ))}
                </PopoverContent>
            </Popover>
            {active && (
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => onChange(undefined)}>
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}

function FilterOptionButton({
    active,
    onClick,
    children,
}: {
    active?: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            className={cn(
                "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted",
                active && "bg-teal-50 font-semibold text-teal-700",
            )}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

function SummaryMetric({
    icon: Icon,
    label,
    quantity,
    value,
    tone = "muted",
    showValue = true,
}: {
    icon: React.ElementType
    label: string
    quantity: number
    value: number
    tone?: "muted" | "in" | "out" | "stock"
    showValue?: boolean
}) {
    const toneClass = {
        muted: "bg-slate-100/80 text-slate-700 border-slate-300",
        in: "bg-emerald-100/80 text-emerald-700 border-emerald-300",
        out: "bg-rose-100/80 text-rose-700 border-rose-300",
        stock: "bg-blue-100/80 text-blue-700 border-blue-300",
    }[tone]

    return (
        <Card className={cn("gap-0 py-3 shadow-sm", toneClass)}>
            <CardContent className="px-4">
                <div className="mb-2 truncate text-center text-xs font-semibold uppercase">{label}</div>
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/70">
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(96px,max-content)] gap-x-3 gap-y-1 text-sm">
                        <span className="opacity-75">Số lượng</span>
                        <span className="text-right font-bold tabular-nums">{formatNumber(quantity || 0)}</span>
                        {showValue ? (
                            <>
                                <span className="opacity-75">Giá trị</span>
                                <span className="text-right font-bold tabular-nums">{formatCurrency(value || 0)}</span>
                            </>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function ExportInventorySummaryButton({
    keyword,
    filters,
    showValues = true,
    listFn = listInventorySummarys,
}: {
    keyword: string
    filters: SummaryFilters
    showValues?: boolean
    listFn?: (params: SummaryListParams) => Promise<any>
}) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllSummary({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword,
                product_id: filters.product_id,
                product_ids: filters.product_ids?.join(","),
                warehouse_id: filters.warehouse_id,
                warehouse_ids: filters.warehouse_ids?.length ? filters.warehouse_ids.join(",") : undefined,
                from_date: filters.from_date,
                to_date: filters.to_date,
                product_text: filters.product_text,
                product_text_op: filters.product_text_op,
                product_code_text: filters.product_code_text,
                product_code_text_op: filters.product_code_text_op,
                product_name_text: filters.product_name_text,
                product_name_text_op: filters.product_name_text_op,
                warehouse_code_text: filters.warehouse_code_text,
                warehouse_code_text_op: filters.warehouse_code_text_op,
                warehouse_name_text: filters.warehouse_name_text,
                warehouse_name_text_op: filters.warehouse_name_text_op,
                quote_text: filters.quote_text,
                quote_text_op: filters.quote_text_op,
                unit: filters.unit,
                nature: filters.nature,
                summary_status: filters.summary_status,
                closing_quantity_op: filters.closing_quantity_op,
                closing_quantity_value: filters.closing_quantity_value,
            }, listFn)

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportSummaryXlsx(rows, filters, showValues)
            toast.success(`Đã xuất ${formatNumber(rows.length)} dòng nhập xuất tồn`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button type="button" size="sm" variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Xuất Excel
        </Button>
    )
}

async function fetchAllSummary(base: SummaryListParams, listFn: (params: SummaryListParams) => Promise<any>): Promise<InventorySummary[]> {
    const all: InventorySummary[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res: any = await listFn({ ...base, page, size: EXPORT_PAGE_SIZE })
        all.push(...(res.items || []))
        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return all
}

async function exportSummaryXlsx(rows: InventorySummary[], filters: SummaryFilters, showValues: boolean) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()
    const columnGroups = exportColumnGroups(showValues)
    const columns = columnGroups.flatMap((group) => group.columns)

    const sheet = workbook.addWorksheet("Nhập xuất tồn", {
        views: [{ state: "frozen", ySplit: showValues ? 4 : 3 }],
    })

    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.getCell(1, 1).value = "BÁO CÁO TỒN KHO"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }

    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.getCell(2, 1).value = `Thời gian lọc: ${formatPeriod(filters.from_date, filters.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }
    sheet.getCell(2, 1).alignment = { horizontal: "center" }

    sheet.addRow([])
    if (showValues) {
        sheet.addRow(buildExportTopHeader(columnGroups))
        sheet.addRow(columns.map((column) => column.label))
    } else {
        sheet.addRow(columns.map((column) => column.label))
    }
    rows.forEach((row, index) => {
        sheet.addRow(columns.map((column) => normalizeCellValue(column.value(row, index), column)))
    })

    sheet.columns = columns.map((column) => ({ width: column.width ?? 18 }))
    if (showValues) {
        mergeExportHeaders(sheet, columnGroups)
    }
    applyAutoColumnWidths(sheet, columns, showValues ? 6 : 5)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: showValues ? 5 : 4, column: columns.length },
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }

    for (const rowNumber of showValues ? [4, 5] : [4]) {
        const header = sheet.getRow(rowNumber)
        header.height = 28
        header.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            cell.border = border
        })
    }

    for (let rowIndex = showValues ? 6 : 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: false,
            }
            if (column.type === "number") cell.numFmt = getExcelNumberFormat(cell.value, column)
        })
        row.height = 22
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `nhap-xuat-ton-${todayYmd()}.xlsx`)
}

function getInventoryStatus(row: InventorySummary) {
    const closing = Number(row.closing_quantity || 0)
    const inbound = Number(row.inbound_quantity || 0)
    const outbound = Number(row.outbound_quantity || 0)
    if (closing < 0) return { label: "Âm tồn", variant: "destructive" as const, className: "", icon: AlertTriangle }
    if (closing === 0) return { label: "Hết hàng", variant: "secondary" as const, className: "", icon: CircleMinus }
    if (outbound > inbound)
        return {
            label: "Giảm tồn",
            variant: "outline" as const,
            className: "border-amber-300 text-amber-700",
            icon: TrendingDown,
        }
    if (outbound < inbound)
        return {
            label: "Tăng tồn",
            variant: "outline" as const,
            className: "border-emerald-300 text-emerald-700",
            icon: TrendingUp,
        }
    return { label: "Ổn định", variant: "outline" as const, className: "", icon: CircleCheck }
}

function textFilterDescription(label: string, op: TextFilterOp | undefined, value?: string) {
    return `${label} ${textOpLabel(op)} "${value}"`
}

function textOpLabel(op?: TextFilterOp) {
    return TEXT_FILTER_OPERATORS.find((item) => item.value === (op || "contains"))?.label.toLowerCase() || "chứa"
}

function numberFilterDescription(label: string, op: NumberFilterOp | undefined, value?: string) {
    const operator = NUMBER_FILTER_OPERATORS.find((item) => item.value === (op || "eq"))?.chipLabel || "="
    return `${label} ${operator} ${value || 0}`
}

function normalizeTotals(totals?: InventorySummaryTotals): InventorySummaryTotals {
    return {
        ...emptyTotals,
        ...(totals || {}),
    }
}

function normalizeCellValue(value: string | number | null | undefined, column: ExportColumn) {
    if (value == null || value === "") return ""
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function getExcelNumberFormat(value: unknown, column: ExportColumn) {
    const numberValue = Number(value)
    if (column.numberFormat === "integer" || column.numberFormat === "money") return "#,##0"
    if (Number.isFinite(numberValue) && Number.isInteger(numberValue)) return "#,##0"
    return "#,##0.###"
}

function buildExportTopHeader(groups: ExportColumnGroup[]) {
    return groups.flatMap((group) => [
        group.label,
        ...Array(Math.max(group.columns.length - 1, 0)).fill(""),
    ])
}

function mergeExportHeaders(sheet: any, groups: ExportColumnGroup[]) {
    let columnIndex = 1
    for (const group of groups) {
        const columnCount = group.columns.length
        if (columnCount === 1) {
            sheet.mergeCells(4, columnIndex, 5, columnIndex)
        } else {
            sheet.mergeCells(4, columnIndex, 4, columnIndex + columnCount - 1)
        }
        columnIndex += columnCount
    }
}

function applyAutoColumnWidths(sheet: any, columns: ExportColumn[], firstDataRow: number) {
    sheet.columns.forEach((column: any, index: number) => {
        const config = columns[index]
        let maxLength = config?.label?.length || 8

        for (let rowIndex = firstDataRow; rowIndex <= sheet.rowCount; rowIndex++) {
            const cell = sheet.getRow(rowIndex).getCell(index + 1)
            const text = cell.value == null
                ? ""
                : typeof cell.value === "object" && "richText" in cell.value
                    ? cell.value.richText.map((part: any) => part.text).join("")
                    : String(cell.value)
            const longestLine = text.split(/\r?\n/).reduce((max: number, line: string) => Math.max(max, line.length), 0)
            maxLength = Math.max(maxLength, longestLine)
        }

        const maxWidth = config?.width ?? 18
        const minWidth = config?.type === "number" ? 10 : Math.min(maxWidth, 8)
        column.width = Math.min(Math.max(maxLength + 2, minWidth), maxWidth)
    })
}

function todayYmd() {
    return dateToYmd(new Date())
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatPeriod(fromDate?: string, toDate?: string) {
    const fromText = fromDate ? formatDate(fromDate) : "Không chọn từ ngày"
    const toText = toDate ? formatDate(toDate) : formatDate(todayYmd())
    return `${fromText} - ${toText}`
}

function formatDate(value: string) {
    const [year, month, day] = value.split("-")
    if (!year || !month || !day) return value
    return `${day}/${month}/${year}`
}

function downloadBlob(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("border-r bg-slate-100 px-3 py-2 text-center font-semibold last:border-r-0", className)} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("overflow-hidden text-ellipsis border-r px-3 py-1.5 align-middle last:border-r-0", className)} {...props} />
}

function NumberTd({ className, children }: { className?: string; children: React.ReactNode }) {
    return <Td className={cn("text-right tabular-nums", className)}>{formatNumber(Number(children || 0))}</Td>
}

function MoneyTd({ className, children }: { className?: string; children: React.ReactNode }) {
    return <Td className={cn("text-right tabular-nums", className)}>{formatCurrency(Number(children || 0))}</Td>
}
