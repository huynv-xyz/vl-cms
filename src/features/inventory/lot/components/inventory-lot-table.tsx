import { useState } from "react"
import type React from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { AlertTriangle, CalendarClock, Clock3, Funnel, HelpCircle, Package, TrendingDown, TrendingUp, Warehouse, X } from "lucide-react"

import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { ProductMultiFilter } from "@/features/inventory/components/product-multi-filter"
import { StickyReportTable } from "@/features/inventory/components/sticky-report-table"
import { WarehouseTreeFilter } from "@/features/inventory/components/warehouse-tree-filter"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type { InventoryLot } from "../data/schema"

type TextFilterOp = "contains" | "equals" | "not_equals" | "not_contains"
type NumberFilterOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte"

export type LotFilters = {
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
    lot_text?: string
    lot_text_op?: TextFilterOp
    lot_warning?: string
    closing_quantity_op?: NumberFilterOp
    closing_quantity_value?: string
}

type LotTotals = {
    lot_count?: number
    warning_count?: number
    expired_count?: number
    near_expiry_count?: number
    stale_count?: number
    opening_quantity?: number
    opening_value?: number
    inbound_quantity?: number
    inbound_value?: number
    outbound_quantity?: number
    outbound_value?: number
    closing_quantity?: number
    closing_value?: number
}

type Props = {
    data: InventoryLot[]
    totals?: LotTotals
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: LotFilters
    onFiltersChange: (f: LotFilters) => void
}

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

const LOT_WARNING_OPTIONS = [
    { value: "EXPIRED", label: "Hết hạn" },
    { value: "NEAR_EXPIRY", label: "Cận HSD 6 tháng" },
    { value: "STALE", label: "Nhập 6 tháng chưa xuất" },
]

export function InventoryLotTable({
    data,
    totals,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const setFilter = <K extends keyof LotFilters>(key: K, value: LotFilters[K] | undefined) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        })
    }

    const setTextFilter = (
        textKey: "product_text" | "product_code_text" | "product_name_text" | "warehouse_code_text" | "warehouse_name_text" | "quote_text" | "lot_text",
        opKey: "product_text_op" | "product_code_text_op" | "product_name_text_op" | "warehouse_code_text_op" | "warehouse_name_text_op" | "quote_text_op" | "lot_text_op",
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
        textKey: "product_text" | "product_code_text" | "product_name_text" | "warehouse_code_text" | "warehouse_name_text" | "quote_text" | "lot_text",
        opKey: "product_text_op" | "product_code_text_op" | "product_name_text_op" | "warehouse_code_text_op" | "warehouse_name_text_op" | "quote_text_op" | "lot_text_op",
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
        keyword ? { key: "keyword", label: `Tìm kiếm "${keyword}"`, onClear: () => onKeywordChange("") } : null,
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
        filters.product_id ? { key: "product_id", label: "Sản phẩm: đã chọn", onClear: () => setFilter("product_id", undefined) } : null,
        filters.warehouse_id ? { key: "warehouse_id", label: "Kho: đã chọn", onClear: () => setFilter("warehouse_id", undefined) } : null,
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
        filters.lot_text
            ? {
                label: textFilterDescription("Số lô", filters.lot_text_op, filters.lot_text),
                onClear: () => clearTextFilter("lot_text", "lot_text_op"),
            }
            : null,
        filters.quote_text
            ? {
                key: "quote_text",
                label: textFilterDescription("Nhóm hàng", filters.quote_text_op, filters.quote_text),
                onClear: () => clearTextFilter("quote_text", "quote_text_op"),
            }
            : null,
        filters.unit ? { key: "unit", label: `ĐVT: ${filters.unit}`, onClear: () => setFilter("unit", undefined) } : null,
        filters.lot_warning
            ? {
                key: "lot_warning",
                label: `Cảnh báo: ${LOT_WARNING_OPTIONS.find((item) => item.value === filters.lot_warning)?.label || filters.lot_warning}`,
                onClear: () => setFilter("lot_warning", undefined),
            }
            : null,
        filters.from_date ? { key: "from_date", label: `Từ ngày nhập: ${formatDate(filters.from_date)}`, onClear: () => setFilter("from_date", undefined) } : null,
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
        onFiltersChange({})
    }

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <LotMetric icon={Package} label="Tồn đầu kỳ" quantity={totals?.opening_quantity} value={totals?.opening_value} />
                <LotMetric icon={TrendingUp} label="Nhập kho" quantity={totals?.inbound_quantity} value={totals?.inbound_value} tone="in" />
                <LotMetric icon={TrendingDown} label="Xuất kho" quantity={totals?.outbound_quantity} value={totals?.outbound_value} tone="out" />
                <LotMetric icon={Warehouse} label="Tồn cuối kỳ" quantity={totals?.closing_quantity} value={totals?.closing_value} tone="stock" />
            </div>

            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="bg-muted/40 border-b px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <SearchOnBlurInput
                            value={keyword}
                            onChange={onKeywordChange}
                            placeholder="Tìm hàng hóa, kho, số lô, ĐVT, nhóm hàng, số lượng, giá trị..."
                            wrapperClassName="relative h-10 min-w-[260px] flex-[1_1_320px] xl:max-w-[520px]"
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
                            className="min-w-[240px] flex-[1_1_280px] xl:max-w-[360px]"
                        />

                        <AsyncSelect
                            className="hidden"
                            value={filters.warehouse_id}
                            onChange={(value: any) => setFilter("warehouse_id", value || undefined)}
                            placeholder="Kho hàng"
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

                        <DatePicker
                            className="h-10 min-w-[170px] flex-1 [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.from_date}
                            onChange={(value) => setFilter("from_date", value || undefined)}
                            disabled={(date) => {
                                const value = dateToYmd(date)
                                return Boolean(filters.to_date && value > filters.to_date)
                            }}
                            placeholder="Từ ngày nhập"
                        />

                        <DatePicker
                            className="h-10 min-w-[170px] flex-1 [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                            value={filters.to_date}
                            onChange={(value) => setFilter("to_date", value || undefined)}
                            disabled={(date) => {
                                const value = dateToYmd(date)
                                return Boolean(filters.from_date && value < filters.from_date)
                            }}
                            placeholder="Đến ngày nhập"
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
                        columnWidths={[64, 150, 320, 90, 150, 220, 160, 120, 120, 160, 130, 120, 130, 150, 130, 140, 130, 140, 130, 140, 130, 140, 180, 120, 120]}
                        renderHeader={() => (
                            <>
                                <tr>
                                    <Th rowSpan={2} className="text-center">STT</Th>
                                    <Th rowSpan={2} className="min-w-[150px]">
                                        <ColumnTextFilter
                                            label="Mã hàng"
                                            value={filters.product_code_text}
                                            op={filters.product_code_text_op}
                                            onApply={(value, op) => setTextFilter("product_code_text", "product_code_text_op", value, op)}
                                            onClear={() => clearTextFilter("product_code_text", "product_code_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={2} className="min-w-[300px]">
                                        <ColumnTextFilter
                                            label="Tên hàng"
                                            value={filters.product_name_text}
                                            op={filters.product_name_text_op}
                                            onApply={(value, op) => setTextFilter("product_name_text", "product_name_text_op", value, op)}
                                            onClear={() => clearTextFilter("product_name_text", "product_name_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={2}>
                                        <ColumnSelectFilter
                                            label="ĐVT"
                                            value={filters.unit}
                                            options={UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit }))}
                                            onChange={(value) => setFilter("unit", value)}
                                        />
                                    </Th>
                                    <Th rowSpan={2} className="min-w-[150px]">
                                        <ColumnTextFilter
                                            label="Mã kho"
                                            value={filters.warehouse_code_text}
                                            op={filters.warehouse_code_text_op}
                                            onApply={(value, op) => setTextFilter("warehouse_code_text", "warehouse_code_text_op", value, op)}
                                            onClear={() => clearTextFilter("warehouse_code_text", "warehouse_code_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={2} className="min-w-[220px]">
                                        <ColumnTextFilter
                                            label="Tên kho"
                                            value={filters.warehouse_name_text}
                                            op={filters.warehouse_name_text_op}
                                            onApply={(value, op) => setTextFilter("warehouse_name_text", "warehouse_name_text_op", value, op)}
                                            onClear={() => clearTextFilter("warehouse_name_text", "warehouse_name_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={2}>
                                        <ColumnTextFilter
                                            label="Số lô"
                                            value={filters.lot_text}
                                            op={filters.lot_text_op}
                                            onApply={(value, op) => setTextFilter("lot_text", "lot_text_op", value, op)}
                                            onClear={() => clearTextFilter("lot_text", "lot_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={2}>Ngày nhập</Th>
                                    <Th rowSpan={2}>HSD</Th>
                                    <Th rowSpan={2}>
                                        <WarningHeader
                                            value={filters.lot_warning}
                                            onChange={(value) => setFilter("lot_warning", value)}
                                        />
                                    </Th>
                                    <Th rowSpan={2}>Đơn giá mua</Th>
                                    <Th rowSpan={2}>PLH/ĐV</Th>
                                    <Th rowSpan={2}>Tổng PLH</Th>
                                    <Th rowSpan={2}>Giá vốn gồm PLH</Th>
                                    <Th colSpan={2} className="text-center">Tồn đầu kỳ</Th>
                                    <Th colSpan={2} className="text-center">Nhập kho</Th>
                                    <Th colSpan={2} className="text-center">Xuất kho</Th>
                                    <Th colSpan={2} className="text-center">Tồn cuối kỳ</Th>
                                    <Th rowSpan={2}>
                                        <ColumnTextFilter
                                            label="Nhóm hàng"
                                            value={filters.quote_text}
                                            op={filters.quote_text_op}
                                            onApply={(value, op) => setTextFilter("quote_text", "quote_text_op", value, op)}
                                            onClear={() => clearTextFilter("quote_text", "quote_text_op")}
                                        />
                                    </Th>
                                    <Th rowSpan={2}>Tính chất</Th>
                                    <Th rowSpan={2}>Dạng hàng</Th>
                                </tr>
                                <tr>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
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
                            </>
                        )}
                        renderBody={() => (
                            <>
                                {data.map((item, index) => (
                                    <InventoryLotRow
                                        key={`${item.id}-${index}`}
                                        index={pagination.pageIndex * pagination.pageSize + index + 1}
                                        item={item}
                                    />
                                ))}
                            </>
                        )}
                    />

                    {!data.length ? (
                        <div className="text-muted-foreground flex min-h-[180px] items-center justify-center text-sm">
                            Không tìm thấy dữ liệu tồn kho theo lô.
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

function InventoryLotRow({ index, item }: { index: number; item: InventoryLot }) {
    const openingQuantity = reportNumber(item, "opening_quantity")
    const openingValue = reportNumber(item, "opening_value")
    const inboundQuantity = reportNumber(item, "inbound_quantity")
    const inboundValue = reportNumber(item, "inbound_value")
    const outboundQuantity = reportNumber(item, "outbound_quantity")
    const outboundValue = reportNumber(item, "outbound_value")
    const closingQuantity = reportNumber(item, "closing_quantity")
    const closingValue = reportNumber(item, "closing_value")
    const productName = reportString(item, "product_name") || item.product?.name || "-"
    const productCode = reportString(item, "product_code") || item.product?.code || "-"
    const productUnit = reportString(item, "unit") || item.product?.unit || "-"
    const quoteName = reportString(item, "quote_name") || item.product?.quote_name || "-"
    const nature = reportString(item, "nature") || item.product?.nature || "-"
    const warehouseName = reportString(item, "warehouse_name") || item.warehouse?.name || "-"
    const warehouseCode = reportString(item, "warehouse_code") || item.warehouse?.code || "-"
    const lotNo = reportString(item, "lot_no") || item.lot_no || "-"
    const inboundDate = reportString(item, "inbound_date") || item.inbound_date
    const expiryDate = reportString(item, "expiry_date") || item.expiry_date
    const purchaseUnitCost = reportNumber(item, "purchase_unit_cost") || item.purchase_unit_cost || item.unit_cost || 0
    const handlingFeeUnit = reportNumber(item, "handling_fee_unit") || item.handling_fee_unit || 0
    const handlingFeeTotal = reportNumber(item, "handling_fee_total") || item.handling_fee_total || 0
    const unitCost = reportNumber(item, "unit_cost") || item.unit_cost || 0

    return (
        <tr className="hover:bg-muted/30 border-b">
            <Td className="text-muted-foreground text-center font-mono">{formatNumber(index)}</Td>
            <Td className="text-muted-foreground text-center font-mono text-xs">{productCode}</Td>
            <Td className="font-semibold text-foreground">
                {productName}
            </Td>
            <Td className="text-muted-foreground text-center">{productUnit}</Td>
            <Td className="text-muted-foreground text-center font-mono text-xs">{warehouseCode}</Td>
            <Td className="text-center">
                {warehouseName}
            </Td>
            <Td className="text-center font-mono text-xs">{lotNo}</Td>
            <Td>{formatDate(inboundDate)}</Td>
            <Td className="text-center">{formatDate(expiryDate)}</Td>
            <Td className="text-center"><LotWarningText lot={item} /></Td>
            <MoneyTd>{purchaseUnitCost}</MoneyTd>
            <MoneyTd>{handlingFeeUnit}</MoneyTd>
            <MoneyTd>{handlingFeeTotal}</MoneyTd>
            <MoneyTd className="font-semibold">{unitCost}</MoneyTd>
            <NumberTd>{openingQuantity}</NumberTd>
            <MoneyTd>{openingValue}</MoneyTd>
            <NumberTd>{inboundQuantity}</NumberTd>
            <MoneyTd>{inboundValue}</MoneyTd>
            <NumberTd>{outboundQuantity}</NumberTd>
            <MoneyTd>{outboundValue}</MoneyTd>
            <NumberTd className="font-bold text-emerald-700">{closingQuantity}</NumberTd>
            <MoneyTd className="font-semibold">{closingValue}</MoneyTd>
            <Td className="text-center">{quoteName}</Td>
            <Td className="text-center">{nature}</Td>
            <Td className="text-center">-</Td>
        </tr>
    )
}

function WarningHeader({ value, onChange }: { value?: string; onChange: (value: string | undefined) => void }) {
    const active = Boolean(value)

    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1">
                        <span>Cảnh báo</span>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                </TooltipTrigger>
                <TooltipContent sideOffset={6} className="max-w-[280px]">
                    Cảnh báo gồm: Còn 6 tháng hết hạn, Nhập 6 tháng chưa xuất, Hết hạn.
                </TooltipContent>
            </Tooltip>
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
                <PopoverContent align="start" className="w-56 p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Lọc cảnh báo</div>
                    <FilterOptionButton active={!value} onClick={() => onChange(undefined)}>
                        Tất cả
                    </FilterOptionButton>
                    {LOT_WARNING_OPTIONS.map((item) => (
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

function LotWarningText({ lot }: { lot: InventoryLot }) {
    const warning = getLotWarning(lot)
    if (!warning) return <span className="text-muted-foreground">-</span>

    return (
        <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-medium", warning.className)}>
            <warning.icon className="h-3.5 w-3.5" />
            {warning.label}
        </span>
    )
}

function getLotWarning(lot: InventoryLot) {
    const today = startOfDay(new Date())
    const expiryDate = parseLocalDate(reportString(lot, "expiry_date") || lot.expiry_date)

    if (expiryDate && expiryDate < today) {
        return { label: "Hết hạn", className: "text-destructive", icon: AlertTriangle }
    }

    if (expiryDate) {
        const days = Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000)
        if (days >= 0 && days <= 180) {
            return { label: `Còn ${formatRemainingTime(days)}`, className: "text-amber-700", icon: CalendarClock }
        }
    }

    const inboundDate = parseLocalDate(reportString(lot, "inbound_date") || lot.inbound_date)
    const quantityIn = reportNumber(lot, "closing_quantity")
    const quantityRemaining = reportNumber(lot, "closing_quantity") + reportNumber(lot, "outbound_quantity")

    if (inboundDate && monthDiff(inboundDate, today) >= 6 && quantityIn > 0 && quantityRemaining >= quantityIn) {
        return { label: "Nhập 6 tháng chưa xuất", className: "text-sky-700", icon: Clock3 }
    }

    return null
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

function FilterOptionButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            className={cn("flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted", active && "bg-teal-50 font-semibold text-teal-700")}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

function LotMetric({
    icon: Icon,
    label,
    quantity,
    value,
    tone = "muted",
}: {
    icon: React.ElementType
    label: string
    quantity?: number
    value?: number
    tone?: "muted" | "in" | "out" | "stock"
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
                <div className="mb-2 truncate text-center text-xs font-semibold uppercase tracking-wide opacity-80">
                    {label}
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/70">
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(96px,max-content)] gap-x-3 gap-y-1 text-sm">
                        <span className="opacity-75">Số lượng</span>
                        <span className="text-right font-bold tabular-nums">{formatNumber(quantity || 0)}</span>
                        <span className="opacity-75">Giá trị</span>
                        <span className="text-right font-bold tabular-nums">{formatCurrency(value || 0)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function textFilterDescription(label: string, op: TextFilterOp | undefined, value?: string) {
    return `${label} ${textOpLabel(op)} "${value}"`
}

function textOpLabel(op?: TextFilterOp) {
    return TEXT_FILTER_OPERATORS.find((item) => item.value === (op || "contains"))?.label.toLowerCase() || "chứa"
}

function numberFilterDescription(label: string, op: NumberFilterOp | undefined, value?: string) {
    const operator = NUMBER_FILTER_OPERATORS.find((item) => item.value === (op || "gt"))?.chipLabel || ">"
    return `${label} ${operator} ${value || 0}`
}

function formatRemainingTime(days: number) {
    const months = Math.floor(days / 30)
    const restDays = days % 30
    if (months <= 0) return `${restDays} ngày nữa hết hạn`
    if (restDays <= 0) return `${months} tháng nữa hết hạn`
    return `${months} tháng ${restDays} ngày nữa hết hạn`
}

function monthDiff(from: Date, to: Date) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
    if (to.getDate() < from.getDate()) months -= 1
    return months
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatDate(value?: string | null) {
    const date = parseLocalDate(value)
    if (!date) return "-"
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    return `${day}/${month}/${date.getFullYear()}`
}

function parseLocalDate(value?: string | null) {
    if (!value) return null
    const [year, month, day] = value.trim().split(/[T\s]/)[0].split("-").map(Number)
    if (!year || !month || !day) return null
    return startOfDay(new Date(year, month - 1, day))
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function reportNumber(item: InventoryLot, key: string) {
    const value = (item as any)?.[key]
    const numberValue = Number(value || 0)
    return Number.isFinite(numberValue) ? numberValue : 0
}

function reportString(item: InventoryLot, key: string) {
    const value = (item as any)?.[key]
    return value == null ? "" : String(value)
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
