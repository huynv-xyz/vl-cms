import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { AlertTriangle, CheckCircle2, CircleHelp, Clock, Funnel, Loader2, MoreHorizontal, Pencil, Printer, Trash2, Warehouse as WarehouseIcon, X } from "lucide-react"
import { toast } from "sonner"

import { listProductUnitLookups } from "@/api/app-lookup"
import { getMyPermissions } from "@/api/auth/permission"
import {
    applyPurchaseLotChange,
    applyPurchaseProductChange,
    applyPurchaseQuantityChange,
    applyPurchasePostingDateTimeChange,
    applyDocumentPostingTimeChange,
    applyInboundWarehouseChange,
    applyLedgerAmountChange,
    applyLegacyPostingTimeNormalization,
    applyOtherExportLineDelete,
    applyOtherInboundLineDelete,
    applyReturnWarehouseChange,
    applySalesExportLotChange,
    applySalesExportWarehouseChange,
    applySalesReturnProductChange,
    applySalesReturnUnitPriceChange,
    applyTransferExportWarehouseChange,
    updateInventoryLedgerStaticParameters,
    checkPurchaseLotChange,
    checkPurchaseProductChange,
    checkPurchaseQuantityChange,
    checkPurchasePostingDateTimeChange,
    checkDocumentPostingTimeChange,
    checkInboundWarehouseChange,
    checkLedgerAmountChange,
    checkLegacyPostingTimeNormalization,
    checkOtherExportLineDelete,
    checkOtherInboundLineDelete,
    checkReturnWarehouseChange,
    checkSalesExportLotChange,
    checkSalesExportWarehouseChange,
    checkSalesReturnProductChange,
    checkSalesReturnUnitPriceChange,
    checkTransferExportWarehouseChange,
    getTransferExportWarehouseChangeContext,
    listSalesExportWarehouseChangeLots,
    listTransferExportWarehouseChangeLots,
    type InventoryLedgerStaticParametersPayload,
    type InboundWarehouseChangeResult,
    type LedgerAmountChangeResult,
    type LegacyPostingTimeNormalizationResult,
    type PurchaseLotChangeResult,
    type PurchaseProductChangeResult,
    type PurchaseQuantityChangeResult,
    type PurchasePostingDateTimeChangeResult,
    type DocumentPostingTimeChangeResult,
    type OtherExportLineDeleteResult,
    type OtherInboundLineDeleteResult,
    type ReturnWarehouseChangeResult,
    type SalesExportLotChangeResult,
    type SalesExportWarehouseAvailableLot,
    type SalesExportWarehouseChangeResult,
    type SalesExportWarehouseLotAllocation,
    type SalesReturnProductChangeResult,
    type SalesReturnUnitPriceChangeResult,
    type TransferExportWarehouseAvailableLot,
    type TransferExportWarehouseChangeResult,
} from "@/api/inventory/ledger"
import { getVoucherPrintDetail, listVoucherTypes, VOUCHER_TYPE_LABEL, type InventoryVoucherPrintDetail, type InventoryVoucherType } from "@/api/inventory/voucher"
import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { ProductMultiFilter } from "@/features/inventory/components/product-multi-filter"
import { StickyReportTable } from "@/features/inventory/components/sticky-report-table"
import { WarehouseTreeFilter } from "@/features/inventory/components/warehouse-tree-filter"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatNumber } from "@/lib/utils"
import type { InventoryLedgerReportRow, InventoryLedgerTotals } from "../data/schema"
import { getDocTypeMeta } from "../data/schema"
import type { Warehouse } from "@/features/warehouse/data/schema"

type TextFilterOp = "contains" | "equals" | "not_equals" | "not_contains"

type Props = {
    data: InventoryLedgerReportRow[]
    totals?: InventoryLedgerTotals
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        warehouse_id?: number
        warehouse_ids?: number[]
        product_ids?: string[]
        doc_type?: string
        from_date?: string
        to_date?: string
        doc_text?: string
        doc_text_op?: string
        description_text?: string
        description_text_op?: string
        supplier_text?: string
        supplier_text_op?: string
        product_text?: string
        product_text_op?: string
        product_code_text?: string
        product_code_text_op?: string
        product_name_text?: string
        product_name_text_op?: string
        warehouse_code_text?: string
        warehouse_code_text_op?: string
        warehouse_name_text?: string
        warehouse_name_text_op?: string
        unit?: string
        lot_text?: string
        lot_text_op?: string
        time_sort?: "asc" | "desc" | string
    }
    onFiltersChange: (f: Props["filters"]) => void
    direction?: "IN" | "OUT"
    showValues?: boolean
}

const controlClass = "h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs"

const TEXT_FILTER_OPERATORS: Array<{ value: TextFilterOp; label: string }> = [
    { value: "contains", label: "Chứa" },
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Khác" },
    { value: "not_contains", label: "Không chứa" },
]

function splitFilterValues(value?: string) {
    return (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
}

function joinFilterValues(values: string[]) {
    const unique = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
    return unique.length ? unique.join(",") : undefined
}

function filterValueLabels(value: string | undefined, options: Array<{ value: string; label: string }>) {
    const optionMap = new Map(options.map((option) => [option.value, option.label]))
    return splitFilterValues(value)
        .map((item) => optionMap.get(item) || item)
        .join(", ")
}

function uniqueOptions(options: Array<{ value: string; label: string }>) {
    const map = new Map<string, { value: string; label: string }>()
    options.forEach((option) => {
        const value = option.value.trim()
        if (value && !map.has(value)) {
            map.set(value, { value, label: option.label.trim() || value })
        }
    })
    return Array.from(map.values())
}

export function InventoryLedgerTable({
    data,
    totals,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
    direction,
    showValues = true,
}: Props) {
    const filterTotals = {
        opening_quantity: 0,
        opening_value: 0,
        inbound_quantity: 0,
        inbound_value: 0,
        outbound_quantity: 0,
        outbound_value: 0,
        closing_quantity: 0,
        closing_value: 0,
        ...(totals || {}),
    }
    const [detailVoucherId, setDetailVoucherId] = useState<number | null>(null)
    const [detailVoucherRefreshKey, setDetailVoucherRefreshKey] = useState(0)
    const [lotChangeRow, setLotChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [salesExportLotChangeRow, setSalesExportLotChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [salesExportWarehouseChangeRow, setSalesExportWarehouseChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [transferWarehouseChangeRow, setTransferWarehouseChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [returnWarehouseChangeRow, setReturnWarehouseChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [inboundWarehouseChangeRow, setInboundWarehouseChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [salesReturnUnitPriceChangeRow, setSalesReturnUnitPriceChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [ledgerAmountChangeRow, setLedgerAmountChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [purchaseQuantityChangeRow, setPurchaseQuantityChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [purchasePostingDateTimeChangeRow, setPurchasePostingDateTimeChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [purchaseProductChangeRow, setPurchaseProductChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [salesReturnProductChangeRow, setSalesReturnProductChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [documentPostingTimeChangeRow, setDocumentPostingTimeChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [legacyPostingTimeNormalizationRow, setLegacyPostingTimeNormalizationRow] = useState<InventoryLedgerReportRow | null>(null)
    const [otherExportLineDeleteRow, setOtherExportLineDeleteRow] = useState<InventoryLedgerReportRow | null>(null)
    const [otherInboundLineDeleteRow, setOtherInboundLineDeleteRow] = useState<InventoryLedgerReportRow | null>(null)
    const [staticParametersRow, setStaticParametersRow] = useState<InventoryLedgerReportRow | null>(null)
    const queryClient = useQueryClient()
    const { data: inboundDocTypes = [] } = useQuery({
        queryKey: ["inventory-voucher-types", "I"],
        queryFn: () => listVoucherTypes("I"),
    })
    const { data: outboundDocTypes = [] } = useQuery({
        queryKey: ["inventory-voucher-types", "O"],
        queryFn: () => listVoucherTypes("O"),
    })
    const allDocTypeOptions = useMemo(
        () => [...inboundDocTypes, ...outboundDocTypes].map((type) => ({ value: type.code, label: type.name })),
        [inboundDocTypes, outboundDocTypes],
    )
    const { data: unitLookupPage } = useQuery({
        queryKey: ["inventory-ledger-product-unit-lookups"],
        queryFn: () => listProductUnitLookups({ page: 1, size: 200 }),
    })
    const unitOptions = useMemo(() => {
        const selected = splitFilterValues(filters.unit).map((unit) => ({ value: unit, label: unit }))
        const fromLookup = (unitLookupPage?.items ?? []).map((item) => ({
            value: item.name || item.code,
            label: item.name || item.code,
        }))
        return uniqueOptions([...selected, ...fromLookup])
    }, [filters.unit, unitLookupPage])
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUseLedgerCorrections = useMemo(
        () => hasPermission(permissions, "inventory.ledgers", "correction.change"),
        [permissions],
    )
    const canUseScopedLedgerCorrections = useMemo(
        () => hasPermission(permissions, "inventory.ledgers", "scoped-correction.change"),
        [permissions],
    )
    const canUseLedgerPriceCorrections = useMemo(
        () => canUseLedgerCorrections || hasPermission(permissions, "inventory.ledgers", "price-correction.change"),
        [canUseLedgerCorrections, permissions],
    )

    const setFilter = (key: keyof Props["filters"], value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        })
    }
    const timeSort = filters.time_sort === "desc" ? "desc" : "asc"

    const setTextFilter = (
        textKey: "doc_text" | "description_text" | "supplier_text" | "product_text" | "product_code_text" | "product_name_text" | "warehouse_code_text" | "warehouse_name_text" | "lot_text",
        opKey: "doc_text_op" | "description_text_op" | "supplier_text_op" | "product_text_op" | "product_code_text_op" | "product_name_text_op" | "warehouse_code_text_op" | "warehouse_name_text_op" | "lot_text_op",
        value: string,
        op: TextFilterOp,
    ) => {
        const nextValue = value.trim()
        onFiltersChange({
            ...filters,
            [textKey]: nextValue || undefined,
            [opKey]: nextValue ? op : undefined,
        })
    }

    const clearTextFilter = (
        textKey: "doc_text" | "description_text" | "supplier_text" | "product_text" | "product_code_text" | "product_name_text" | "warehouse_code_text" | "warehouse_name_text" | "lot_text",
        opKey: "doc_text_op" | "description_text_op" | "supplier_text_op" | "product_text_op" | "product_code_text_op" | "product_name_text_op" | "warehouse_code_text_op" | "warehouse_name_text_op" | "lot_text_op",
    ) => {
        onFiltersChange({
            ...filters,
            [textKey]: undefined,
            [opKey]: undefined,
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
            ? { key: "keyword", label: `Tìm kiếm "${keyword}"`, onClear: () => onKeywordChange("") }
            : null,
        filters.doc_type
            ? {
                key: "doc_type",
                label: `Loại chứng từ: ${filterValueLabels(filters.doc_type, allDocTypeOptions)}`,
                onClear: () => setFilter("doc_type", undefined),
            }
            : null,
        filters.doc_text
            ? {
                key: "doc_text",
                label: textFilterDescription("Chứng từ", filters.doc_text_op, filters.doc_text),
                onClear: () => clearTextFilter("doc_text", "doc_text_op"),
            }
            : null,
        filters.description_text
            ? {
                key: "description_text",
                label: textFilterDescription("Diễn giải", filters.description_text_op, filters.description_text),
                onClear: () => clearTextFilter("description_text", "description_text_op"),
            }
            : null,
        filters.supplier_text
            ? {
                key: "supplier_text",
                label: textFilterDescription("NCC", filters.supplier_text_op, filters.supplier_text),
                onClear: () => clearTextFilter("supplier_text", "supplier_text_op"),
            }
            : null,
        filters.product_text
            ? {
                key: "product_text",
                label: textFilterDescription("Sản phẩm", filters.product_text_op, filters.product_text),
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
        filters.warehouse_code_text
            ? {
                key: "warehouse_code_text",
                label: textFilterDescription("Mã kho", filters.warehouse_code_text_op, filters.warehouse_code_text),
                onClear: () => clearTextFilter("warehouse_code_text", "warehouse_code_text_op"),
            }
            : null,
        filters.warehouse_name_text
            ? {
                key: "warehouse_name_text",
                label: textFilterDescription("Tên kho", filters.warehouse_name_text_op, filters.warehouse_name_text),
                onClear: () => clearTextFilter("warehouse_name_text", "warehouse_name_text_op"),
            }
            : null,
        filters.unit
            ? {
                key: "unit",
                label: `ĐVT: ${filterValueLabels(filters.unit, unitOptions)}`,
                onClear: () => setFilter("unit", undefined),
            }
            : null,
        filters.lot_text
            ? {
                key: "lot_text",
                label: textFilterDescription("Số lô", filters.lot_text_op, filters.lot_text),
                onClear: () => clearTextFilter("lot_text", "lot_text_op"),
            }
            : null,
        timeSort === "desc"
            ? {
                key: "time_sort",
                label: "Thời gian: Giảm dần",
                onClear: () => setFilter("time_sort", "asc"),
            }
            : null,
    ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>

    const clearAllActiveFilters = () => {
        onKeywordChange("")
        onFiltersChange({
            ...filters,
            warehouse_id: undefined,
            warehouse_ids: undefined,
            product_ids: undefined,
            doc_type: undefined,
            doc_text: undefined,
            doc_text_op: undefined,
            description_text: undefined,
            description_text_op: undefined,
            supplier_text: undefined,
            supplier_text_op: undefined,
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
            unit: undefined,
            lot_text: undefined,
            lot_text_op: undefined,
            time_sort: "asc",
        })
    }

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="bg-muted/40 border-b px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm chứng từ, diễn giải, NCC, mã/tên hàng, ĐVT, số lô, kho, TK..."
                        wrapperClassName="relative h-10 min-w-[220px] flex-[1_1_260px] xl:max-w-[360px]"
                        className={cn(controlClass, "pl-10")}
                    />

                    <ProductMultiFilter
                        className="min-w-[280px] flex-[1.4_1_320px] xl:max-w-[440px]"
                        value={filters.product_ids}
                        onChange={(value) =>
                            onFiltersChange({
                                ...filters,
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

                    <LedgerDocTypeFilter
                        value={filters.doc_type}
                        inboundTypes={direction === "OUT" ? [] : inboundDocTypes}
                        outboundTypes={direction === "IN" ? [] : outboundDocTypes}
                        onApply={(value) => setFilter("doc_type", value)}
                    />

                    <DatePicker
                        className="min-w-[180px] flex-[0_1_190px] [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        value={filters.from_date}
                        onChange={(value) => setFilter("from_date", value || undefined)}
                        disabled={(date) => {
                            const value = dateToYmd(date)
                            return Boolean(filters.to_date && value > filters.to_date)
                        }}
                        placeholder="Từ ngày"
                    />

                    <DatePicker
                        className="min-w-[180px] flex-[0_1_190px] [&_button]:h-10 [&_button]:min-h-10 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        value={filters.to_date}
                        onChange={(value) => setFilter("to_date", value || undefined)}
                        disabled={(date) => {
                            const value = dateToYmd(date)
                            return Boolean(filters.from_date && value < filters.from_date)
                        }}
                        placeholder="Đến ngày"
                    />

                    <Select value={timeSort} onValueChange={(value) => setFilter("time_sort", value === "desc" ? "desc" : "asc")}>
                        <SelectTrigger className={cn(controlClass, "min-w-[170px] flex-[0_1_180px]")}>
                            <SelectValue placeholder="Sắp xếp thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="asc">Thời gian tăng dần</SelectItem>
                            <SelectItem value="desc">Thời gian giảm dần</SelectItem>
                        </SelectContent>
                    </Select>

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
                        ? [64, 110, 90, 180, 260, 80, 80, 150, 320, 80, 150, 160, 220, 120, 120, 140, 120, 140, 120, 140, 120, 140, 260, 180, 300, 260, 100]
                        : [64, 110, 90, 180, 260, 80, 80, 150, 320, 80, 150, 160, 220, 120, 110, 110, 120, 260, 180, 300, 260, 100]}
                    defaultPinnedUntil={8}
                    renderHeader={() => (
                        <>
                            <tr>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[56px] text-center">STT</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[110px]">Ngày</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[90px] text-center">Giờ</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[170px]">
                                    <ColumnTextFilter
                                        label="Chứng từ"
                                        value={filters.doc_text}
                                        op={filters.doc_text_op}
                                        onApply={(value, op) => setTextFilter("doc_text", "doc_text_op", value, op)}
                                        onClear={() => clearTextFilter("doc_text", "doc_text_op")}
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[260px]">
                                    <ColumnTextFilter
                                        label="Diễn giải"
                                        value={filters.description_text}
                                        op={filters.description_text_op}
                                        onApply={(value, op) => setTextFilter("description_text", "description_text_op", value, op)}
                                        onClear={() => clearTextFilter("description_text", "description_text_op")}
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[70px]">TK Nợ</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[70px]">TK Có</Th>
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
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[80px]">
                                    <ColumnMultiSelectFilter
                                        label="ĐVT"
                                        value={filters.unit}
                                        options={unitOptions}
                                        onApply={(value) => setFilter("unit", value)}
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[140px]">
                                    <ColumnTextFilter
                                        label="Số lô"
                                        value={filters.lot_text}
                                        op={filters.lot_text_op}
                                        onApply={(value, op) => setTextFilter("lot_text", "lot_text_op", value, op)}
                                        onClear={() => clearTextFilter("lot_text", "lot_text_op")}
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[160px]">
                                    <ColumnTextFilter
                                        label="Mã kho"
                                        value={filters.warehouse_code_text}
                                        op={filters.warehouse_code_text_op}
                                        onApply={(value, op) => setTextFilter("warehouse_code_text", "warehouse_code_text_op", value, op)}
                                        onClear={() => clearTextFilter("warehouse_code_text", "warehouse_code_text_op")}
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[220px]">
                                    <ColumnTextFilter
                                        label="Tên kho"
                                        value={filters.warehouse_name_text}
                                        op={filters.warehouse_name_text_op}
                                        onApply={(value, op) => setTextFilter("warehouse_name_text", "warehouse_name_text_op", value, op)}
                                        onClear={() => clearTextFilter("warehouse_name_text", "warehouse_name_text_op")}
                                    />
                                </Th>
                                {showValues ? <Th rowSpan={2} className="min-w-[120px]">Đơn giá</Th> : null}
                                <Th colSpan={showValues ? 2 : 1} className="min-w-[120px] text-center">Tồn đầu</Th>
                                <Th colSpan={showValues ? 2 : 1} className="min-w-[110px] text-center">Nhập</Th>
                                <Th colSpan={showValues ? 2 : 1} className="min-w-[110px] text-center">Xuất</Th>
                                <Th colSpan={showValues ? 2 : 1} className="min-w-[120px] text-center">Tồn sau</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[260px]">
                                    <LedgerDocTypeFilter
                                        value={filters.doc_type}
                                        inboundTypes={direction === "OUT" ? [] : inboundDocTypes}
                                        outboundTypes={direction === "IN" ? [] : outboundDocTypes}
                                        onApply={(value) => setFilter("doc_type", value)}
                                        variant="column"
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[180px] text-center">Mã đối tượng tập hợp chi phí</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[300px]">Tên đối tượng tập hợp chi phí</Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[260px]">
                                    <ColumnTextFilter
                                        label="Tên nhà cung cấp"
                                        value={filters.supplier_text}
                                        op={filters.supplier_text_op}
                                        onApply={(value, op) => setTextFilter("supplier_text", "supplier_text_op", value, op)}
                                        onClear={() => clearTextFilter("supplier_text", "supplier_text_op")}
                                    />
                                </Th>
                                <Th rowSpan={showValues ? 2 : 1} className="min-w-[100px] text-center">
                                    <LedgerCorrectionHelp />
                                </Th>
                            </tr>
                            {showValues ? (
                                <tr>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                </tr>
                            ) : null}
                        </>
                    )}
                    renderBody={() => (
                        <>
                            {(data || []).map((item, index) => (
                                <LedgerRow
                                    key={`${item.id}-${index}`}
                                    index={pagination.pageIndex * pagination.pageSize + index + 1}
                                    item={item}
                                    onOpenVoucher={setDetailVoucherId}
                                    onChangeLot={(canUseLedgerCorrections || canUseScopedLedgerCorrections) ? setLotChangeRow : undefined}
                                    onChangeSalesExportLot={canUseLedgerCorrections ? setSalesExportLotChangeRow : undefined}
                                    onChangePurchaseQuantity={(canUseLedgerCorrections || canUseScopedLedgerCorrections) ? setPurchaseQuantityChangeRow : undefined}
                                    onChangePurchaseProduct={(canUseLedgerCorrections || canUseScopedLedgerCorrections) ? setPurchaseProductChangeRow : undefined}
                                    onDeleteOtherExportLine={canUseLedgerCorrections ? setOtherExportLineDeleteRow : undefined}
                                    onDeleteOtherInboundLine={canUseLedgerCorrections ? setOtherInboundLineDeleteRow : undefined}
                                    onEditStaticParameters={canUseLedgerCorrections ? setStaticParametersRow : undefined}
                                    onNormalizeLegacyPostingTime={canUseLedgerCorrections ? setLegacyPostingTimeNormalizationRow : undefined}
                                    showValues={showValues}
                                    direction={direction}
                                />
                            ))}
                        </>
                    )}
                    renderFooter={() => (
                        <LedgerTotalsRow totals={filterTotals} showValues={showValues} direction={direction} />
                    )}
                />

                {!(data || []).length ? (
                    <div className="text-muted-foreground flex min-h-[180px] items-center justify-center text-sm">
                        Không tìm thấy dòng sổ kho.
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
            <VoucherDetailDialog
                voucherId={detailVoucherId}
                refreshKey={detailVoucherRefreshKey}
                open={!!detailVoucherId}
                onOpenChange={(open) => {
                    if (!open) setDetailVoucherId(null)
                }}
                canUseScopedCorrections={canUseLedgerCorrections || canUseScopedLedgerCorrections}
                canUseFullCorrections={canUseLedgerCorrections}
                canUsePriceCorrections={canUseLedgerPriceCorrections}
                onChangeLot={setLotChangeRow}
                onChangeSalesExportLot={setSalesExportLotChangeRow}
                onChangeSalesExportWarehouse={setSalesExportWarehouseChangeRow}
                onChangeTransferWarehouse={setTransferWarehouseChangeRow}
                onChangeReturnWarehouse={setReturnWarehouseChangeRow}
                onChangeInboundWarehouse={setInboundWarehouseChangeRow}
                onChangeLedgerAmount={setLedgerAmountChangeRow}
                onChangePurchaseQuantity={setPurchaseQuantityChangeRow}
                onChangePurchasePostingDateTime={setPurchasePostingDateTimeChangeRow}
                onChangePurchaseProduct={setPurchaseProductChangeRow}
                onChangeSalesReturnProduct={setSalesReturnProductChangeRow}
                onChangeDocumentPostingTime={setDocumentPostingTimeChangeRow}
                onChangeSalesReturnUnitPrice={setSalesReturnUnitPriceChangeRow}
                onDeleteOtherExportLine={setOtherExportLineDeleteRow}
                onDeleteOtherInboundLine={setOtherInboundLineDeleteRow}
                onNormalizeLegacyPostingTime={canUseLedgerCorrections ? setLegacyPostingTimeNormalizationRow : undefined}
            />
            <PurchaseLotChangeDialog
                row={lotChangeRow}
                open={!!lotChangeRow}
                onOpenChange={(open) => {
                    if (!open) setLotChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                }}
            />
            <SalesExportLotChangeDialog
                row={salesExportLotChangeRow}
                open={!!salesExportLotChangeRow}
                onOpenChange={(open) => {
                    if (!open) setSalesExportLotChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <SalesExportWarehouseChangeDialog
                row={salesExportWarehouseChangeRow}
                open={!!salesExportWarehouseChangeRow}
                onOpenChange={(open) => {
                    if (!open) setSalesExportWarehouseChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                    queryClient.invalidateQueries({ queryKey: ["sales-order-detail"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <ReturnWarehouseChangeDialog
                row={returnWarehouseChangeRow}
                open={!!returnWarehouseChangeRow}
                onOpenChange={(open) => {
                    if (!open) setReturnWarehouseChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <InboundWarehouseChangeDialog
                row={inboundWarehouseChangeRow}
                open={!!inboundWarehouseChangeRow}
                onOpenChange={(open) => {
                    if (!open) setInboundWarehouseChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <TransferExportWarehouseChangeDialog
                row={transferWarehouseChangeRow}
                open={!!transferWarehouseChangeRow}
                onOpenChange={(open) => {
                    if (!open) setTransferWarehouseChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                }}
            />
            <SalesReturnUnitPriceChangeDialog
                row={salesReturnUnitPriceChangeRow}
                open={!!salesReturnUnitPriceChangeRow}
                onOpenChange={(open) => {
                    if (!open) setSalesReturnUnitPriceChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                }}
            />
            <PurchaseQuantityChangeDialog
                row={purchaseQuantityChangeRow}
                open={!!purchaseQuantityChangeRow}
                showPriceData={canUseLedgerPriceCorrections}
                onOpenChange={(open) => {
                    if (!open) setPurchaseQuantityChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                }}
            />
            <PurchasePostingDateTimeChangeDialog
                row={purchasePostingDateTimeChangeRow}
                open={!!purchasePostingDateTimeChangeRow}
                onOpenChange={(open) => {
                    if (!open) setPurchasePostingDateTimeChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                }}
            />
            <LedgerAmountChangeDialog
                row={ledgerAmountChangeRow}
                open={!!ledgerAmountChangeRow}
                onOpenChange={(open) => {
                    if (!open) setLedgerAmountChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <PurchaseProductChangeDialog
                row={purchaseProductChangeRow}
                open={!!purchaseProductChangeRow}
                onOpenChange={(open) => {
                    if (!open) setPurchaseProductChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                }}
            />
            <SalesReturnProductChangeDialog
                row={salesReturnProductChangeRow}
                open={!!salesReturnProductChangeRow}
                onOpenChange={(open) => {
                    if (!open) setSalesReturnProductChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                    queryClient.invalidateQueries({ queryKey: ["sales-return-detail"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <DocumentPostingTimeChangeDialog
                row={documentPostingTimeChangeRow}
                open={!!documentPostingTimeChangeRow}
                onOpenChange={(open) => {
                    if (!open) setDocumentPostingTimeChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["sales-order-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["production-order-detail"] })
                }}
            />
            <LegacyPostingTimeNormalizationDialog
                row={legacyPostingTimeNormalizationRow}
                open={!!legacyPostingTimeNormalizationRow}
                onOpenChange={(open) => {
                    if (!open) setLegacyPostingTimeNormalizationRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <StaticParametersDialog
                row={staticParametersRow}
                open={!!staticParametersRow}
                onOpenChange={(open) => {
                    if (!open) setStaticParametersRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                }}
            />
            <OtherExportLineDeleteDialog
                row={otherExportLineDeleteRow}
                open={!!otherExportLineDeleteRow}
                onOpenChange={(open) => {
                    if (!open) setOtherExportLineDeleteRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
            <OtherInboundLineDeleteDialog
                row={otherInboundLineDeleteRow}
                open={!!otherInboundLineDeleteRow}
                onOpenChange={(open) => {
                    if (!open) setOtherInboundLineDeleteRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-voucher-detail"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-lot-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-summary-report"] })
                    queryClient.invalidateQueries({ queryKey: ["inventory-costing"] })
                    setDetailVoucherRefreshKey((value) => value + 1)
                }}
            />
        </Card>
    )
}

function ColumnTextFilter({
    label,
    value,
    op = "contains",
    onApply,
    onClear,
}: {
    label: string
    value?: string
    op?: string
    onApply: (value: string, op: TextFilterOp) => void
    onClear: () => void
}) {
    const [open, setOpen] = useState(false)
    const [draftValue, setDraftValue] = useState(value || "")
    const [draftOp, setDraftOp] = useState<TextFilterOp>(normalizeTextOp(op))
    const active = Boolean(value)

    const apply = () => {
        onApply(draftValue, draftOp)
        setOpen(false)
    }

    const clear = () => {
        setDraftValue("")
        onClear()
        setOpen(false)
    }

    return (
        <div className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap">
            <span className="truncate">{label}</span>
            <Popover
                open={open}
                onOpenChange={(next) => {
                    setOpen(next)
                    if (next) {
                        setDraftValue(value || "")
                        setDraftOp(normalizeTextOp(op))
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent",
                            active ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        aria-label={`Lọc ${label}`}
                    >
                        <Funnel className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="font-semibold text-foreground">Lọc {label}</div>
                        <Select value={draftOp} onValueChange={(next) => setDraftOp(next as TextFilterOp)}>
                            <SelectTrigger className="h-8 w-32 border-0 bg-transparent px-1 shadow-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEXT_FILTER_OPERATORS.map((operator) => (
                                    <SelectItem key={operator.value} value={operator.value}>
                                        {operator.label}
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
                    <div className="mt-3 flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clear}>
                            Xóa
                        </Button>
                        <Button type="button" size="sm" onClick={apply}>
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            {active ? (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={onClear}
                    aria-label={`Xóa lọc ${label}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : null}
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
        <div className="flex items-center justify-center gap-1.5">
            <span>{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
                            active ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        aria-label={`Lọc ${label}`}
                    >
                        <Funnel className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                    <div className="px-2 pb-2 font-semibold text-foreground">Lọc {label}</div>
                    <FilterOptionButton active={!value} label="Tất cả" onClick={() => onChange(undefined)} />
                    {options.map((option) => (
                        <FilterOptionButton
                            key={option.value}
                            active={value === option.value}
                            label={option.label}
                            onClick={() => onChange(option.value)}
                        />
                    ))}
                </PopoverContent>
            </Popover>
            {active ? (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => onChange(undefined)}
                    aria-label={`Xóa lọc ${label}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </div>
    )
}

function LedgerDocTypeFilter({
    value,
    inboundTypes,
    outboundTypes,
    onApply,
    variant = "toolbar",
}: {
    value?: string
    inboundTypes: InventoryVoucherType[]
    outboundTypes: InventoryVoucherType[]
    onApply: (value: string | undefined) => void
    variant?: "toolbar" | "column"
}) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string[]>(() => splitFilterValues(value))
    const active = splitFilterValues(value).length > 0
    const groupCount = (inboundTypes.length ? 1 : 0) + (outboundTypes.length ? 1 : 0)
    const inboundCodes = useMemo(() => inboundTypes.map((type) => type.code), [inboundTypes])
    const outboundCodes = useMemo(() => outboundTypes.map((type) => type.code), [outboundTypes])
    const inboundChecked = inboundCodes.length > 0 && inboundCodes.every((code) => selected.includes(code))
    const outboundChecked = outboundCodes.length > 0 && outboundCodes.every((code) => selected.includes(code))

    useEffect(() => {
        if (!open) setSelected(splitFilterValues(value))
    }, [open, value])

    const toggle = (code: string) => {
        setSelected((current) =>
            current.includes(code)
                ? current.filter((item) => item !== code)
                : [...current, code],
        )
    }

    const toggleMany = (codes: string[], checked: boolean) => {
        setSelected((current) => {
            const next = new Set(current)
            codes.forEach((code) => {
                if (checked) next.add(code)
                else next.delete(code)
            })
            return Array.from(next)
        })
    }

    const apply = () => {
        onApply(joinFilterValues(selected))
        setOpen(false)
    }

    const clear = () => {
        setSelected([])
        onApply(undefined)
        setOpen(false)
    }

    const trigger =
        variant === "column" ? (
            <button
                type="button"
                className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
                    active ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
                aria-label="Lọc loại chứng từ"
            >
                <Funnel className="h-4 w-4" />
            </button>
        ) : (
            <Button
                type="button"
                variant="outline"
                className={cn(
                    controlClass,
                    "min-w-[190px] flex-[0.9_1_230px] justify-between px-3 xl:max-w-[280px]",
                    active ? "border-primary/40 bg-primary/5 text-primary" : "",
                )}
            >
                <span className="truncate">
                    {active ? `Loại chứng từ (${splitFilterValues(value).length})` : "Loại chứng từ"}
                </span>
                <Funnel className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
        )

    return (
        <div className={cn(variant === "column" ? "flex items-center justify-center gap-1.5" : "")}>
            {variant === "column" ? <span>Loại</span> : null}
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className={cn(
                    "max-w-[calc(100vw-2rem)] p-3",
                    groupCount > 1 ? "w-[680px]" : "w-[420px]",
                )}
            >
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-semibold text-foreground">Lọc loại chứng từ</div>
                    {active ? (
                        <Button type="button" variant="ghost" size="sm" onClick={clear}>
                            Xóa chọn
                        </Button>
                    ) : null}
                </div>
                <div className={cn("grid gap-3", groupCount > 1 ? "md:grid-cols-2" : "")}>
                    {inboundTypes.length ? (
                        <DocTypeColumn
                            title="Chứng từ nhập"
                            allLabel="Chọn tất cả chứng từ nhập"
                            checked={inboundChecked}
                            types={inboundTypes}
                            selected={selected}
                            onToggleAll={(checked) => toggleMany(inboundCodes, checked)}
                            onToggle={toggle}
                        />
                    ) : null}
                    {outboundTypes.length ? (
                        <DocTypeColumn
                            title="Chứng từ xuất"
                            allLabel="Chọn tất cả chứng từ xuất"
                            checked={outboundChecked}
                            types={outboundTypes}
                            selected={selected}
                            onToggleAll={(checked) => toggleMany(outboundCodes, checked)}
                            onToggle={toggle}
                        />
                    ) : null}
                </div>
                {!inboundTypes.length && !outboundTypes.length ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
                        Chưa có danh mục loại chứng từ.
                    </div>
                ) : null}
                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={apply}>
                        Áp dụng
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
            {variant === "column" && active ? (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => onApply(undefined)}
                    aria-label="Xóa lọc loại chứng từ"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </div>
    )
}

function DocTypeColumn({
    title,
    allLabel,
    checked,
    types,
    selected,
    onToggleAll,
    onToggle,
}: {
    title: string
    allLabel: string
    checked: boolean
    types: InventoryVoucherType[]
    selected: string[]
    onToggleAll: (checked: boolean) => void
    onToggle: (code: string) => void
}) {
    return (
        <div className="rounded-lg border">
            <div className="border-b bg-muted/40 px-3 py-2 font-semibold">{title}</div>
            <label className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm font-medium">
                <Checkbox checked={checked} onCheckedChange={(value) => onToggleAll(value === true)} />
                <span>{allLabel}</span>
            </label>
            <div className="max-h-72 overflow-y-auto p-1">
                {types.map((type) => (
                    <label
                        key={type.code}
                        className="hover:bg-muted flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                        <Checkbox
                            className="mt-0.5"
                            checked={selected.includes(type.code)}
                            onCheckedChange={() => onToggle(type.code)}
                        />
                        <span className="leading-5">{type.name}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

function ColumnMultiSelectFilter({
    label,
    value,
    options,
    onApply,
}: {
    label: string
    value?: string
    options: Array<{ value: string; label: string }>
    onApply: (value: string | undefined) => void
}) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<string[]>(() => splitFilterValues(value))
    const active = splitFilterValues(value).length > 0

    useEffect(() => {
        if (!open) setSelected(splitFilterValues(value))
    }, [open, value])

    const toggle = (optionValue: string) => {
        setSelected((current) =>
            current.includes(optionValue)
                ? current.filter((item) => item !== optionValue)
                : [...current, optionValue],
        )
    }

    const apply = () => {
        onApply(joinFilterValues(selected))
        setOpen(false)
    }

    const clear = () => {
        setSelected([])
        onApply(undefined)
        setOpen(false)
    }

    return (
        <div className="flex items-center justify-center gap-1.5">
            <span>{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
                            active ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        aria-label={`Lọc ${label}`}
                    >
                        <Funnel className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                    <div className="px-2 pb-2 font-semibold text-foreground">Lọc {label}</div>
                    <div className="space-y-1">
                        {options.map((option) => (
                            <label
                                key={option.value}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                            >
                                <Checkbox
                                    checked={selected.includes(option.value)}
                                    onCheckedChange={() => toggle(option.value)}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clear}>
                            Xóa
                        </Button>
                        <Button type="button" size="sm" onClick={apply}>
                            Áp dụng
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            {active ? (
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => onApply(undefined)}
                    aria-label={`Xóa lọc ${label}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </div>
    )
}

function FilterOptionButton({
    label,
    active,
    onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm",
                active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground",
            )}
            onClick={onClick}
        >
            <span>{label}</span>
            {active ? <span className="text-xs">✓</span> : null}
        </button>
    )
}

function LedgerTotalsRow({
    totals,
    showValues,
    direction,
}: {
    totals: Required<InventoryLedgerTotals>
    showValues: boolean
    direction?: "IN" | "OUT"
}) {
    const displayValue = (value: number) => direction === "OUT" ? Math.abs(Number(value || 0)) : Number(value || 0)
    const labelCell = (
        <Td colSpan={13} className="bg-slate-50 text-right font-semibold text-slate-700">
            Tổng theo bộ lọc
        </Td>
    )
    const trailingCell = <Td colSpan={5} className="bg-slate-50" />

    if (!showValues) {
        return (
            <tr className="border-t-2 border-slate-300">
                {labelCell}
                <Td className="bg-slate-50 text-right font-semibold tabular-nums">{formatNumber(displayValue(totals.opening_quantity))}</Td>
                <Td className="bg-slate-50 text-right font-semibold tabular-nums text-emerald-700">{formatNumber(displayValue(totals.inbound_quantity))}</Td>
                <Td className="bg-slate-50 text-right font-semibold tabular-nums text-rose-700">{formatNumber(displayValue(totals.outbound_quantity))}</Td>
                <Td className="bg-slate-50 text-right font-semibold tabular-nums">{formatNumber(displayValue(totals.closing_quantity))}</Td>
                {trailingCell}
            </tr>
        )
    }

    return (
        <tr className="border-t-2 border-slate-300">
            {labelCell}
            <Td className="bg-slate-50 text-center font-semibold text-muted-foreground">-</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums">{formatNumber(displayValue(totals.opening_quantity))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums">{formatNumber(displayValue(totals.opening_value))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums text-emerald-700">{formatNumber(displayValue(totals.inbound_quantity))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums text-emerald-700">{formatNumber(displayValue(totals.inbound_value))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums text-rose-700">{formatNumber(displayValue(totals.outbound_quantity))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums text-rose-700">{formatNumber(displayValue(totals.outbound_value))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums">{formatNumber(displayValue(totals.closing_quantity))}</Td>
            <Td className="bg-slate-50 text-right font-semibold tabular-nums">{formatNumber(displayValue(totals.closing_value))}</Td>
            {trailingCell}
        </tr>
    )
}

function LedgerRow({
    index,
    item,
    onOpenVoucher,
    onChangeLot,
    onChangeSalesExportLot,
    onChangePurchaseQuantity,
    onChangePurchaseProduct,
    onDeleteOtherExportLine,
    onDeleteOtherInboundLine,
    onEditStaticParameters,
    onNormalizeLegacyPostingTime,
    showValues,
    direction,
}: {
    index: number
    item: InventoryLedgerReportRow
    onOpenVoucher: (voucherId: number) => void
    onChangeLot?: (row: InventoryLedgerReportRow) => void
    onChangeSalesExportLot?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseQuantity?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseProduct?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherExportLine?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherInboundLine?: (row: InventoryLedgerReportRow) => void
    onEditStaticParameters?: (row: InventoryLedgerReportRow) => void
    onNormalizeLegacyPostingTime?: (row: InventoryLedgerReportRow) => void
    showValues: boolean
    direction?: "IN" | "OUT"
}) {
    const meta = getDocTypeMeta(item.doc_type)
    const quantityIn = Number(item.quantity_in || 0)
    const quantityOut = Number(item.quantity_out || 0)
    const openingBalance = Number(item.balance_quantity || 0) - quantityIn + quantityOut
    const rowUnitPrice = Number(item.unit_price || 0)
    const closingBalance = Number(item.balance_quantity || 0)
    const openingValue = openingBalance * rowUnitPrice
    const inboundValue = quantityIn * rowUnitPrice
    const outboundValue = quantityOut * rowUnitPrice
    const closingValue = closingBalance * rowUnitPrice
    const centerVoucherFields = Boolean(direction)

    return (
        <tr className="hover:bg-muted/30 border-b">
            <Td className="text-muted-foreground text-center font-mono">{formatNumber(index)}</Td>
            <Td className="whitespace-nowrap text-center tabular-nums">
                {formatDate(item.posting_date)}
            </Td>
            <Td className="whitespace-nowrap text-center tabular-nums">
                {formatTime(item.posting_time)}
            </Td>
            <Td className={cn(centerVoucherFields && "text-center")}>
                <div className={cn("flex items-center gap-1.5", centerVoucherFields && "justify-center")}>
                    {item.voucher_id ? (
                        <button
                            type="button"
                            className="text-primary font-mono font-semibold underline-offset-2 hover:underline"
                            onClick={() => onOpenVoucher(Number(item.voucher_id))}
                        >
                            {item.doc_no || `#${item.id}`}
                        </button>
                    ) : (
                        <div className="text-primary font-mono font-semibold">{item.doc_no || `#${item.id}`}</div>
                    )}
                    {item.voucher_id ? <VoucherPrintButton voucherId={item.voucher_id} /> : null}
                </div>
            </Td>
            <Td>
                <LedgerText value={item.description} />
            </Td>
            <Td className="text-muted-foreground text-center font-mono text-xs">
                {item.tk_no || "-"}
            </Td>
            <Td className="text-muted-foreground text-center font-mono text-xs">
                {item.tk_co || "-"}
            </Td>
            <Td className={cn(centerVoucherFields && "text-center")}>
                <LedgerText
                    value={item.product_code}
                    className={cn("font-mono", centerVoucherFields && "text-center")}
                />
            </Td>
            <Td>
                <LedgerText value={item.product_name} className="font-semibold text-foreground" />
            </Td>
            <Td className="text-muted-foreground text-center">
                {item.unit || "-"}
            </Td>
            <Td className="text-center">
                <LedgerText value={item.lot_code} className="min-w-0 text-center font-mono" />
            </Td>
            <Td className="text-center">
                <LedgerText value={item.warehouse_code} className="text-center font-mono" />
            </Td>
            <Td className="text-center">
                <LedgerText value={item.warehouse_name} className="text-center font-medium text-foreground" />
            </Td>
            {showValues ? (
                <>
                    <Td className="tabular-nums">
                        <div className="flex items-center justify-between gap-2">
                            <CostPeriodIcon label={item.cost_period_label} docType={item.doc_type} />
                            <span className="min-w-0 text-right">{formatNumber(rowUnitPrice)}</span>
                        </div>
                    </Td>
                    <QuantityValueCells
                        quantity={openingBalance}
                        amount={openingValue}
                        quantityClassName="font-semibold"
                    />
                    <QuantityValueCells
                        quantity={quantityIn}
                        amount={inboundValue}
                        quantityTone="in"
                    />
                    <QuantityValueCells
                        quantity={quantityOut}
                        amount={outboundValue}
                        quantityTone="out"
                    />
                    <QuantityValueCells
                        quantity={closingBalance}
                        amount={closingValue}
                        quantityClassName="font-bold"
                    />
                </>
            ) : (
                <>
                    <Td className="text-right font-semibold tabular-nums">
                        {formatNumber(openingBalance)}
                    </Td>
                    <Td className="text-right">
                        <Quantity value={quantityIn} tone="in" />
                    </Td>
                    <Td className="text-right">
                        <Quantity value={quantityOut} tone="out" />
                    </Td>
                    <Td className="text-right font-bold tabular-nums">
                        {formatNumber(closingBalance)}
                    </Td>
                </>
            )}
            <Td className="text-center">
                <LedgerText value={meta.label} className="text-center" />
            </Td>
            <Td className="text-center">
                <LedgerText value={item.cost_object_code} className="text-center font-mono" />
            </Td>
            <Td>
                <LedgerText value={item.cost_object_name} className="font-medium text-foreground" />
            </Td>
            <Td>
                <LedgerText value={item.supplier_name} />
            </Td>
            <Td className="text-center">
                <LedgerCorrectionActions
                    item={item}
                    onOpenVoucher={item.voucher_id ? () => onOpenVoucher(Number(item.voucher_id)) : undefined}
                    onChangeLot={onChangeLot}
                    onChangeSalesExportLot={onChangeSalesExportLot}
                    onChangePurchaseQuantity={onChangePurchaseQuantity}
                    onChangePurchaseProduct={onChangePurchaseProduct}
                    onDeleteOtherExportLine={onDeleteOtherExportLine}
                    onDeleteOtherInboundLine={onDeleteOtherInboundLine}
                    onEditStaticParameters={onEditStaticParameters}
                    onNormalizeLegacyPostingTime={onNormalizeLegacyPostingTime}
                />
            </Td>
        </tr>
    )
}

function NewBadge() {
    return (
        <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-emerald-100 px-1 text-[10px] font-semibold leading-none text-emerald-700">
            N
        </span>
    )
}

function LedgerCorrectionActions({
    item,
    onOpenVoucher,
    onChangeLot,
    onChangeSalesExportLot,
    onChangePurchaseQuantity,
    onChangePurchaseProduct,
    onDeleteOtherExportLine,
    onDeleteOtherInboundLine,
    onEditStaticParameters,
    onNormalizeLegacyPostingTime,
}: {
    item: InventoryLedgerReportRow
    onOpenVoucher?: () => void
    onChangeLot?: (row: InventoryLedgerReportRow) => void
    onChangeSalesExportLot?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseQuantity?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseProduct?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherExportLine?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherInboundLine?: (row: InventoryLedgerReportRow) => void
    onEditStaticParameters?: (row: InventoryLedgerReportRow) => void
    onNormalizeLegacyPostingTime?: (row: InventoryLedgerReportRow) => void
}) {
    const canOpenVoucher = Boolean(onOpenVoucher)
    const canEditStaticParameters = Boolean(onEditStaticParameters)
    const canChangeLot = Boolean(onChangeLot && isPurchaseInboundLedger(item))
    const canChangeSalesExportLot = Boolean(onChangeSalesExportLot && isSalesExportLedger(item))
    const canChangePurchaseQuantity = Boolean(onChangePurchaseQuantity && isQuantityCorrectionLedger(item))
    const canChangePurchaseProduct = Boolean(onChangePurchaseProduct && isPurchaseProductCorrectionLedger(item))
    const canDeleteOtherExportLine = Boolean(onDeleteOtherExportLine && isOtherExportLineDeleteLedger(item))
    const canDeleteOtherInboundLine = Boolean(onDeleteOtherInboundLine && isOtherInboundLineDeleteLedger(item))
    const canNormalizeLegacyPostingTime = Boolean(onNormalizeLegacyPostingTime && item.lot_id && item.posting_date)
    const hasQuickActions = canEditStaticParameters || canChangeLot || canChangeSalesExportLot || canChangePurchaseQuantity
        || canChangePurchaseProduct || canDeleteOtherExportLine
        || canDeleteOtherInboundLine || canNormalizeLegacyPostingTime

    if (!canOpenVoucher && !hasQuickActions) {
        return <span className="text-muted-foreground">-</span>
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Thao tác">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mở phiếu</div>
                {canOpenVoucher ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={onOpenVoucher}
                    >
                        <CircleHelp className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Mở chi tiết phiếu</span>
                            <span className="block text-xs text-muted-foreground">Xem phiếu và sửa theo từng vùng thao tác.</span>
                        </span>
                    </button>
                ) : null}
                {hasQuickActions ? (
                    <div className="mt-1 border-t px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sửa nhanh dòng này</div>
                ) : null}
                {canEditStaticParameters ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onEditStaticParameters?.(item)}
                    >
                        <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Sửa các thông số tĩnh</span>
                            <span className="block text-xs text-muted-foreground">Chỉ cập nhật diễn giải, TK Nợ, TK Có và tên nhà cung cấp của dòng này.</span>
                        </span>
                    </button>
                ) : null}
                {canChangeLot ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onChangeLot?.(item)}
                    >
                        <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Đổi số lô nhập hàng</span>
                            <span className="block text-xs text-muted-foreground">Áp dụng cho dòng nhập mua hàng hoặc nhập kho khác.</span>
                        </span>
                    </button>
                ) : null}
                {canChangeSalesExportLot ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onChangeSalesExportLot?.(item)}
                    >
                        <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Đổi số lô xuất kho</span>
                            <span className="block text-xs text-muted-foreground">Chuyển dòng xuất sang lô đã tồn tại và kiểm tra lịch sử tồn.</span>
                        </span>
                    </button>
                ) : null}
                {canChangePurchaseQuantity ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onChangePurchaseQuantity?.(item)}
                    >
                        <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Sửa số lượng</span>
                            <span className="block text-xs text-muted-foreground">Áp dụng cho mua hàng nhập khẩu, mua hàng trong nước, nhập kho khác hoặc xuất kho khác.</span>
                        </span>
                    </button>
                ) : null}
                {canChangePurchaseProduct ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onChangePurchaseProduct?.(item)}
                    >
                        <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">
                                Sửa mã hàng
                                {String(item.doc_type || "").toUpperCase() === "OTHER_INBOUND" ? <NewBadge /> : null}
                            </span>
                            <span className="block text-xs text-muted-foreground">Áp dụng cho từng dòng mua hàng nhập khẩu/trong nước hoặc nhập kho khác.</span>
                        </span>
                    </button>
                ) : null}
                {canDeleteOtherExportLine ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteOtherExportLine?.(item)}
                    >
                        <Trash2 className="mt-0.5 h-4 w-4" />
                        <span>
                            <span className="block font-medium">Xóa dòng xuất kho khác</span>
                            <span className="block text-xs text-destructive/80">Nếu là dòng cuối, hệ thống sẽ xóa luôn phiếu.</span>
                        </span>
                    </button>
                ) : null}
                {canDeleteOtherInboundLine ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                        onClick={() => onDeleteOtherInboundLine?.(item)}
                    >
                        <Trash2 className="mt-0.5 h-4 w-4" />
                        <span>
                            <span className="block font-medium">
                                Xóa dòng nhập kho khác
                                <NewBadge />
                            </span>
                            <span className="block text-xs text-destructive/80">Nếu là dòng cuối, hệ thống sẽ xóa luôn phiếu.</span>
                        </span>
                    </button>
                ) : null}
                {canNormalizeLegacyPostingTime ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onNormalizeLegacyPostingTime?.(item)}
                    >
                        <Clock className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Chuẩn hóa giờ dữ liệu cũ</span>
                            <span className="block text-xs text-muted-foreground">Chỉ xử lý các dòng cùng ngày/cùng lô đang thiếu giờ hoặc 00:00:00.</span>
                        </span>
                    </button>
                ) : null}
            </PopoverContent>
        </Popover>
    )
}

function StaticParametersDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [form, setForm] = useState<InventoryLedgerStaticParametersPayload>({
        description: "",
        tk_no: "",
        tk_co: "",
        supplier_name: "",
    })
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setForm({
                description: row.description || "",
                tk_no: row.tk_no || "",
                tk_co: row.tk_co || "",
                supplier_name: row.supplier_name || "",
            })
            setErrorMessage("")
        }
    }, [open, row])

    const original = useMemo<InventoryLedgerStaticParametersPayload>(() => ({
        description: row?.description || "",
        tk_no: row?.tk_no || "",
        tk_co: row?.tk_co || "",
        supplier_name: row?.supplier_name || "",
    }), [row])

    const payload = useMemo<InventoryLedgerStaticParametersPayload>(() => ({
        description: normalizeStaticValue(form.description),
        tk_no: normalizeStaticValue(form.tk_no),
        tk_co: normalizeStaticValue(form.tk_co),
        supplier_name: normalizeStaticValue(form.supplier_name),
    }), [form])

    const unchanged =
        normalizeStaticValue(form.description) === normalizeStaticValue(original.description)
        && normalizeStaticValue(form.tk_no) === normalizeStaticValue(original.tk_no)
        && normalizeStaticValue(form.tk_co) === normalizeStaticValue(original.tk_co)
        && normalizeStaticValue(form.supplier_name) === normalizeStaticValue(original.supplier_name)

    const mutation = useMutation({
        mutationFn: () => updateInventoryLedgerStaticParameters(Number(row?.id), payload),
        onSuccess: () => {
            setErrorMessage("")
            toast.success("Đã sửa các thông số tĩnh của dòng sổ kho.")
            onChanged()
            onOpenChange(false)
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không sửa được các thông số tĩnh.")
        },
    })

    const setField = (key: keyof InventoryLedgerStaticParametersPayload, value: string) => {
        setForm((current) => ({ ...current, [key]: value }))
        setErrorMessage("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(760px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Sửa các thông số tĩnh</DialogTitle>
                    <DialogDescription>
                        Chỉ cập nhật các trường hiển thị riêng trên dòng sổ kho này.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Loại chứng từ" value={getDocTypeMeta(row.doc_type).label} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <label className="text-sm font-medium">Diễn giải</label>
                                <Textarea
                                    value={form.description || ""}
                                    onChange={(event) => setField("description", event.target.value)}
                                    placeholder="Nhập diễn giải"
                                    className="min-h-24"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">TK Nợ</label>
                                <Input
                                    value={form.tk_no || ""}
                                    onChange={(event) => setField("tk_no", event.target.value)}
                                    placeholder="Nhập TK Nợ"
                                    className="h-10 font-mono"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">TK Có</label>
                                <Input
                                    value={form.tk_co || ""}
                                    onChange={(event) => setField("tk_co", event.target.value)}
                                    placeholder="Nhập TK Có"
                                    className="h-10 font-mono"
                                />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                                <label className="text-sm font-medium">Tên nhà cung cấp</label>
                                <Input
                                    value={form.supplier_name || ""}
                                    onChange={(event) => setField("supplier_name", event.target.value)}
                                    placeholder="Nhập tên nhà cung cấp"
                                    className="h-10"
                                />
                            </div>
                        </div>

                        {unchanged ? (
                            <div className="text-sm text-muted-foreground">Chưa có thay đổi so với giá trị hiện tại.</div>
                        ) : null}

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể lưu
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        disabled={!row || unchanged || mutation.isPending}
                        onClick={() => mutation.mutate()}
                    >
                        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Lưu thay đổi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function OtherExportLineDeleteDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [result, setResult] = useState<OtherExportLineDeleteResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row?.id])

    const checkMutation = useMutation({
        mutationFn: () => checkOtherExportLineDelete(Number(row?.id)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được dòng xuất kho khác.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyOtherExportLineDelete(Number(row?.id)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            toast.success(data?.delete_voucher ? "Đã xóa dòng và phiếu xuất kho khác." : "Đã xóa dòng xuất kho khác.")
            onChanged()
            onOpenChange(false)
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không xóa được dòng xuất kho khác.")
        },
    })

    const working = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid) && !result?.applied && !working
    const quantity = Number(result?.quantity ?? row?.quantity_out ?? 0)
    const amount = Number(result?.amount ?? row?.amount ?? 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Xóa dòng xuất kho khác</DialogTitle>
                    <DialogDescription>
                        Chỉ xóa đúng dòng đang chọn. Nếu phiếu chỉ còn một dòng, hệ thống sẽ xóa luôn phiếu đó trong cùng transaction.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                        <InfoItem label="Chứng từ" value={result?.doc_no || row?.doc_no || "-"} />
                        <InfoItem label="Ngày chứng từ" value={formatDate(result?.posting_date || row?.posting_date)} />
                        <InfoItem label="Kho" value={result?.warehouse_name || row?.warehouse_name || row?.warehouse_code || "-"} />
                        <InfoItem
                            label="Hàng hóa"
                            value={`${result?.product_code || row?.product_code || ""} - ${result?.product_name || row?.product_name || ""}`.replace(/^ - /, "")}
                            className="md:col-span-2"
                        />
                        <InfoItem label="Số lô" value={result?.lot_no || row?.lot_code || "-"} />
                        <InfoItem label="Số lượng xuất" value={formatNumber(quantity)} />
                        <InfoItem label="Đơn giá" value={formatMoney(result?.unit_price ?? row?.unit_price)} />
                        <InfoItem label="Thành tiền" value={formatMoney(Math.abs(amount))} />
                    </div>

                    {errorMessage ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

                    {result ? (
                        <div className={cn(
                            "rounded-md border p-3 text-sm",
                            result.valid ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-destructive/30 bg-destructive/10 text-destructive",
                        )}>
                            <div className="mb-2 flex items-center gap-2 font-semibold">
                                {result.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                <span>{result.message}</span>
                            </div>
                            <div className="grid gap-2 md:grid-cols-4">
                                <ResultInfo label="Dòng ledger sẽ xóa" value={formatNumber(resultCount(result, "ledger_rows"))} />
                                <ResultInfo label="Dòng phiếu sẽ xóa" value={formatNumber(resultCount(result, "voucher_items"))} />
                                <ResultInfo label="Cost consumption" value={formatNumber(resultCount(result, "cost_consumptions"))} />
                                <ResultInfo label="FIFO allocation" value={formatNumber(resultCount(result, "fifo_allocations"))} />
                                <ResultInfo label="Số dòng trong phiếu" value={formatNumber(result.voucher_item_count || 0)} />
                                <ResultInfo label="Xóa luôn phiếu" value={result.delete_voucher ? "Có" : "Không"} />
                                <ResultInfo label="Kỳ costing ảnh hưởng" value={formatNumber(result.affected_period_ids?.length || 0)} />
                                <ResultInfo label="Trạng thái" value={result.valid ? "Đủ điều kiện" : "Không đủ điều kiện"} />
                            </div>

                            {result.warnings?.length ? (
                                <div className="mt-3 space-y-1 text-sm text-amber-800">
                                    {result.warnings.map((warning) => (
                                        <div key={warning}>- {warning}</div>
                                    ))}
                                </div>
                            ) : null}
                            {result.errors?.length ? (
                                <div className="mt-3 space-y-1 text-sm text-destructive">
                                    {result.errors.map((error) => (
                                        <div key={error}>- {error}</div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                            Bấm kiểm tra để hệ thống đọc các dòng liên quan và xác nhận có thể xóa an toàn.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="outline" disabled={working} onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" variant="outline" disabled={!row || working} onClick={() => checkMutation.mutate()}>
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button type="button" variant="destructive" disabled={!canApply} onClick={() => applyMutation.mutate()}>
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Xóa dòng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function resultCount(result: OtherExportLineDeleteResult, key: string) {
    return Number(result.counts?.[key] || 0)
}

function OtherInboundLineDeleteDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [result, setResult] = useState<OtherInboundLineDeleteResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row?.id])

    const checkMutation = useMutation({
        mutationFn: () => checkOtherInboundLineDelete(Number(row?.id)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được dòng nhập kho khác.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyOtherInboundLineDelete(Number(row?.id)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            toast.success(data?.delete_voucher ? "Đã xóa dòng và phiếu nhập kho khác." : "Đã xóa dòng nhập kho khác.")
            onChanged()
            onOpenChange(false)
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không xóa được dòng nhập kho khác.")
        },
    })

    const working = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid) && !result?.applied && !working
    const quantity = Number(result?.quantity ?? row?.quantity_in ?? 0)
    const amount = Number(result?.amount ?? row?.amount ?? 0)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Xóa dòng nhập kho khác</DialogTitle>
                    <DialogDescription>
                        Chỉ xóa đúng dòng đang chọn. Nếu phiếu chỉ còn một dòng, hệ thống sẽ xóa luôn phiếu đó trong cùng transaction.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                        <InfoItem label="Chứng từ" value={result?.doc_no || row?.doc_no || "-"} />
                        <InfoItem label="Ngày chứng từ" value={formatDate(result?.posting_date || row?.posting_date)} />
                        <InfoItem label="Kho" value={result?.warehouse_name || row?.warehouse_name || row?.warehouse_code || "-"} />
                        <InfoItem
                            label="Hàng hóa"
                            value={`${result?.product_code || row?.product_code || ""} - ${result?.product_name || row?.product_name || ""}`.replace(/^ - /, "")}
                            className="md:col-span-2"
                        />
                        <InfoItem label="Số lô" value={result?.lot_no || row?.lot_code || "-"} />
                        <InfoItem label="Số lượng nhập" value={formatNumber(quantity)} />
                        <InfoItem label="Đơn giá" value={formatMoney(result?.unit_price ?? row?.unit_price)} />
                        <InfoItem label="Thành tiền" value={formatMoney(Math.abs(amount))} />
                    </div>

                    {errorMessage ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

                    {result ? (
                        <div className={cn(
                            "rounded-md border p-3 text-sm",
                            result.valid ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-destructive/30 bg-destructive/10 text-destructive",
                        )}>
                            <div className="mb-2 flex items-center gap-2 font-semibold">
                                {result.valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                <span>{result.message}</span>
                            </div>
                            <div className="grid gap-2 md:grid-cols-4">
                                <ResultInfo label="Dòng ledger sẽ xóa" value={formatNumber(resultCount(result, "ledger_rows"))} />
                                <ResultInfo label="Dòng phiếu sẽ xóa" value={formatNumber(resultCount(result, "voucher_items"))} />
                                <ResultInfo label="Cost layer" value={formatNumber(resultCount(result, "cost_layers"))} />
                                <ResultInfo label="FIFO allocation" value={formatNumber(resultCount(result, "fifo_allocations"))} />
                                <ResultInfo label="Số dòng trong phiếu" value={formatNumber(result.voucher_item_count || 0)} />
                                <ResultInfo label="Xóa luôn phiếu" value={result.delete_voucher ? "Có" : "Không"} />
                                <ResultInfo label="Kỳ costing ảnh hưởng" value={formatNumber(result.affected_period_ids?.length || 0)} />
                                <ResultInfo label="Trạng thái" value={result.valid ? "Đủ điều kiện" : "Không đủ điều kiện"} />
                            </div>

                            {result.warnings?.length ? (
                                <div className="mt-3 space-y-1 text-sm text-amber-800">
                                    {result.warnings.map((warning) => (
                                        <div key={warning}>- {warning}</div>
                                    ))}
                                </div>
                            ) : null}
                            {result.errors?.length ? (
                                <div className="mt-3 space-y-1 text-sm text-destructive">
                                    {result.errors.map((error) => (
                                        <div key={error}>- {error}</div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                            Bấm kiểm tra để hệ thống đọc các dòng liên quan và xác nhận có thể xóa an toàn.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="outline" disabled={working} onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" variant="outline" disabled={!row || working} onClick={() => checkMutation.mutate()}>
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button type="button" variant="destructive" disabled={!canApply} onClick={() => applyMutation.mutate()}>
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Xóa dòng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PurchaseLotChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newLotNo, setNewLotNo] = useState("")
    const [result, setResult] = useState<PurchaseLotChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewLotNo(row.lot_code || "")
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const checkMutation = useMutation({
        mutationFn: () => checkPurchaseLotChange(Number(row?.id), newLotNo),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được số lô.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyPurchaseLotChange(Number(row?.id), newLotNo),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không đổi được số lô.")
        },
    })

    const trimmedNewLotNo = newLotNo.trim()
    const unchanged = trimmedNewLotNo === String(row?.lot_code || "").trim()
    const busy = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result && !result.applied && !unchanged && !busy)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(980px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đổi số lô nhập hàng</DialogTitle>
                    <DialogDescription>
                        Chỉ đổi mã lô, không thay đổi số lượng và giá trị giao dịch.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Lô hiện tại" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng nhập" value={formatNumber(Number(row.quantity_in || 0))} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Số lô mới</label>
                            <Input
                                value={newLotNo}
                                onChange={(event) => {
                                    setNewLotNo(event.target.value)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                placeholder="Nhập số lô mới"
                                className="h-10"
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Số lô mới phải khác số lô hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể đổi số lô
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <PurchaseLotChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy || unchanged || !trimmedNewLotNo}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi lô
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PurchaseLotChangeResultPanel({ result }: { result: PurchaseLotChangeResult }) {
    const applied = Boolean(result.applied)
    const isMerge = result.mode === "MERGE"
    const counts = result.counts || {}
    const changes = result.changes || {}

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            applied
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : isMerge
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <span>{applied ? "Đã đổi số lô" : result.mode_label}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
                <ResultInfo label="Lô hiện tại" value={result.old_lot_no} />
                <ResultInfo label="Lô sau khi đổi" value={result.new_lot_no} />
                <ResultInfo label="Dòng sổ kho ảnh hưởng" value={formatNumber(Number(counts.ledger_rows || 0))} />
                <ResultInfo label="Dòng phiếu kho ảnh hưởng" value={formatNumber(Number(counts.voucher_items || 0))} />
                <ResultInfo label="Dòng FIFO ảnh hưởng" value={formatNumber(Number(counts.fifo_rows || 0))} />
                <ResultInfo label="Dòng tính giá ảnh hưởng" value={formatNumber(Number(counts.cost_rows || 0))} />
                {applied ? <ResultInfo label="Lô cũ đã xóa/gom" value={formatNumber(Number(changes.deleted_lots || 0))} /> : null}
            </div>

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function SalesExportLotChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newLotNo, setNewLotNo] = useState("")
    const [result, setResult] = useState<SalesExportLotChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewLotNo(row.lot_code || "")
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const checkMutation = useMutation({
        mutationFn: () => checkSalesExportLotChange(Number(row?.id), newLotNo),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được số lô xuất kho.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applySalesExportLotChange(Number(row?.id), newLotNo),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            if (data?.valid) onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không đổi được số lô xuất kho.")
        },
    })

    const trimmedNewLotNo = newLotNo.trim()
    const unchanged = trimmedNewLotNo === String(row?.lot_code || "").trim()
    const busy = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid && !result.applied && !unchanged && !busy)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(980px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đổi số lô xuất kho</DialogTitle>
                    <DialogDescription>
                        Chỉ chuyển dòng xuất sang một lô đã tồn tại. Hệ thống kiểm tra lịch sử tồn theo thời điểm trước khi ghi thật.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={`${formatDate(row.posting_date)} ${formatTime(row.posting_time)}`} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Lô hiện tại" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng xuất" value={formatNumber(Number(row.quantity_out || 0))} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Số lô đúng</label>
                            <Input
                                value={newLotNo}
                                onChange={(event) => {
                                    setNewLotNo(event.target.value)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                placeholder="Nhập số lô đã có trong kho"
                                className="h-10 font-mono"
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Số lô đúng phải khác số lô hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể đổi số lô xuất kho
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <SalesExportLotChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy || unchanged || !trimmedNewLotNo}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi lô
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SalesExportLotChangeResultPanel({ result }: { result: SalesExportLotChangeResult }) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const changes = result.changes || {}

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã đổi số lô xuất kho" : valid ? "Có thể đổi số lô xuất kho" : "Không thể đổi số lô xuất kho"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Lô hiện tại" value={result.old_lot_no || "-"} />
                <ResultInfo label="Lô đúng" value={result.new_lot_no || "-"} />
                <ResultInfo label="Số lượng xuất" value={formatNumber(Number(result.quantity || 0))} />
                <ResultInfo label="Dòng sổ kho" value={applied ? formatNumber(Number(changes.updated_ledger_rows || 0)) : "Sẽ cập nhật 1 dòng"} />
                <ResultInfo label="Dòng phiếu kho" value={applied ? formatNumber(Number(changes.updated_voucher_items || 0)) : result.voucher_item_id ? "Sẽ đồng bộ" : "Không có"} />
                {applied ? <ResultInfo label="Lô cũ được dọn" value={formatNumber(Number(changes.deleted_old_lots || 0))} /> : null}
            </div>

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function TransferExportWarehouseChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newWarehouseId, setNewWarehouseId] = useState("")
    const [newToWarehouseId, setNewToWarehouseId] = useState("")
    const [newLotNo, setNewLotNo] = useState("")
    const [sourceWarehouseSearch, setSourceWarehouseSearch] = useState("")
    const [destinationWarehouseSearch, setDestinationWarehouseSearch] = useState("")
    const [sourceWarehouseSelectOpen, setSourceWarehouseSelectOpen] = useState(false)
    const [destinationWarehouseSelectOpen, setDestinationWarehouseSelectOpen] = useState(false)
    const [result, setResult] = useState<TransferExportWarehouseChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const sourceWarehouseSearchInputRef = useRef<HTMLInputElement | null>(null)
    const destinationWarehouseSearchInputRef = useRef<HTMLInputElement | null>(null)

    const { data: warehousePage } = useQuery({
        queryKey: ["warehouses", "transfer-export-warehouse-change"],
        queryFn: () => listWarehouses({ page: 1, size: 1000, status: "ACTIVE" }),
        enabled: open,
    })
    const { data: contextData } = useQuery({
        queryKey: ["transfer-export-warehouse-change-context", row?.id],
        queryFn: () => getTransferExportWarehouseChangeContext(Number(row?.id)),
        enabled: Boolean(open && row?.id),
    })
    const warehouses = (warehousePage?.items || []) as Warehouse[]
    const currentSourceWarehouseId = contextData?.old_warehouse_id ?? row?.warehouse_id
    const currentDestinationWarehouseId = contextData?.old_destination_warehouse_id
    const currentLotNo = String(contextData?.old_lot_no || row?.lot_code || "").trim()
    const unchangedAll = Boolean(
        currentSourceWarehouseId
        && currentDestinationWarehouseId
        && Number(newWarehouseId) === Number(currentSourceWarehouseId)
        && Number(newToWarehouseId) === Number(currentDestinationWarehouseId)
        && newLotNo.trim() === currentLotNo,
    )
    const { data: availableLots = [], isLoading: availableLotsLoading } = useQuery({
        queryKey: ["transfer-export-warehouse-change-lots", row?.id, newWarehouseId],
        queryFn: () => listTransferExportWarehouseChangeLots(Number(row?.id), Number(newWarehouseId)),
        enabled: Boolean(open && row?.id && newWarehouseId),
        staleTime: 15_000,
    })

    useEffect(() => {
        if (open && row) {
            setNewWarehouseId("")
            setNewToWarehouseId("")
            setNewLotNo("")
            setSourceWarehouseSearch("")
            setDestinationWarehouseSearch("")
            setSourceWarehouseSelectOpen(false)
            setDestinationWarehouseSelectOpen(false)
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    useEffect(() => {
        if (!open || !contextData) return
        setNewWarehouseId(String(contextData.old_warehouse_id || ""))
        setNewToWarehouseId(String(contextData.old_destination_warehouse_id || ""))
        setNewLotNo(String(contextData.old_lot_no || ""))
    }, [contextData, open])

    useEffect(() => {
        if (!sourceWarehouseSelectOpen) return
        const timer = window.setTimeout(() => sourceWarehouseSearchInputRef.current?.focus(), 0)
        return () => window.clearTimeout(timer)
    }, [sourceWarehouseSelectOpen])

    useEffect(() => {
        if (!destinationWarehouseSelectOpen) return
        const timer = window.setTimeout(() => destinationWarehouseSearchInputRef.current?.focus(), 0)
        return () => window.clearTimeout(timer)
    }, [destinationWarehouseSelectOpen])

    useEffect(() => {
        if (!open || !newWarehouseId || !availableLots.length || newLotNo.trim()) return
        const currentLotNo = String(contextData?.old_lot_no || row?.lot_code || "").trim()
        const preferred = availableLots.find((lot) => lot.preferred || String(lot.lot_no || "").trim() === currentLotNo)
        const enoughPreferred = preferred?.enough ? preferred : null
        const enoughLots = availableLots.filter((lot) => lot.enough)
        const autoLot = enoughPreferred || (enoughLots.length === 1 ? enoughLots[0] : null)
        if (autoLot?.lot_no) {
            setNewLotNo(String(autoLot.lot_no))
        }
    }, [availableLots, contextData?.old_lot_no, newLotNo, newWarehouseId, open, row?.lot_code])

    const checkMutation = useMutation({
        mutationFn: () => checkTransferExportWarehouseChange(Number(row?.id), Number(newWarehouseId), Number(newToWarehouseId), newLotNo),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được kho xuất mới.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyTransferExportWarehouseChange(Number(row?.id), Number(newWarehouseId), Number(newToWarehouseId), newLotNo),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            if (data?.valid) onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không đổi được kho xuất chuyển kho.")
        },
    })

    const selectedWarehouse = warehouses.find((warehouse) => String(warehouse.id) === newWarehouseId)
    const selectedDestinationWarehouse = warehouses.find((warehouse) => String(warehouse.id) === newToWarehouseId)
    const filteredSourceWarehouses = useMemo(() => {
        const keyword = normalizeSearchText(sourceWarehouseSearch)
        if (!keyword) return warehouses
        return warehouses.filter((warehouse) =>
            normalizeSearchText([
                warehouse.code,
                warehouse.name,
                warehouse.physical_warehouse?.code,
                warehouse.physical_warehouse?.name,
            ].filter(Boolean).join(" ")).includes(keyword),
        )
    }, [sourceWarehouseSearch, warehouses])
    const filteredDestinationWarehouses = useMemo(() => {
        const keyword = normalizeSearchText(destinationWarehouseSearch)
        if (!keyword) return warehouses
        return warehouses.filter((warehouse) =>
            normalizeSearchText([
                warehouse.code,
                warehouse.name,
                warehouse.physical_warehouse?.code,
                warehouse.physical_warehouse?.name,
            ].filter(Boolean).join(" ")).includes(keyword),
        )
    }, [destinationWarehouseSearch, warehouses])
    const trimmedNewLotNo = newLotNo.trim()
    const busy = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid && !result.applied && !unchangedAll && trimmedNewLotNo && newWarehouseId && newToWarehouseId && !busy)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1180px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đổi kho chuyển kho nội bộ</DialogTitle>
                    <DialogDescription>
                        Chọn lại kho xuất, kho nhập và lô xuất đã tồn tại. Hệ thống đồng bộ dòng nhập chuyển kho đi kèm và kiểm tra âm tồn theo lịch sử.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={`${formatDate(row.posting_date)} ${formatTime(row.posting_time)}`} />
                            <InfoItem label="Kho xuất hiện tại" value={contextData?.old_warehouse_name || row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Kho nhập hiện tại" value={contextData?.old_destination_warehouse_name || "-"} />
                            <InfoItem label="Lô hiện tại" value={currentLotNo || "-"} />
                            <InfoItem label="Số lượng xuất" value={formatNumber(Number(contextData?.quantity || row.quantity_out || row.quantity_in || 0))} />
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Kho xuất mới</label>
                                <Select
                                    value={newWarehouseId}
                                    open={sourceWarehouseSelectOpen}
                                    onOpenChange={setSourceWarehouseSelectOpen}
                                    onValueChange={(value) => {
                                        setNewWarehouseId(value)
                                        setNewLotNo("")
                                        setResult(null)
                                        setErrorMessage("")
                                    }}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Chọn kho xuất mới" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[360px]">
                                        <div className="sticky top-0 z-10 bg-popover p-2">
                                            <Input
                                                ref={sourceWarehouseSearchInputRef}
                                                value={sourceWarehouseSearch}
                                                onChange={(event) => setSourceWarehouseSearch(event.target.value)}
                                                onKeyDown={(event) => event.stopPropagation()}
                                                placeholder="Tìm kho xuất mới"
                                                className="h-9"
                                            />
                                        </div>
                                        {filteredSourceWarehouses.length ? filteredSourceWarehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                                                <span className="flex flex-col">
                                                    <span>{warehouse.name || warehouse.code}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {warehouse.physical_warehouse?.name || warehouse.code}
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        )) : (
                                            <div className="px-3 py-4 text-sm text-muted-foreground">Không tìm thấy kho phù hợp.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedWarehouse ? (
                                    <div className="text-xs text-muted-foreground">
                                        Kho xuất mới: {selectedWarehouse.name || selectedWarehouse.code}
                                    </div>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Kho nhập mới</label>
                                <Select
                                    value={newToWarehouseId}
                                    open={destinationWarehouseSelectOpen}
                                    onOpenChange={setDestinationWarehouseSelectOpen}
                                    onValueChange={(value) => {
                                        setNewToWarehouseId(value)
                                        setResult(null)
                                        setErrorMessage("")
                                    }}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Chọn kho nhập mới" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[360px]">
                                        <div className="sticky top-0 z-10 bg-popover p-2">
                                            <Input
                                                ref={destinationWarehouseSearchInputRef}
                                                value={destinationWarehouseSearch}
                                                onChange={(event) => setDestinationWarehouseSearch(event.target.value)}
                                                onKeyDown={(event) => event.stopPropagation()}
                                                placeholder="Tìm kho nhập mới"
                                                className="h-9"
                                            />
                                        </div>
                                        {filteredDestinationWarehouses.length ? filteredDestinationWarehouses.map((warehouse) => (
                                            <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                                                <span className="flex flex-col">
                                                    <span>{warehouse.name || warehouse.code}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {warehouse.physical_warehouse?.name || warehouse.code}
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        )) : (
                                            <div className="px-3 py-4 text-sm text-muted-foreground">Không tìm thấy kho phù hợp.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedDestinationWarehouse ? (
                                    <div className="text-xs text-muted-foreground">
                                        Kho nhập mới: {selectedDestinationWarehouse.name || selectedDestinationWarehouse.code}
                                    </div>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Số lô xuất đúng trong kho mới</label>
                                <Select
                                    value={trimmedNewLotNo ? `LOT:${trimmedNewLotNo}` : ""}
                                    disabled={!newWarehouseId || availableLotsLoading}
                                    onValueChange={(value) => {
                                        const lotNo = value.startsWith("LOT:") ? value.slice(4) : value
                                        setNewLotNo(lotNo)
                                        setResult(null)
                                        setErrorMessage("")
                                    }}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder={availableLotsLoading ? "Đang tải lô..." : "Chọn số lô trong kho mới"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[360px]">
                                        {availableLotsLoading ? (
                                            <SelectItem value="LOADING" disabled>Đang tải lô...</SelectItem>
                                        ) : null}
                                        {!availableLotsLoading && !availableLots.length ? (
                                            <div className="px-3 py-4 text-sm text-muted-foreground">
                                                Không có lô còn tồn tại thời điểm chứng từ trong kho này.
                                            </div>
                                        ) : null}
                                        {availableLots.map((lot: TransferExportWarehouseAvailableLot) => (
                                            <SelectItem
                                                key={`${lot.lot_id}-${lot.lot_no}`}
                                                value={`LOT:${lot.lot_no}`}
                                                disabled={!lot.enough}
                                            >
                                                <span className="flex flex-col">
                                                    <span className="font-mono">{lot.lot_no}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Tồn tại thời điểm xuất: {formatNumber(Number(lot.available_quantity || 0))}
                                                        {!lot.enough ? " | Không đủ số lượng" : ""}
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="text-xs text-muted-foreground">
                                    Chỉ hiển thị các lô có tồn trong kho mới tại thời điểm chứng từ; lô không đủ số lượng sẽ không được chọn.
                                </div>
                            </div>
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể đổi kho xuất chuyển kho
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <TransferExportWarehouseChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy || unchangedAll || !newWarehouseId || !newToWarehouseId || !trimmedNewLotNo}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi kho
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function TransferExportWarehouseChangeResultPanel({ result }: { result: TransferExportWarehouseChangeResult }) {
    const applied = Boolean(result.applied)
    const valid = Boolean(result.valid)
    const changes = result.changes || {}

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            applied || valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã đổi kho chuyển kho nội bộ" : valid ? "Có thể đổi kho chuyển kho nội bộ" : "Không thể đổi kho chuyển kho nội bộ"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Kho xuất hiện tại" value={result.old_warehouse_name} />
                <ResultInfo label="Kho xuất mới" value={result.new_warehouse_name} />
                <ResultInfo label="Kho nhập hiện tại" value={result.old_destination_warehouse_name || result.destination_warehouse_name || "-"} />
                <ResultInfo label="Kho nhập mới" value={result.new_destination_warehouse_name || "-"} />
                <ResultInfo label="Lô hiện tại" value={result.old_lot_no || "-"} />
                <ResultInfo label="Lô xuất mới" value={result.new_lot_no || "-"} />
                <ResultInfo label="Số lượng xuất" value={formatNumber(Number(result.quantity || 0))} />
                <ResultInfo label="Đơn giá cũ" value={formatNumber(Number(result.old_unit_price || 0))} />
                <ResultInfo label="Đơn giá mới" value={formatNumber(Number(result.new_unit_price || 0))} />
                <ResultInfo label="Giá trị mới" value={formatNumber(Number(result.new_amount || 0))} />
                {applied ? <ResultInfo label="Dòng xuất đã cập nhật" value={formatNumber(Number(changes.updated_export_ledgers || 0))} /> : null}
                {applied ? <ResultInfo label="Dòng nhập đã cập nhật" value={formatNumber(Number(changes.updated_inbound_ledgers || 0))} /> : null}
                {applied ? <ResultInfo label="Kỳ tính giá đánh dấu lại" value={formatNumber(Number(changes.stale_cost_periods || 0))} /> : null}
            </div>

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function ReturnWarehouseChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newWarehouseId, setNewWarehouseId] = useState("")
    const [result, setResult] = useState<ReturnWarehouseChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewWarehouseId("")
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const checkMutation = useMutation({
        mutationFn: () => checkReturnWarehouseChange(Number(row?.id), Number(newWarehouseId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được kho nhập mới.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyReturnWarehouseChange(Number(row?.id), Number(newWarehouseId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không đổi được kho nhập hàng trả lại.")
        },
    })

    const unchanged = Boolean(row?.warehouse_id && Number(newWarehouseId) === Number(row.warehouse_id))
    const busy = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid && !result.applied && !unchanged && !busy)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1100px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đổi kho nhập hàng trả lại</DialogTitle>
                    <DialogDescription>
                        Chỉ đổi kho cho dòng nhập kho từ hàng bán trả lại. Hệ thống sẽ kiểm tra lịch sử tồn trước khi ghi thật.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Kho hiện tại" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng nhập" value={formatNumber(Number(row.quantity_in || 0))} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Kho nhập mới</label>
                            <AsyncSelect
                                value={newWarehouseId ? Number(newWarehouseId) : undefined}
                                onChange={(value: number | string | undefined) => {
                                    setNewWarehouseId(value ? String(value) : "")
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                dataSource={{ getList: listWarehouses, getById: getWarehouse, params: { page: 1, size: 20, status: "ACTIVE" } }}
                                mapOption={(warehouse: Warehouse) => ({
                                    value: warehouse.id,
                                    label: [warehouse.code, warehouse.name].filter(Boolean).join(" - ") || `Kho #${warehouse.id}`,
                                    raw: warehouse,
                                })}
                                placeholder="Chọn kho nhập mới"
                                searchPlaceholder="Tìm mã hoặc tên kho..."
                                emptyText="Không tìm thấy kho phù hợp."
                                optionWrapLabel
                                wrapLabel
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Kho mới phải khác kho hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể đổi kho
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <ReturnWarehouseChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy || unchanged || !newWarehouseId}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi kho
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ReturnWarehouseChangeResultPanel({ result }: { result: ReturnWarehouseChangeResult }) {
    const applied = Boolean(result.applied)
    const valid = Boolean(result.valid)
    const changes = result.changes || {}

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            applied || valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã đổi kho nhập" : valid ? result.mode_label : "Không thể đổi kho"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
                <ResultInfo label="Kho hiện tại" value={result.old_warehouse_name} />
                <ResultInfo label="Kho mới" value={result.new_warehouse_name} />
                <ResultInfo label="Số lô" value={result.lot_no || "-"} />
                <ResultInfo label="Dòng sẽ đổi" value="1 dòng đang chọn" />
                <ResultInfo label="Tổng dòng trong phiếu" value={formatNumber(Number(result.voucher_item_count || 0))} />
                <ResultInfo label="Quy định địa điểm kho" value={result.same_physical_required ? "Phiếu nhiều dòng: phải cùng địa điểm kho" : "Phiếu một dòng: được đổi địa điểm kho"} />
                {applied ? <ResultInfo label="Lô mới được tạo" value={formatNumber(Number(changes.created_lots || 0))} /> : null}
                {applied ? <ResultInfo label="Lô cũ được dọn" value={formatNumber(Number(changes.deleted_old_lots || 0))} /> : null}
            </div>

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function InboundWarehouseChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newWarehouseId, setNewWarehouseId] = useState("")
    const [result, setResult] = useState<InboundWarehouseChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewWarehouseId("")
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const checkMutation = useMutation({
        mutationFn: () => checkInboundWarehouseChange(Number(row?.id), Number(newWarehouseId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được kho nhập mới.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyInboundWarehouseChange(Number(row?.id), Number(newWarehouseId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không đổi được kho nhập.")
        },
    })

    const unchanged = Boolean(row?.warehouse_id && Number(newWarehouseId) === Number(row.warehouse_id))
    const busy = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid && !result.applied && !unchanged && !busy)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1100px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đổi kho nhập</DialogTitle>
                    <DialogDescription>
                        Chỉ đổi kho cho dòng nhập đang chọn. Hệ thống kiểm tra địa điểm kho, lịch sử tồn và rollback toàn bộ nếu cập nhật lỗi.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Kho hiện tại" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng nhập" value={formatNumber(Number(row.quantity_in || 0))} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Kho nhập mới</label>
                            <AsyncSelect
                                value={newWarehouseId ? Number(newWarehouseId) : undefined}
                                onChange={(value: number | string | undefined) => {
                                    setNewWarehouseId(value ? String(value) : "")
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                dataSource={{ getList: listWarehouses, getById: getWarehouse, params: { page: 1, size: 20, status: "ACTIVE" } }}
                                mapOption={(warehouse: Warehouse) => ({
                                    value: warehouse.id,
                                    label: [warehouse.code, warehouse.name].filter(Boolean).join(" - ") || `Kho #${warehouse.id}`,
                                    raw: warehouse,
                                })}
                                placeholder="Chọn kho nhập mới"
                                searchPlaceholder="Tìm mã hoặc tên kho..."
                                emptyText="Không tìm thấy kho phù hợp."
                                optionWrapLabel
                                wrapLabel
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Kho mới phải khác kho hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể đổi kho
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <ReturnWarehouseChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy || unchanged || !newWarehouseId}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button type="button" disabled={!canApply} onClick={() => applyMutation.mutate()}>
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi kho
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SalesReturnUnitPriceChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [unitPriceText, setUnitPriceText] = useState("")
    const [result, setResult] = useState<SalesReturnUnitPriceChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setUnitPriceText(String(row.unit_price ?? ""))
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const newUnitPrice = parseDecimalInput(unitPriceText)
    const quantity = Number(row?.quantity_in || 0)
    const currentUnitPrice = Number(row?.unit_price || 0)
    const currentAmount = Number(row?.amount || 0)
    const previewAmount = Number.isFinite(newUnitPrice) ? quantity * newUnitPrice : 0
    const unchanged = Number.isFinite(newUnitPrice) && Math.abs(newUnitPrice - currentUnitPrice) < 0.000001

    const checkMutation = useMutation({
        mutationFn: () => checkSalesReturnUnitPriceChange(Number(row?.id), newUnitPrice),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được đơn giá nhập trả hàng.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applySalesReturnUnitPriceChange(Number(row?.id), newUnitPrice),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            if (data?.valid) onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không sửa được đơn giá nhập trả hàng.")
        },
    })

    const busy = checkMutation.isPending || applyMutation.isPending
    const canCheck = Boolean(row && Number.isFinite(newUnitPrice) && newUnitPrice >= 0 && !unchanged && !busy)
    const canApply = Boolean(result?.valid && !result.applied && !unchanged && !busy)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(980px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Sửa đơn giá nhập trả hàng</DialogTitle>
                    <DialogDescription>
                        Chỉ sửa giá vốn nhập kho của hàng bán trả lại, không sửa giá bán, tiền trả khách hoặc công nợ.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={`${formatDate(row.posting_date)} ${formatTime(row.posting_time)}`} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng nhập trả" value={formatNumber(quantity)} />
                        </div>

                        <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-2">
                            <InfoItem label="Đơn giá hiện tại" value={formatNumber(currentUnitPrice)} />
                            <InfoItem label="Giá trị hiện tại" value={formatNumber(currentAmount)} />
                            <InfoItem label="Đơn giá mới" value={Number.isFinite(newUnitPrice) ? formatNumber(newUnitPrice) : "-"} />
                            <InfoItem label="Giá trị mới" value={Number.isFinite(newUnitPrice) ? formatNumber(previewAmount) : "-"} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Đơn giá mới</label>
                            <Input
                                value={unitPriceText}
                                onChange={(event) => {
                                    setUnitPriceText(event.target.value)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                placeholder="Nhập đơn giá vốn mới"
                                className="h-10 font-mono"
                            />
                            {!Number.isFinite(newUnitPrice) ? (
                                <div className="text-sm text-destructive">Đơn giá mới không hợp lệ.</div>
                            ) : null}
                            {unchanged ? (
                                <div className="text-sm text-muted-foreground">Đơn giá mới đang trùng đơn giá hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể sửa đơn giá nhập trả hàng
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <SalesReturnUnitPriceChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" variant="outline" disabled={!canCheck} onClick={() => checkMutation.mutate()}>
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button type="button" disabled={!canApply} onClick={() => applyMutation.mutate()}>
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Áp dụng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SalesReturnUnitPriceChangeResultPanel({ result }: { result: SalesReturnUnitPriceChangeResult }) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const changes = result.changes || {}

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã sửa đơn giá nhập trả hàng" : valid ? "Có thể sửa đơn giá nhập trả hàng" : "Không thể sửa đơn giá nhập trả hàng"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Đơn giá cũ" value={formatNumber(Number(result.current_unit_price || 0))} />
                <ResultInfo label="Đơn giá mới" value={formatNumber(Number(result.new_unit_price || 0))} />
                <ResultInfo label="Giá trị mới" value={formatNumber(Number(result.new_amount || 0))} />
                <ResultInfo label="Dòng sổ kho" value={applied ? formatNumber(Number(changes.updated_ledger_rows || 0)) : "Sẽ cập nhật 1 dòng"} />
                <ResultInfo label="Dòng phiếu kho" value={applied ? formatNumber(Number(changes.updated_voucher_items || 0)) : result.voucher_item_id ? "Sẽ đồng bộ" : "Không có"} />
                {applied ? <ResultInfo label="Kỳ cần tính lại" value={formatNumber(Number(changes.stale_cost_periods || 0))} /> : null}
            </div>

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function LedgerAmountChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [amountText, setAmountText] = useState("")
    const [result, setResult] = useState<LedgerAmountChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setAmountText(String(Math.abs(Number(row.amount || 0))))
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const newTotalAmount = parseDecimalInput(amountText)
    const quantity = Math.abs(Number(row?.quantity_in || 0) || Number(row?.quantity_out || 0))
    const currentAmount = Number(row?.amount || 0)
    const previewUnitPrice = Number.isFinite(newTotalAmount) && quantity > 0 ? newTotalAmount / quantity : 0
    const unchanged = Number.isFinite(newTotalAmount) && Math.abs(newTotalAmount - Math.abs(currentAmount)) < 0.000001

    const checkMutation = useMutation({
        mutationFn: () => checkLedgerAmountChange(Number(row?.id), newTotalAmount),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được tổng giá trị.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyLedgerAmountChange(Number(row?.id), newTotalAmount),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            if (data?.valid) onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không sửa được tổng giá trị.")
        },
    })

    const busy = checkMutation.isPending || applyMutation.isPending
    const canCheck = Boolean(row && Number.isFinite(newTotalAmount) && newTotalAmount >= 0 && !unchanged && !busy)
    const canApply = Boolean(result?.valid && !result.applied && !unchanged && !busy)
    const directionLabel = String(row?.doc_type || "").toUpperCase() === "OTHER_EXPORT" ? "xuất" : "nhập"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(980px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Sửa tổng giá trị</DialogTitle>
                    <DialogDescription>
                        Nhập tổng giá trị dương theo chứng từ cũ. Hệ thống giữ dấu sổ kho hiện tại và tính ngược đơn giá với 3 chữ số thập phân.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={`${formatDate(row.posting_date)} ${formatTime(row.posting_time)}`} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label={`Số lượng ${directionLabel}`} value={formatNumber(quantity)} />
                        </div>

                        <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-2">
                            <InfoItem label="Đơn giá hiện tại" value={formatNumber(Number(row.unit_price || 0))} />
                            <InfoItem label="Giá trị hiện tại" value={formatNumber(Math.abs(currentAmount))} />
                            <InfoItem label="Đơn giá mới dự kiến" value={Number.isFinite(previewUnitPrice) ? formatNumber(previewUnitPrice) : "-"} />
                            <InfoItem label="Tổng giá trị mới" value={Number.isFinite(newTotalAmount) ? formatNumber(newTotalAmount) : "-"} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Tổng giá trị mới</label>
                            <Input
                                value={amountText}
                                onChange={(event) => {
                                    setAmountText(event.target.value)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                placeholder="Nhập tổng giá trị"
                                className="h-10 font-mono"
                            />
                            {!Number.isFinite(newTotalAmount) ? (
                                <div className="text-sm text-destructive">Tổng giá trị mới không hợp lệ.</div>
                            ) : null}
                            {unchanged ? (
                                <div className="text-sm text-muted-foreground">Tổng giá trị mới đang trùng giá trị hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể sửa tổng giá trị
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <LedgerAmountChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" variant="outline" disabled={!canCheck} onClick={() => checkMutation.mutate()}>
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button type="button" disabled={!canApply} onClick={() => applyMutation.mutate()}>
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Áp dụng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function LedgerAmountChangeResultPanel({ result }: { result: LedgerAmountChangeResult }) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const changes = result.changes || {}

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã sửa tổng giá trị" : valid ? "Có thể sửa tổng giá trị" : "Không thể sửa tổng giá trị"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Giá trị cũ" value={formatNumber(Math.abs(Number(result.old_amount || 0)))} />
                <ResultInfo label="Giá trị mới" value={formatNumber(Number(result.new_total_amount || 0))} />
                <ResultInfo label="Đơn giá mới" value={formatNumber(Number(result.new_unit_price || 0))} />
                <ResultInfo label="Dòng sổ kho" value={applied ? formatNumber(Number(changes.updated_ledgers || 0)) : "Sẽ cập nhật 1 dòng"} />
                <ResultInfo label="Dòng phiếu kho" value={applied ? formatNumber(Number(changes.updated_voucher_items || 0)) : result.voucher_item_id ? "Sẽ đồng bộ" : "Không có"} />
                <ResultInfo label="Cost layer" value={applied ? formatNumber(Number(changes.updated_cost_layers || 0)) : result.direction === "IN" ? "Sẽ đồng bộ" : "Không áp dụng"} />
            </div>

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function PurchaseQuantityChangeDialog({
    row,
    open,
    showPriceData,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    showPriceData?: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newQuantity, setNewQuantity] = useState("")
    const [result, setResult] = useState<PurchaseQuantityChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const direction = String(row?.doc_type || "").toUpperCase() === "OTHER_EXPORT" ? "OUT" : "IN"
    const directionLabel = direction === "OUT" ? "xuất" : "nhập"

    useEffect(() => {
        if (open && row) {
            setNewQuantity(String(Number(direction === "OUT" ? row.quantity_out || 0 : row.quantity_in || 0)))
            setResult(null)
            setErrorMessage("")
        }
    }, [direction, open, row])

    const parsedQuantity = Number(newQuantity)
    const oldQuantity = Number(direction === "OUT" ? row?.quantity_out || 0 : row?.quantity_in || 0)
    const invalidQuantity = !Number.isFinite(parsedQuantity) || parsedQuantity <= 0
    const unchanged = !invalidQuantity && parsedQuantity === oldQuantity
    const busy = false

    const checkMutation = useMutation({
        mutationFn: () => checkPurchaseQuantityChange(Number(row?.id), parsedQuantity),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được số lượng.")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyPurchaseQuantityChange(Number(row?.id), parsedQuantity),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            onChanged()
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không sửa được số lượng.")
        },
    })

    const pending = busy || checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result && result.valid && !result.applied && !unchanged && !pending)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1040px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Sửa số lượng sổ kho</DialogTitle>
                    <DialogDescription>
                        Chỉ sửa số lượng cho dòng nghiệp vụ được phép. Hệ thống sẽ kiểm tra lịch sử tồn trước khi ghi thật.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label={`Số lượng ${directionLabel} hiện tại`} value={formatNumber(oldQuantity)} />
                            {showPriceData ? <InfoItem label="Đơn giá hiện tại" value={formatNumber(Number(row.unit_price || 0))} /> : null}
                            {showPriceData ? <InfoItem label="Thành tiền hiện tại" value={formatNumber(Number(row.amount || 0))} /> : null}
                        </div>

                        <div className="grid gap-2 md:max-w-sm">
                            <label className="text-sm font-medium">Số lượng mới</label>
                            <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={newQuantity}
                                onChange={(event) => {
                                    setNewQuantity(event.target.value)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                placeholder="Nhập số lượng mới"
                                className="h-10 text-right tabular-nums"
                            />
                            {invalidQuantity ? (
                                <div className="text-sm text-destructive">Số lượng mới phải lớn hơn 0.</div>
                            ) : unchanged ? (
                                <div className="text-sm text-destructive">Số lượng mới phải khác số lượng hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể sửa số lượng
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <PurchaseQuantityChangeResultPanel result={result} showPriceData={showPriceData} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={pending || invalidQuantity || unchanged}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Cập nhật
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PurchaseQuantityChangeResultPanel({
    result,
    showPriceData,
}: {
    result: PurchaseQuantityChangeResult
    showPriceData?: boolean
}) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const changes = result.changes || {}
    const visibleMessage = showPriceData
        ? result.message
        : applied
            ? "Đã cập nhật số lượng và tồn lô."
            : valid
                ? "Có thể sửa số lượng. Hệ thống sẽ cập nhật tồn lô theo số lượng mới."
                : "Không thể sửa số lượng."
    const visibleErrors = showPriceData ? result.errors : filterPriceSensitiveMessages(result.errors)
    const visibleWarnings = showPriceData ? result.warnings : filterPriceSensitiveMessages(result.warnings)

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã sửa số lượng" : valid ? "Có thể sửa số lượng" : "Không thể sửa số lượng"}</span>
            </div>
            <div className="mt-1 pl-6">{visibleMessage}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Số lượng hiện tại" value={formatNumber(Number(result.old_quantity || 0))} />
                <ResultInfo label="Số lượng mới" value={formatNumber(Number(result.new_quantity || 0))} />
                <ResultInfo label="Chênh lệch SL" value={formatNumber(Number(result.delta_quantity || 0))} />
                {showPriceData ? <ResultInfo label="Đơn giá" value={formatNumber(Number(result.unit_price || 0))} /> : null}
                {showPriceData ? <ResultInfo label="Thành tiền hiện tại" value={formatNumber(Number(result.old_amount || 0))} /> : null}
                {showPriceData ? <ResultInfo label="Thành tiền mới" value={formatNumber(Number(result.new_amount || 0))} /> : null}
                {showPriceData ? <ResultInfo label="Chênh lệch tiền" value={formatNumber(Number(result.delta_amount || 0))} /> : null}
                {applied ? <ResultInfo label="Dòng sổ kho đã cập nhật" value={formatNumber(Number(changes.updated_ledger_rows || 0))} /> : null}
                {applied ? <ResultInfo label="Dòng phiếu kho đã cập nhật" value={formatNumber(Number(changes.updated_voucher_items || 0))} /> : null}
            </div>

            {visibleErrors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {visibleErrors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {visibleWarnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {visibleWarnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function SalesExportWarehouseChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newWarehouseId, setNewWarehouseId] = useState<number | undefined>()
    const [lotSelectionMode, setLotSelectionMode] = useState<"AUTO" | "SINGLE" | "CUSTOM">("AUTO")
    const [selectedLotNo, setSelectedLotNo] = useState<string | undefined>()
    const [lotQuantities, setLotQuantities] = useState<Record<string, string>>({})
    const [result, setResult] = useState<SalesExportWarehouseChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewWarehouseId(undefined)
            setLotSelectionMode("AUTO")
            setSelectedLotNo(undefined)
            setLotQuantities({})
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const unchanged = Boolean(newWarehouseId && row?.warehouse_id && Number(newWarehouseId) === Number(row.warehouse_id))
    const missingWarehouse = !newWarehouseId
    const busy = false
    const lotsQuery = useQuery({
        queryKey: ["sales-export-warehouse-change-lots", row?.id, newWarehouseId],
        enabled: Boolean(open && row?.id && newWarehouseId && !unchanged),
        queryFn: () => listSalesExportWarehouseChangeLots(Number(row?.id), Number(newWarehouseId)),
        staleTime: 10_000,
    })
    const contextQuery = useQuery({
        queryKey: ["sales-export-warehouse-change-context", row?.id, newWarehouseId],
        enabled: Boolean(open && row?.id && newWarehouseId && !unchanged),
        queryFn: () => checkSalesExportWarehouseChange(Number(row?.id), Number(newWarehouseId), "AUTO"),
        staleTime: 10_000,
    })
    const availableLots = Array.isArray(lotsQuery.data) ? lotsQuery.data : []
    const lotSelectValue = lotSelectionMode === "SINGLE" ? (selectedLotNo || "AUTO") : lotSelectionMode
    const selectedAllocations = buildSalesExportWarehouseLotAllocations(availableLots, lotQuantities)
    const requiredQuantity = Number(result?.quantity ?? contextQuery.data?.quantity ?? row?.quantity_out ?? 0)
    const ledgerLineQuantity = Number(row?.quantity_out || 0)
    const allocatedQuantity = selectedAllocations.reduce((sum, allocation) => sum + Number(allocation.quantity || 0), 0)
    const allocationDiff = requiredQuantity - allocatedQuantity
    useEffect(() => {
        if (lotSelectionMode !== "SINGLE" || !selectedLotNo || requiredQuantity <= 0) return
        const selectedLot = availableLots.find((lot) => (lot.lot_no || lot.lot_code) === selectedLotNo)
        const safeQuantity = Number(selectedLot?.history_safe_quantity ?? selectedLot?.available_quantity ?? 0)
        if (!selectedLot || safeQuantity < requiredQuantity) {
            setLotSelectionMode("AUTO")
            setSelectedLotNo(undefined)
            setResult(null)
            setErrorMessage("")
        }
    }, [availableLots, lotSelectionMode, requiredQuantity, selectedLotNo])
    const allocationHasInvalidLot = availableLots.some((lot) => {
        const quantity = Number(lotQuantities[salesExportWarehouseLotKey(lot)] || 0)
        const safeQuantity = Number(lot.history_safe_quantity ?? lot.available_quantity ?? 0)
        return quantity > safeQuantity
    })
    const allocationValid = lotSelectionMode === "AUTO"
        || (lotSelectionMode === "SINGLE" && Boolean(selectedLotNo))
        || (selectedAllocations.length > 0 && sameDecimal(allocatedQuantity, requiredQuantity) && !allocationHasInvalidLot)
    const updateLotQuantity = (lot: SalesExportWarehouseAvailableLot, value: string) => {
        const key = salesExportWarehouseLotKey(lot)
        if (!key) return
        setLotQuantities((current) => ({ ...current, [key]: value }))
        setResult(null)
        setErrorMessage("")
    }
    const autoAllocateLots = () => {
        setLotQuantities(autoAllocateSalesExportWarehouseLots(availableLots, requiredQuantity))
        setResult(null)
        setErrorMessage("")
    }
    const checkMutation = useMutation({
        mutationFn: () => checkSalesExportWarehouseChange(
            Number(row?.id),
            Number(newWarehouseId),
            lotSelectionMode,
            lotSelectionMode === "SINGLE" ? selectedLotNo : undefined,
            lotSelectionMode === "CUSTOM" ? selectedAllocations : undefined
        ),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được kho xuất mới.")
        },
    })
    const applyMutation = useMutation({
        mutationFn: () => applySalesExportWarehouseChange(
            Number(row?.id),
            Number(newWarehouseId),
            lotSelectionMode,
            lotSelectionMode === "SINGLE" ? selectedLotNo : undefined,
            lotSelectionMode === "CUSTOM" ? selectedAllocations : undefined
        ),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            if (data?.valid) onChanged()
            toast.success("Đã đổi kho xuất bán")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không đổi được kho xuất bán.")
        },
    })
    const pending = busy || checkMutation.isPending || applyMutation.isPending || lotsQuery.isLoading || contextQuery.isLoading
    const canCheck = Boolean(!pending && !missingWarehouse && !unchanged && allocationValid)
    const canApply = Boolean(result?.valid && !result.applied && !missingWarehouse && !unchanged && allocationValid && !pending)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1080px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Đổi kho xuất bán <NewBadge /></DialogTitle>
                    <DialogDescription>
                        Chỉ đổi kho cho dòng xuất bán đã chọn. Hệ thống sẽ bỏ FIFO cũ, chạy lại FIFO theo kho mới và rollback toàn bộ nếu cập nhật lỗi.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={`${formatDate(row.posting_date)} ${formatTime(row.posting_time)}`} />
                            <InfoItem label="Kho hiện tại" value={row.warehouse_name} />
                            <InfoItem label="Hàng hóa" value={`${row.product_code} - ${row.product_name}`} />
                            {!sameDecimal(requiredQuantity, ledgerLineQuantity) ? (
                                <InfoItem label="SL dòng sổ kho" value={formatNumber(ledgerLineQuantity)} />
                            ) : null}
                            <InfoItem label="Số lượng xuất" value={formatNumber(requiredQuantity)} />
                            <InfoItem label="Lô hiện tại" value={row.lot_code || "-"} />
                        </div>

                        <div className="grid gap-2 md:max-w-2xl">
                            <label className="text-sm font-medium">Kho xuất mới</label>
                            <AsyncSelect
                                value={newWarehouseId}
                                onChange={(value: number | string | undefined) => {
                                    setNewWarehouseId(value ? Number(value) : undefined)
                                    setLotSelectionMode("AUTO")
                                    setSelectedLotNo(undefined)
                                    setLotQuantities({})
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                dataSource={{ getList: listWarehouses, getById: getWarehouse, params: { page: 1, size: 20 } }}
                                mapOption={(warehouse: any) => ({
                                    value: warehouse.id,
                                    label: `${warehouse.code || ""} - ${warehouse.name || ""}`,
                                    raw: warehouse,
                                })}
                                placeholder="Chọn kho xuất mới"
                                searchPlaceholder="Tìm mã hoặc tên kho..."
                                emptyText="Không tìm thấy kho"
                                optionWrapLabel
                                wrapLabel
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Kho xuất mới phải khác kho hiện tại.</div>
                            ) : null}
                        </div>

                        <div className="space-y-3 rounded-md border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-medium">Lô xuất ở kho mới</div>
                                    <div className="text-xs text-muted-foreground">
                                        Tùy chọn sẽ được kiểm tra tồn tại thời điểm xuất và âm tồn lịch sử trước khi áp dụng.
                                    </div>
                                </div>
                                <Select
                                    value={lotSelectValue}
                                    disabled={!newWarehouseId || unchanged || pending}
                                    onValueChange={(value) => {
                                        if (value === "CUSTOM") {
                                            setLotSelectionMode("CUSTOM")
                                            setSelectedLotNo(undefined)
                                        } else if (value === "AUTO") {
                                            setLotSelectionMode("AUTO")
                                            setSelectedLotNo(undefined)
                                        } else {
                                            setLotSelectionMode("SINGLE")
                                            setSelectedLotNo(value)
                                            setLotQuantities({})
                                        }
                                        setResult(null)
                                        setErrorMessage("")
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AUTO">
                                            <span className="inline-flex items-center gap-1.5">
                                                <WarehouseIcon className="h-3.5 w-3.5" />
                                                Auto FIFO
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="CUSTOM">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Pencil className="h-3.5 w-3.5" />
                                                Tùy chọn
                                            </span>
                                        </SelectItem>
                                        {(lotsQuery.isLoading || lotsQuery.isFetching) && <SelectItem value="LOADING" disabled>Đang tải lô...</SelectItem>}
                                        {availableLots.map((lot, index) => {
                                            const lotNo = lot.lot_no || lot.lot_code || ""
                                            if (!lotNo) return null
                                            const safeQuantity = Number(lot.history_safe_quantity ?? lot.available_quantity ?? 0)
                                            const enoughForSingleLot = safeQuantity >= requiredQuantity
                                            return (
                                                <SelectItem
                                                    key={`${lot.id ?? lot.lot_id ?? index}-${lotNo}`}
                                                    value={lotNo}
                                                    textValue={lotNo}
                                                    disabled={!enoughForSingleLot}
                                                >
                                                    {lotNo} - {enoughForSingleLot
                                                        ? `an toàn ${formatNumber(safeQuantity)}`
                                                        : `không đủ, an toàn ${formatNumber(safeQuantity)}/${formatNumber(requiredQuantity)}`}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {lotSelectionMode === "CUSTOM" ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 px-3 py-2 text-sm">
                                        <span>Cần xuất <b className="tabular-nums">{formatNumber(requiredQuantity)}</b></span>
                                        <span>Đã phân bổ <b className={sameDecimal(allocatedQuantity, requiredQuantity) ? "text-emerald-700 tabular-nums" : "text-red-700 tabular-nums"}>{formatNumber(allocatedQuantity)}</b></span>
                                        <span className={sameDecimal(allocationDiff, 0) ? "text-muted-foreground" : "font-medium text-red-700"}>
                                            Chênh {formatNumber(allocationDiff)}
                                        </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={lotsQuery.isLoading || !availableLots.length}
                                            onClick={autoAllocateLots}
                                        >
                                            Tự phân bổ
                                        </Button>
                                    </div>

                                    <div className="max-h-72 overflow-auto rounded-md border">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
                                                <tr>
                                                    <Th>Số lô</Th>
                                                    <Th className="w-36 text-right">Tồn thời điểm</Th>
                                                    <Th className="w-36 text-right">SL an toàn</Th>
                                                    <Th className="w-40 text-right">Số lượng xuất</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lotsQuery.isLoading ? (
                                                    <tr>
                                                        <Td colSpan={4} className="py-6 text-center text-muted-foreground">Đang tải lô...</Td>
                                                    </tr>
                                                ) : availableLots.length ? (
                                                    availableLots.map((lot, index) => {
                                                        const key = salesExportWarehouseLotKey(lot)
                                                        const safeQuantity = Number(lot.history_safe_quantity ?? lot.available_quantity ?? 0)
                                                        const quantity = Number(lotQuantities[key] || 0)
                                                        const invalid = quantity > safeQuantity
                                                        return (
                                                            <tr key={key || index} className="border-t">
                                                                <Td className="font-mono">{lot.lot_no || lot.lot_code || "-"}</Td>
                                                                <Td className="text-right tabular-nums">{formatNumber(Number(lot.available_quantity || 0))}</Td>
                                                                <Td className="text-right tabular-nums">{formatNumber(safeQuantity)}</Td>
                                                                <Td>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        className={cn("ml-auto h-8 w-32 text-right tabular-nums", invalid && "border-red-400")}
                                                                        value={lotQuantities[key] ?? ""}
                                                                        onChange={(event) => {
                                                                            const value = event.target.value
                                                                            if (/^\d*(\.\d*)?$/.test(value)) updateLotQuantity(lot, value)
                                                                        }}
                                                                    />
                                                                    {invalid ? <div className="mt-1 text-right text-xs text-red-600">Vượt SL an toàn</div> : null}
                                                                </Td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <Td colSpan={4} className="py-6 text-center text-muted-foreground">Không có lô khả dụng ở kho mới.</Td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-md bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                                    {lotSelectionMode === "SINGLE" && selectedLotNo
                                        ? `Hệ thống sẽ xuất toàn bộ theo lô ${selectedLotNo} và kiểm tra tồn/âm tồn lịch sử trước khi áp dụng.`
                                        : "Hệ thống sẽ tự phân bổ FIFO tại kho mới và bỏ qua lô có nguy cơ làm âm tồn lịch sử."}
                                </div>
                            )}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể đổi kho xuất bán
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <SalesExportWarehouseChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!canCheck}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Đổi kho
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function SalesExportWarehouseChangeResultPanel({ result }: { result: SalesExportWarehouseChangeResult }) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const counts = result.counts || {}
    const changes = result.changes || {}
    const affectedPeriods = result.affected_period_ids || []
    const plan = result.fifo_plan || []
    const customMode = result.lot_selection_mode === "CUSTOM"
    const singleMode = result.lot_selection_mode === "SINGLE"

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã đổi kho xuất bán" : valid ? "Có thể đổi kho xuất bán" : "Không thể đổi kho xuất bán"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Kho hiện tại" value={result.old_warehouse_name} />
                <ResultInfo label="Kho mới" value={result.new_warehouse_name} />
                <ResultInfo label="Số lượng xuất" value={formatNumber(Number(result.quantity || 0))} />
                <ResultInfo label="Dòng sổ kho cũ" value={formatNumber(Number(counts.old_ledger_rows || 0))} />
                <ResultInfo label={customMode ? "Số lô tùy chọn" : singleMode ? "Số lô đã chọn" : "Số lô FIFO mới"} value={formatNumber(Number(counts.new_fifo_lots || plan.length || 0))} />
                <ResultInfo label="Giao dịch bán hàng" value={formatNumber(Number(counts.sales_transactions || changes.updated_sales_transactions || 0))} />
                <ResultInfo label="Kỳ costing cần tính lại" value={formatNumber(applied ? Number(changes.stale_cost_periods || 0) : affectedPeriods.length)} />
                {applied ? <ResultInfo label="Ledger cập nhật/tạo/xóa" value={`${formatNumber(Number(changes.reused_ledger_rows || 0))}/${formatNumber(Number(changes.inserted_ledger_rows || 0))}/${formatNumber(Number(changes.deleted_ledger_rows || 0))}`} /> : null}
                {applied ? <ResultInfo label="FIFO tạo lại" value={formatNumber(Number(changes.inserted_fifo_rows || 0))} /> : null}
                {applied ? <ResultInfo label="Giá vốn tạo lại" value={formatNumber(Number(changes.rebuilt_cost_consumptions || 0))} /> : null}
            </div>

            {plan.length ? (
                <div className="mt-3 rounded-md border bg-white/80">
                    <div className="border-b px-3 py-2 font-semibold">{customMode ? "Phân bổ lô tùy chọn" : singleMode ? "Lô đã chọn" : "FIFO theo kho mới"}</div>
                    <div className="max-h-56 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs text-muted-foreground">
                                <tr>
                                    <Th className="w-14 text-center">#</Th>
                                    <Th>Số lô</Th>
                                    <Th className="w-36 text-right">Tồn tại thời điểm</Th>
                                    <Th className="w-36 text-right">SL an toàn</Th>
                                    <Th className="w-36 text-right">Số lượng lấy</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {plan.map((item, index) => (
                                    <tr key={`${item.lot_id}-${index}`} className="border-t">
                                        <Td className="text-center">{index + 1}</Td>
                                        <Td className="font-mono">{item.lot_no}</Td>
                                        <Td className="text-right tabular-nums">{formatNumber(Number(item.available_quantity || 0))}</Td>
                                        <Td className="text-right tabular-nums">{formatNumber(Number(item.history_safe_quantity || item.quantity || 0))}</Td>
                                        <Td className="text-right tabular-nums">{formatNumber(Number(item.quantity || 0))}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function filterPriceSensitiveMessages(messages?: string[] | null) {
    if (!messages?.length) return []
    const pricePatterns = ["đơn giá", "don gia", "thành tiền", "thanh tien", "giá trị", "gia tri", "tiền", "tien"]
    return messages.filter((message) => {
        const normalized = message.toLowerCase()
        return !pricePatterns.some((pattern) => normalized.includes(pattern))
    })
}

function PurchaseProductChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newProductId, setNewProductId] = useState<number | undefined>()
    const [result, setResult] = useState<PurchaseProductChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewProductId(undefined)
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const unchanged = Boolean(newProductId && row?.product_id && Number(newProductId) === Number(row.product_id))
    const missingProduct = !newProductId
    const checkMutation = useMutation({
        mutationFn: () => checkPurchaseProductChange(Number(row?.id), Number(newProductId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được mã hàng.")
        },
    })
    const applyMutation = useMutation({
        mutationFn: () => applyPurchaseProductChange(Number(row?.id), Number(newProductId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            onChanged()
            toast.success("Đã sửa mã hàng mua hàng")
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không sửa được mã hàng.")
        },
    })
    const pending = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid && !result.applied && !missingProduct && !unchanged && !pending)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1040px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Sửa mã hàng nhập kho</DialogTitle>
                    <DialogDescription>
                        Chỉ sửa từng dòng mua hàng nhập khẩu/trong nước hoặc nhập kho khác. Hệ thống kiểm tra trước và rollback toàn bộ nếu cập nhật lỗi.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Mã hiện tại" value={row.product_code} />
                            <InfoItem label="Tên hiện tại" value={row.product_name} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng nhập" value={formatNumber(Number(row.quantity_in || 0))} />
                            <InfoItem label="Đơn vị hiện tại" value={row.unit || "-"} />
                        </div>

                        <div className="grid gap-2 md:max-w-xl">
                            <label className="text-sm font-medium">Mã hàng mới</label>
                            <AsyncSelect
                                value={newProductId}
                                onChange={(value: number | string | undefined) => {
                                    setNewProductId(value ? Number(value) : undefined)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                                mapOption={(product: any) => ({
                                    value: product.id,
                                    label: `${product.code || ""} - ${product.name || ""}`,
                                    raw: product,
                                })}
                                placeholder="Chọn mã hàng mới"
                                searchPlaceholder="Tìm mã hoặc tên hàng..."
                                emptyText="Không tìm thấy mã hàng"
                                optionWrapLabel
                                wrapLabel
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Mã hàng mới phải khác mã hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể sửa mã hàng
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <PurchaseProductChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={pending || missingProduct || unchanged}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Cập nhật
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PurchaseProductChangeResultPanel({ result }: { result: PurchaseProductChangeResult }) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const counts = result.counts || {}
    const changes = result.changes || {}
    const affectedPeriods = result.affected_period_ids || []

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied ? "Đã sửa mã hàng" : valid ? "Có thể sửa mã hàng" : "Không thể sửa mã hàng"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Mã hiện tại" value={`${result.old_product_code} - ${result.old_product_name}`} />
                <ResultInfo label="Mã mới" value={`${result.new_product_code} - ${result.new_product_name}`} />
                <ResultInfo label="Số lô" value={result.lot_no || "-"} />
                <ResultInfo label="Dòng sổ kho ảnh hưởng" value={formatNumber(Number(counts.ledger_rows || changes.updated_ledgers || 0))} />
                <ResultInfo label="Dòng phiếu kho ảnh hưởng" value={formatNumber(Number(counts.voucher_items || changes.updated_voucher_items || 0))} />
                <ResultInfo label="FIFO ảnh hưởng" value={formatNumber(Number(counts.fifo_allocations || changes.updated_fifo_allocations || 0))} />
                <ResultInfo label="Lớp giá vốn ảnh hưởng" value={formatNumber(Number(counts.cost_layers || changes.updated_cost_layers || 0))} />
                <ResultInfo label="SX nguyên liệu ảnh hưởng" value={formatNumber(Number(counts.production_materials || changes.updated_production_materials || 0))} />
                <ResultInfo label="Giao dịch bán hàng" value={formatNumber(Number(counts.sales_transactions || changes.updated_sales_transactions || 0))} />
                <ResultInfo label="Công nợ dòng trả" value={formatNumber(Number(counts.ar_ledger || changes.updated_ar_ledger || 0))} />
                <ResultInfo label="Kỳ costing cần tính lại" value={formatNumber(applied ? Number(changes.stale_cost_periods || 0) : affectedPeriods.length)} />
            </div>

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function SalesReturnProductChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newProductId, setNewProductId] = useState<number | undefined>()
    const [result, setResult] = useState<SalesReturnProductChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        if (open && row) {
            setNewProductId(undefined)
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    const unchanged = Boolean(newProductId && row?.product_id && Number(newProductId) === Number(row.product_id))
    const missingProduct = !newProductId
    const checkMutation = useMutation({
        mutationFn: () => checkSalesReturnProductChange(Number(row?.id), Number(newProductId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
        },
        onError: (error: any) => {
            setResult(null)
            setErrorMessage(error?.message || "Không kiểm tra được mã hàng nhập trả.")
        },
    })
    const applyMutation = useMutation({
        mutationFn: () => applySalesReturnProductChange(Number(row?.id), Number(newProductId)),
        onSuccess: (data) => {
            setResult(data)
            setErrorMessage("")
            if (data?.valid) onChanged()
            toast.success("Đã sửa mã hàng nhập trả")
        },
        onError: (error: any) => {
            setErrorMessage(error?.message || "Không sửa được mã hàng nhập trả.")
        },
    })
    const pending = checkMutation.isPending || applyMutation.isPending
    const canApply = Boolean(result?.valid && !result.applied && !missingProduct && !unchanged && !pending)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "min(1040px, calc(100vw - 32px))", maxWidth: "calc(100vw - 32px)" }}
            >
                <DialogHeader>
                    <DialogTitle>Sửa mã hàng nhập trả <NewBadge /></DialogTitle>
                    <DialogDescription>
                        Chỉ sửa từng dòng nhập kho từ hàng bán trả lại. Hệ thống đồng bộ dòng trả hàng, phiếu kho, sổ kho và rollback toàn bộ nếu cập nhật lỗi.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm md:grid-cols-3">
                            <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                            <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                            <InfoItem label="Kho" value={row.warehouse_name} />
                            <InfoItem label="Mã hiện tại" value={row.product_code} />
                            <InfoItem label="Tên hiện tại" value={row.product_name} />
                            <InfoItem label="Số lô" value={row.lot_code || "-"} />
                            <InfoItem label="Số lượng nhập trả" value={formatNumber(Number(row.quantity_in || 0))} />
                            <InfoItem label="Đơn vị hiện tại" value={row.unit || "-"} />
                        </div>

                        <div className="grid gap-2 md:max-w-xl">
                            <label className="text-sm font-medium">Mã hàng mới</label>
                            <AsyncSelect
                                value={newProductId}
                                onChange={(value: number | string | undefined) => {
                                    setNewProductId(value ? Number(value) : undefined)
                                    setResult(null)
                                    setErrorMessage("")
                                }}
                                dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                                mapOption={(product: any) => ({
                                    value: product.id,
                                    label: `${product.code || ""} - ${product.name || ""}`,
                                    raw: product,
                                })}
                                placeholder="Chọn mã hàng mới"
                                searchPlaceholder="Tìm mã hoặc tên hàng..."
                                emptyText="Không tìm thấy mã hàng"
                                optionWrapLabel
                                wrapLabel
                            />
                            {unchanged ? (
                                <div className="text-sm text-destructive">Mã hàng mới phải khác mã hiện tại.</div>
                            ) : null}
                        </div>

                        {errorMessage ? (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <div className="flex items-start gap-2 font-semibold">
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                    Không thể sửa mã hàng nhập trả
                                </div>
                                <div className="mt-1 pl-6">{errorMessage}</div>
                            </div>
                        ) : null}

                        {result ? <PurchaseProductChangeResultPanel result={result} /> : null}
                    </div>
                ) : null}

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={pending || missingProduct || unchanged}
                        onClick={() => checkMutation.mutate()}
                    >
                        {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Kiểm tra
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply}
                        onClick={() => applyMutation.mutate()}
                    >
                        {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Cập nhật
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PurchasePostingDateTimeChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [newDate, setNewDate] = useState("")
    const [newTime, setNewTime] = useState("")
    const [result, setResult] = useState<PurchasePostingDateTimeChangeResult | null>(null)
    const [errorText, setErrorText] = useState<string | null>(null)

    useEffect(() => {
        if (open && row) {
            setNewDate(toDateInputValue(row.posting_date))
            setNewTime(toTimeInputValue(row.posting_time))
            setResult(null)
            setErrorText(null)
        }
    }, [open, row])

    const oldDate = toDateInputValue(row?.posting_date)
    const oldTime = toTimeInputValue(row?.posting_time)
    const changed = Boolean(row && newDate && newTime && (newDate !== oldDate || normalizeTimeForApi(newTime) !== normalizeTimeForApi(oldTime)))
    const applied = Boolean(result?.applied)

    const handleDateChange = (value: string) => {
        setNewDate(value)
        setResult(null)
        setErrorText(null)
    }

    const handleTimeChange = (value: string) => {
        setNewTime(value)
        setResult(null)
        setErrorText(null)
    }

    const checkMutation = useMutation({
        mutationFn: () => checkPurchasePostingDateTimeChange(Number(row?.id), newDate, normalizeTimeForApi(newTime)),
        onSuccess: (data) => {
            setResult(data)
            setErrorText(null)
        },
        onError: (error: any) => {
            setResult(null)
            setErrorText(error?.message || "Không kiểm tra được ngày/giờ chứng từ")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyPurchasePostingDateTimeChange(Number(row?.id), newDate, normalizeTimeForApi(newTime)),
        onSuccess: (data) => {
            setResult(data)
            setErrorText(null)
            if (data?.valid) onChanged()
        },
        onError: (error: any) => {
            setResult(null)
            setErrorText(error?.message || "Không đổi được ngày/giờ chứng từ")
        },
    })

    if (!row) return null

    const working = checkMutation.isPending || applyMutation.isPending

        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-h-[calc(100vh-32px)] !w-[min(1280px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] overflow-y-auto"
                >
                <DialogHeader>
                    <DialogTitle>Đổi ngày/giờ chứng từ mua hàng</DialogTitle>
                    <DialogDescription>
                        Áp dụng cho toàn bộ phiếu/chứng từ mua hàng nhập khẩu hoặc mua hàng trong nước. Hệ thống kiểm tra lịch sử tồn theo ngày và giờ trước khi ghi thật.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-4">
                        <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                        <InfoItem label="Loại chứng từ" value={getDocTypeMeta(row.doc_type).label} />
                        <InfoItem label="Thời điểm hiện tại" value={`${formatDate(row.posting_date)} ${formatTime(row.posting_time)}`} />
                        <InfoItem label="Số lô" value={row.lot_code || "-"} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium">Ngày mới</span>
                            <Input
                                type="date"
                                value={newDate}
                                onChange={(event) => handleDateChange(event.target.value)}
                            />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium">Giờ mới</span>
                            <Input
                                type="time"
                                step="1"
                                value={newTime}
                                onChange={(event) => handleTimeChange(event.target.value)}
                            />
                        </label>
                    </div>

                    {!changed ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Ngày/giờ mới phải khác thời điểm hiện tại của chứng từ.
                        </div>
                    ) : null}

                    {errorText ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {errorText}
                        </div>
                    ) : null}

                    {result ? <PurchasePostingDateTimeChangeResultPanel result={result} /> : null}

                    <div className="flex justify-end gap-2 border-t pt-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={working}>
                            Đóng
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={!changed || working}
                            onClick={() => checkMutation.mutate()}
                        >
                            {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kiểm tra
                        </Button>
                        <Button
                            type="button"
                            disabled={!changed || working || applied}
                            onClick={() => applyMutation.mutate()}
                        >
                            {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Đổi ngày/giờ
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const LEDGER_CORRECTION_HELP: Array<{ docType: string; actions: string }> = [
    { docType: "Bảng ledger", actions: "Mở chi tiết phiếu; sửa nhanh đúng dòng: thông số tĩnh, lô, số lượng, mã hàng, xóa dòng đủ điều kiện" },
    { docType: "Mua hàng nhập khẩu nhập kho chưa thanh toán", actions: "Đầu phiếu: đổi ngày/giờ. Dòng: đổi lô, sửa số lượng, sửa mã hàng, đổi kho nhập (N), sửa tổng giá trị (N)" },
    { docType: "Mua hàng trong nước nhập kho chưa thanh toán", actions: "Đầu phiếu: đổi ngày/giờ. Dòng: đổi lô, sửa số lượng, sửa mã hàng, đổi kho nhập (N), sửa tổng giá trị (N)" },
    { docType: "Nhập kho khác", actions: "Đầu phiếu: sửa giờ. Dòng: đổi lô, sửa số lượng, sửa mã hàng (N), đổi kho nhập (N), sửa tổng giá trị (N), xóa dòng (N)" },
    { docType: "Xuất kho khác", actions: "Đầu phiếu: sửa giờ. Dòng: đổi lô xuất, sửa số lượng, sửa tổng giá trị (N), xóa dòng" },
    { docType: "Nhập kho từ hàng bán trả lại", actions: "Đầu phiếu: đổi ngày/giờ. Dòng: đổi kho nhập trả hàng, sửa đơn giá nhập trả hàng" },
    { docType: "Xuất kho bán hàng", actions: "Đầu phiếu: đổi ngày/giờ. Dòng: đổi lô xuất kho" },
    { docType: "Xuất/Nhập chuyển kho nội bộ", actions: "Dòng: đổi kho chuyển kho nội bộ" },
    { docType: "Nhập kho thành phẩm sản xuất", actions: "Đầu phiếu: sửa giờ chứng từ" },
]

function LedgerCorrectionHelp() {
    return (
        <div className="flex items-center justify-center gap-1.5">
            <span>Thao tác</span>
            <TooltipProvider delayDuration={150}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground inline-flex h-5 w-5 items-center justify-center"
                            aria-label="Xem các thao tác sửa sai đã hỗ trợ"
                        >
                            <CircleHelp className="h-3.5 w-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="left"
                        align="start"
                        className="w-[520px] max-w-[calc(100vw-2rem)] overflow-hidden border bg-popover p-0 text-popover-foreground shadow-xl"
                    >
                        <div className="border-b bg-muted/40 px-4 py-3">
                            <div className="text-sm font-semibold text-foreground">Các thao tác sửa sai đã hỗ trợ</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">Danh sách được phân theo loại chứng từ</div>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 border-b bg-muted/20 px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                            <span>Loại chứng từ</span>
                            <span>Thao tác hỗ trợ</span>
                        </div>
                        <div className="max-h-[420px] divide-y overflow-y-auto">
                            {LEDGER_CORRECTION_HELP.map((item) => (
                                <div
                                    key={item.docType}
                                    className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 px-4 py-2.5 text-left text-sm even:bg-muted/15"
                                >
                                    <span className="font-medium leading-5 text-foreground">{item.docType}</span>
                                    <span className="leading-5 text-foreground/75">{item.actions}</span>
                                </div>
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

function DocumentPostingTimeChangeDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const canChangeDate = canChangeDocumentPostingDate(row?.doc_type)
    const [newDate, setNewDate] = useState("")
    const [newTime, setNewTime] = useState("")
    const [result, setResult] = useState<DocumentPostingTimeChangeResult | null>(null)
    const [errorText, setErrorText] = useState<string | null>(null)

    useEffect(() => {
        if (open && row) {
            setNewDate(toDateInputValue(row.posting_date))
            setNewTime(row.posting_time ? toTimeInputValue(row.posting_time) : currentTimeInputValue())
            setResult(null)
            setErrorText(null)
        }
    }, [open, row])

    const oldDate = toDateInputValue(row?.posting_date)
    const oldTime = row?.posting_time ? toTimeInputValue(row.posting_time) : ""
    const changed = Boolean(
        row && newTime && (normalizeTimeForApi(newTime) !== normalizeTimeForApi(oldTime) || (canChangeDate && newDate !== oldDate)),
    )
    const applied = Boolean(result?.applied)

    const handleTimeChange = (value: string) => {
        setNewTime(value)
        setResult(null)
        setErrorText(null)
    }

    const handleDateChange = (value: string) => {
        setNewDate(value)
        setResult(null)
        setErrorText(null)
    }


    const checkMutation = useMutation({
        mutationFn: () => checkDocumentPostingTimeChange(
            Number(row?.id),
            normalizeTimeForApi(newTime),
            canChangeDate ? newDate : undefined,
        ),
        onSuccess: (data) => {
            setResult(data)
            setErrorText(null)
        },
        onError: (error: any) => {
            setResult(null)
            setErrorText(error?.message || "Không kiểm tra được giờ chứng từ")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyDocumentPostingTimeChange(
            Number(row?.id),
            normalizeTimeForApi(newTime),
            canChangeDate ? newDate : undefined,
        ),
        onSuccess: (data) => {
            setResult(data)
            setErrorText(null)
            if (data?.valid) onChanged()
        },
        onError: (error: any) => {
            setErrorText(error?.message || "Không đổi được giờ chứng từ")
        },
    })

    if (!row) return null

    const working = checkMutation.isPending || applyMutation.isPending
    const flowLabel = documentPostingTimeLabel(row.doc_type)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-32px)] !w-[min(1180px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{canChangeDate ? "Đổi ngày/giờ" : "Sửa giờ"} {flowLabel}</DialogTitle>
                    <DialogDescription>
                        Flow sửa sai riêng cho {flowLabel}. Hệ thống giả lập lại lịch sử tồn trước khi cập nhật toàn bộ chứng từ và nguồn phát sinh trong một giao dịch.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-4">
                        <InfoItem label="Chứng từ" value={row.doc_no || `#${row.id}`} />
                        <InfoItem label="Loại chứng từ" value={getDocTypeMeta(row.doc_type).label} />
                        <InfoItem label="Ngày chứng từ" value={formatDate(row.posting_date)} />
                        <InfoItem label="Giờ hiện tại" value={row.posting_time ? formatTime(row.posting_time) : "Chưa có giờ"} />
                    </div>

                    <div className={cn("grid max-w-2xl gap-3", canChangeDate && "sm:grid-cols-2")}>
                        {canChangeDate ? (
                            <label className="block space-y-1.5">
                                <span className="text-sm font-medium">Ngày mới</span>
                                <Input
                                    type="date"
                                    value={newDate}
                                    max={currentLocalDateInputValue()}
                                    onChange={(event) => handleDateChange(event.target.value)}
                                />
                            </label>
                        ) : null}
                        <label className="block space-y-1.5">
                            <span className="text-sm font-medium">Giờ mới</span>
                            <Input
                                type="time"
                                step="1"
                                value={newTime}
                                onChange={(event) => handleTimeChange(event.target.value)}
                            />
                        </label>
                    </div>

                    {!changed ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {canChangeDate
                                ? "Ngày/giờ mới phải khác ngày/giờ hiện tại của chứng từ."
                                : "Giờ mới phải khác giờ hiện tại của chứng từ."}
                        </div>
                    ) : null}

                    {errorText ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {errorText}
                        </div>
                    ) : null}

                    {result ? <PurchasePostingDateTimeChangeResultPanel result={result} timeOnly={!canChangeDate} /> : null}

                    <div className="flex justify-end gap-2 border-t pt-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={working}>
                            Đóng
                        </Button>
                        <Button type="button" variant="outline" disabled={!changed || working || applied} onClick={() => checkMutation.mutate()}>
                            {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kiểm tra
                        </Button>
                        <Button
                            type="button"
                            disabled={!changed || working || applied || !result?.valid}
                            onClick={() => applyMutation.mutate()}
                        >
                            {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {canChangeDate ? "Đổi ngày/giờ" : "Đổi giờ"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function LegacyPostingTimeNormalizationDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: InventoryLedgerReportRow | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [result, setResult] = useState<LegacyPostingTimeNormalizationResult | null>(null)
    const [postingTimes, setPostingTimes] = useState<Record<number, string>>({})
    const [dirtyAfterCheck, setDirtyAfterCheck] = useState(false)
    const [errorText, setErrorText] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setResult(null)
            setPostingTimes({})
            setDirtyAfterCheck(false)
            setErrorText(null)
        }
    }, [open, row?.id])

    const buildPayload = () => {
        const rows = result?.rows || []
        if (!rows.length) return undefined
        return {
            rows: rows.map((item) => ({
                ledgerId: Number(item.ledger_id),
                postingTime: normalizeTimeForApi(postingTimes[Number(item.ledger_id)] || item.new_posting_time || ""),
            })),
        }
    }

    const checkMutation = useMutation({
        mutationFn: () => checkLegacyPostingTimeNormalization(Number(row?.id), buildPayload()),
        onSuccess: (data) => {
            setResult(data)
            setPostingTimes(Object.fromEntries((data.rows || []).map((item) => [
                Number(item.ledger_id),
                toTimeInputValue(item.new_posting_time),
            ])))
            setDirtyAfterCheck(false)
            setErrorText(null)
        },
        onError: (error: any) => {
            setResult(null)
            setErrorText(error?.message || "Không kiểm tra được dữ liệu cần chuẩn hóa giờ")
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => applyLegacyPostingTimeNormalization(Number(row?.id), buildPayload()),
        onSuccess: (data) => {
            setResult(data)
            setPostingTimes(Object.fromEntries((data.rows || []).map((item) => [
                Number(item.ledger_id),
                toTimeInputValue(item.new_posting_time),
            ])))
            setDirtyAfterCheck(false)
            setErrorText(null)
            if (data?.valid) {
                onChanged()
                toast.success("Đã chuẩn hóa giờ dữ liệu cũ")
            }
        },
        onError: (error: any) => {
            setErrorText(error?.message || "Không chuẩn hóa được giờ dữ liệu cũ")
        },
    })

    if (!row) return null

    const working = checkMutation.isPending || applyMutation.isPending
    const applied = Boolean(result?.applied)
    const valid = Boolean(result?.valid)
    const canApply = valid && !dirtyAfterCheck

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-32px)] !w-[min(1180px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chuẩn hóa giờ dữ liệu cũ</DialogTitle>
                    <DialogDescription>
                        Chỉ lấy các dòng sổ kho cùng ngày/cùng lô với dòng đang chọn, có giờ trống hoặc 00:00:00. Hệ thống gán nhập trước, xuất sau và kiểm tra âm tồn trước khi cập nhật.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-4">
                        <InfoItem label="Chứng từ chọn" value={row.doc_no || `#${row.id}`} />
                        <InfoItem label="Ngày" value={formatDate(row.posting_date)} />
                        <InfoItem label="Giờ hiện tại" value={row.posting_time ? formatTime(row.posting_time) : "Chưa có giờ"} />
                        <InfoItem label="Số lô" value={row.lot_code || "-"} />
                        <InfoItem label="Mã hàng" value={row.product_code || "-"} />
                        <InfoItem label="Tên hàng" value={row.product_name || "-"} />
                        <InfoItem label="Kho" value={row.warehouse_name || row.warehouse_code || "-"} />
                        <InfoItem label="Quy tắc" value="Cùng ngày, cùng lot_id" />
                    </div>

                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        Tool này chỉ sửa `posting_time` trên sổ kho. Nếu cập nhật lỗi hoặc sau cập nhật còn âm tồn lịch sử, toàn bộ thay đổi sẽ rollback trong cùng giao dịch.
                    </div>

                    {errorText ? (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {errorText}
                        </div>
                    ) : null}

                    {result ? (
                        <div className={cn(
                            "rounded-md border p-3 text-sm",
                            valid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800",
                        )}>
                            <div className="flex items-start gap-2 font-semibold">
                                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                                <span>{applied ? "Đã chuẩn hóa giờ dữ liệu cũ" : valid ? "Có thể chuẩn hóa giờ dữ liệu cũ" : "Không thể chuẩn hóa giờ dữ liệu cũ"}</span>
                            </div>
                            <div className="mt-1 pl-6">{result.message}</div>
                            <div className="mt-3 grid gap-2 md:grid-cols-4">
                                <ResultInfo label="Ngày xử lý" value={formatDate(result.posting_date)} />
                                <ResultInfo label="Số lô" value={result.lot_code || "-"} />
                                <ResultInfo label="Dòng cần chuẩn hóa" value={formatNumber(Number(result.candidate_count || 0))} />
                                <ResultInfo label="Dòng đã cập nhật" value={formatNumber(Number(result.changed_count || 0))} />
                                <ResultInfo label="Kỳ costing ảnh hưởng" value={formatNumber(Number(result.affected_cost_period_count || 0))} />
                                {applied ? <ResultInfo label="Kỳ đã đánh dấu tính lại" value={formatNumber(Number(result.changes?.stale_cost_periods || 0))} /> : null}
                            </div>
                            <WarningList errors={result.errors} warnings={result.warnings} />
                            {result.negative_items?.length ? (
                                <div className="mt-3 rounded-md bg-white/70 p-2">
                                    <div className="font-semibold">Âm tồn còn lại</div>
                                    {result.negative_items.slice(0, 5).map((item, index) => (
                                        <div key={index} className="mt-1 text-xs">
                                            {formatDate(item.posting_date)} {formatTime(item.posting_time)} - {item.doc_no || "-"} - tồn sau {formatNumber(Number(item.balance || 0))}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                            Bấm Kiểm tra để xem các dòng cùng ngày/cùng lô sẽ được gán giờ mới. Sau đó có thể chỉnh lại giờ từng dòng theo thứ tự thực tế rồi kiểm tra lại.
                        </div>
                    )}

                    {result?.rows?.length ? (
                        <div className="overflow-hidden rounded-md border">
                            <div className="border-b bg-muted/40 px-3 py-2 text-sm font-semibold">Dòng sẽ chuẩn hóa</div>
                            <div className="max-h-80 overflow-auto">
                                <table className="w-full min-w-[900px] text-sm">
                                    <thead className="bg-muted/30 text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 text-left">ID</th>
                                            <th className="px-3 py-2 text-left">Chứng từ</th>
                                            <th className="px-3 py-2 text-left">Loại</th>
                                            <th className="px-3 py-2 text-left">Mã hàng</th>
                                            <th className="px-3 py-2 text-left">Kho</th>
                                            <th className="px-3 py-2 text-left">SL</th>
                                            <th className="px-3 py-2 text-left">Giờ cũ</th>
                                            <th className="px-3 py-2 text-left">Giờ mới</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {result.rows.map((item) => (
                                            <tr key={item.ledger_id}>
                                                <td className="px-3 py-2 tabular-nums">{item.ledger_id}</td>
                                                <td className="px-3 py-2">{item.doc_no || "-"}</td>
                                                <td className="px-3 py-2">{item.doc_type || "-"}</td>
                                                <td className="px-3 py-2 font-mono">{item.product_code || "-"}</td>
                                                <td className="px-3 py-2">{item.warehouse_code || "-"}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatNumber(Number(item.quantity || 0))}</td>
                                                <td className="px-3 py-2">{item.old_posting_time ? formatTime(item.old_posting_time) : "-"}</td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="time"
                                                        step="1"
                                                        className="h-8 min-w-[130px] font-semibold tabular-nums"
                                                        value={postingTimes[Number(item.ledger_id)] || toTimeInputValue(item.new_posting_time)}
                                                        disabled={working || applied}
                                                        onChange={(event) => {
                                                            setPostingTimes((current) => ({
                                                                ...current,
                                                                [Number(item.ledger_id)]: event.target.value,
                                                            }))
                                                            setDirtyAfterCheck(true)
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {dirtyAfterCheck ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Giờ mới đã được chỉnh. Bấm Kiểm tra lại để hệ thống giả lập âm tồn theo giờ vừa nhập trước khi cập nhật.
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2 border-t pt-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={working}>
                            Đóng
                        </Button>
                        <Button type="button" variant="outline" disabled={working || applied} onClick={() => checkMutation.mutate()}>
                            {checkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kiểm tra
                        </Button>
                        <Button
                            type="button"
                            disabled={working || applied || !canApply}
                            onClick={() => applyMutation.mutate()}
                        >
                            {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Cập nhật giờ
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function PurchasePostingDateTimeChangeResultPanel({
    result,
    timeOnly = false,
}: {
    result: PurchasePostingDateTimeChangeResult
    timeOnly?: boolean
}) {
    const valid = Boolean(result.valid)
    const applied = Boolean(result.applied)
    const changes = result.changes || {}
    const lines = result.lines || []

    return (
        <div className={cn(
            "rounded-md border p-3 text-sm",
            valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800",
        )}>
            <div className="flex items-start gap-2 font-semibold">
                {valid ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
                <span>{applied
                    ? timeOnly ? "Đã đổi giờ chứng từ" : "Đã đổi ngày/giờ chứng từ"
                    : valid
                        ? timeOnly ? "Có thể đổi giờ chứng từ" : "Có thể đổi ngày/giờ chứng từ"
                        : timeOnly ? "Không thể đổi giờ chứng từ" : "Không thể đổi ngày/giờ chứng từ"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-4">
                <ResultInfo label="Thời điểm cũ" value={`${formatDate(result.old_posting_date)} ${formatTime(result.old_posting_time)}`} />
                <ResultInfo label="Thời điểm mới" value={`${formatDate(result.new_posting_date)} ${formatTime(result.new_posting_time)}`} />
                <ResultInfo label="Số dòng chứng từ" value={formatNumber(Number(result.line_count || 0))} />
                <ResultInfo label="Số lô bị ảnh hưởng" value={formatNumber(Number(result.affected_lot_count || 0))} />
                {applied ? <ResultInfo label="Dòng sổ kho đã cập nhật" value={formatNumber(Number(changes.updated_ledger_rows || 0))} /> : null}
                {applied ? <ResultInfo label="Dòng phiếu kho đã cập nhật" value={formatNumber(Number(changes.updated_vouchers || 0))} /> : null}
            </div>

            {result.warnings?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
                    {result.warnings.map((warning, index) => (
                        <div key={index}>- {warning}</div>
                    ))}
                </div>
            ) : null}

            {result.errors?.length ? (
                <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2 text-red-700">
                    {result.errors.map((error, index) => (
                        <div key={index}>- {error}</div>
                    ))}
                </div>
            ) : null}

            <div className="mt-3 overflow-x-auto rounded-md border bg-white/70">
                <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <Th className="w-12 text-center">STT</Th>
                            <Th>Mã hàng</Th>
                            <Th>Tên hàng</Th>
                            <Th>Kho</Th>
                            <Th>Số lô</Th>
                            <Th className="text-right">SL</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line, index) => (
                            <tr key={`${line.ledger_id || index}`} className="border-t">
                                <Td className="text-center font-mono">{index + 1}</Td>
                                <Td className="font-mono text-xs">{line.product_code || "-"}</Td>
                                <Td>{line.product_name || "-"}</Td>
                                <Td>{line.warehouse_name || line.warehouse_code || "-"}</Td>
                                <Td className="font-mono text-xs">{line.lot_no || "-"}</Td>
                                <Td className="text-right tabular-nums">{formatNumber(Number(line.quantity || 0))}</Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!lines.length ? (
                    <div className="text-muted-foreground py-5 text-center text-sm">
                        Không có dòng chi tiết.
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function ResultInfo({ label, value }: { label: string; value?: React.ReactNode }) {
    return (
        <div className="rounded-md border bg-white/80 p-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="font-semibold text-foreground">{value || "-"}</div>
        </div>
    )
}

function WarningList({ errors, warnings }: { errors?: string[]; warnings?: string[] }) {
    if (!errors?.length && !warnings?.length) return null
    return (
        <div className="mt-3 space-y-1 rounded-md bg-white/70 p-2">
            {errors?.map((error, index) => (
                <div key={`error-${index}`}>- {error}</div>
            ))}
            {warnings?.map((warning, index) => (
                <div key={`warning-${index}`}>- {warning}</div>
            ))}
        </div>
    )
}

function VoucherDetailDialog({
    voucherId,
    refreshKey,
    open,
    onOpenChange,
    canUseScopedCorrections,
    canUseFullCorrections,
    canUsePriceCorrections,
    onChangeLot,
    onChangeSalesExportLot,
    onChangeSalesExportWarehouse,
    onChangeTransferWarehouse,
    onChangeReturnWarehouse,
    onChangeInboundWarehouse,
    onChangeLedgerAmount,
    onChangePurchaseQuantity,
    onChangePurchasePostingDateTime,
    onChangePurchaseProduct,
    onChangeSalesReturnProduct,
    onChangeDocumentPostingTime,
    onChangeSalesReturnUnitPrice,
    onDeleteOtherExportLine,
    onDeleteOtherInboundLine,
    onNormalizeLegacyPostingTime,
}: {
    voucherId: number | null
    refreshKey?: number
    open: boolean
    onOpenChange: (open: boolean) => void
    canUseScopedCorrections?: boolean
    canUseFullCorrections?: boolean
    canUsePriceCorrections?: boolean
    onChangeLot?: (row: InventoryLedgerReportRow) => void
    onChangeSalesExportLot?: (row: InventoryLedgerReportRow) => void
    onChangeSalesExportWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeTransferWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeReturnWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeInboundWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeLedgerAmount?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseQuantity?: (row: InventoryLedgerReportRow) => void
    onChangePurchasePostingDateTime?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseProduct?: (row: InventoryLedgerReportRow) => void
    onChangeSalesReturnProduct?: (row: InventoryLedgerReportRow) => void
    onChangeDocumentPostingTime?: (row: InventoryLedgerReportRow) => void
    onChangeSalesReturnUnitPrice?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherExportLine?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherInboundLine?: (row: InventoryLedgerReportRow) => void
    onNormalizeLegacyPostingTime?: (row: InventoryLedgerReportRow) => void
}) {
    const { data: voucher, isLoading } = useQuery({
        queryKey: ["inventory-voucher-detail", voucherId, refreshKey],
        queryFn: () => getVoucherPrintDetail(Number(voucherId)),
        enabled: open && !!voucherId,
    })

    const items = voucher?.items || []
    const voucherTypeCode = String(voucher?.voucher_type_code || voucher?.type?.code || "")
    const isTransfer = voucherTypeCode === "TRANSFER_EXPORT"
    const isInbound = String(voucher?.type?.direction || "").toUpperCase() === "I"
    const detailType = isTransfer ? "chuyển kho" : isInbound ? "nhập" : "xuất"
    const sourceWarehouse = voucher?.from_physical_warehouse || voucher?.from_warehouse || voucher?.physical_warehouse || voucher?.warehouse
    const targetWarehouse = voucher?.to_physical_warehouse || voucher?.to_warehouse
    const headerWarehouseText = formatHeaderWarehouse(voucher?.physical_warehouse || voucher?.warehouse, items)
    const showScopedCorrectionColumn = Boolean((canUseScopedCorrections || canUseFullCorrections || canUsePriceCorrections) && items.some((item: any) => item.ledger_id))
    const voucherLedgerRow = useMemo(() => {
        if (!voucher) return null
        for (const item of items) {
            const ledgerRow = voucherItemToLedgerRow(voucher, item, voucherTypeCode, isInbound, sourceWarehouse)
            if (ledgerRow) return ledgerRow
        }
        return null
    }, [isInbound, items, sourceWarehouse, voucher, voucherTypeCode])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{
                    width: "min(1680px, calc(100vw - 32px))",
                    maxWidth: "calc(100vw - 32px)",
                }}
            >
                <DialogHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <DialogTitle>Chi tiết phiếu {detailType}</DialogTitle>
                            <DialogDescription>
                                {voucher?.voucher_no || (voucherId ? `#${voucherId}` : "")}
                                {voucher?.type?.name ? ` - ${voucher.type.name}` : ""}
                            </DialogDescription>
                        </div>
                        <VoucherHeaderCorrectionActions
                            row={voucherLedgerRow}
                            enabled={canUseScopedCorrections}
                            onChangePurchasePostingDateTime={onChangePurchasePostingDateTime}
                            onChangeDocumentPostingTime={onChangeDocumentPostingTime}
                        />
                    </div>
                </DialogHeader>

                <div className="max-h-[calc(92vh-96px)] overflow-y-auto">
                    {isLoading ? (
                        <div className="text-muted-foreground py-10 text-center text-sm">Đang tải phiếu...</div>
                    ) : voucher ? (
                        <div className="space-y-3">
                            <div className={cn("grid gap-2 rounded-md border bg-muted/20 p-3 text-sm", isTransfer ? "md:grid-cols-4" : "md:grid-cols-3")}>
                                <InfoItem label="Ngày chứng từ" value={formatDate(voucher.posting_date || voucher.document_date)} />
                                {isTransfer ? (
                                    <>
                                        <InfoItem label="Kho xuất" value={formatWarehouse(sourceWarehouse)} />
                                        <InfoItem label="Kho nhập" value={formatWarehouse(targetWarehouse)} />
                                    </>
                                ) : (
                                    <InfoItem label="Địa điểm kho" value={headerWarehouseText} />
                                )}
                                <InfoItem label="Loại phiếu" value={voucher.type?.name || VOUCHER_TYPE_LABEL[voucher.voucher_type_code || ""] || "-"} />
                                <InfoItem label="Diễn giải" value={voucher.description || "-"} className="md:col-span-full" />
                            </div>

                            <div className="overflow-x-auto rounded-md border">
                                <table className={cn("w-full text-sm", isTransfer ? "min-w-[1480px]" : showScopedCorrectionColumn ? "min-w-[1500px]" : "min-w-[1320px]")}>
                                    <thead className="bg-muted/50 text-muted-foreground border-b text-xs">
                                        <tr>
                                            <Th className="w-12 text-center">STT</Th>
                                            <Th className="min-w-[320px]">Sản phẩm</Th>
                                            <Th className="w-20">ĐVT</Th>
                                            <Th className="w-32">Số lô</Th>
                                            <Th className="w-28">HSD</Th>
                                            <Th className="w-28">Số lượng</Th>
                                            {!isTransfer ? <Th className="w-28">Đơn giá</Th> : null}
                                            {!isTransfer ? <Th className="w-32">Thành tiền</Th> : null}
                                            <Th className="w-56">{isTransfer ? "Kho xuất" : "Kho"}</Th>
                                            {isTransfer ? <Th className="w-56">Kho nhận</Th> : null}
                                            <Th className="min-w-[220px]">Ghi chú</Th>
                                            {showScopedCorrectionColumn ? <Th className="w-24 text-center">Thao tác</Th> : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item: any, index) => {
                                            const ledgerRow = voucher
                                                ? voucherItemToLedgerRow(voucher, item, voucherTypeCode, isInbound, sourceWarehouse)
                                                : null
                                            return (
                                                <tr key={item.id || index} className="border-b last:border-b-0">
                                                    <Td className="text-muted-foreground text-center font-mono">{index + 1}</Td>
                                                    <Td>
                                                        <div className="font-semibold">{item.product?.name || `[SP #${item.product_id || ""}]`}</div>
                                                        <div className="text-muted-foreground font-mono text-xs">{item.product?.code || "-"}</div>
                                                    </Td>
                                                    <Td className="text-muted-foreground">{item.unit || item.product?.unit || "-"}</Td>
                                                    <Td className="font-mono text-xs">{item.lot_code || "-"}</Td>
                                                    <Td>{formatDate(item.expiry_date)}</Td>
                                                    <Td className="text-right tabular-nums">{formatNumber(Number(item.quantity || 0))}</Td>
                                                    {!isTransfer ? <Td className="text-right tabular-nums">{formatMoney(item.unit_price)}</Td> : null}
                                                    {!isTransfer ? <Td className="text-right tabular-nums">{formatMoney(item.amount)}</Td> : null}
                                                    <Td>{formatWarehouse(isTransfer ? item.warehouse || sourceWarehouse : item.warehouse)}</Td>
                                                    {isTransfer ? <Td>{formatWarehouse(item.to_warehouse || targetWarehouse)}</Td> : null}
                                                    <Td>
                                                        <LedgerText value={item.note} />
                                                    </Td>
                                                    {showScopedCorrectionColumn ? (
                                                        <Td>
                                                            {ledgerRow ? (
                                                                <ScopedVoucherCorrectionActions
                                                                    row={ledgerRow}
                                                                    onChangeLot={canUseScopedCorrections ? onChangeLot : undefined}
                                                                    onChangeSalesExportLot={canUseScopedCorrections ? onChangeSalesExportLot : undefined}
                                                                    onChangeSalesExportWarehouse={canUseScopedCorrections ? onChangeSalesExportWarehouse : undefined}
                                                                    onChangeTransferWarehouse={canUseScopedCorrections ? onChangeTransferWarehouse : undefined}
                                                                    onChangeReturnWarehouse={canUseScopedCorrections ? onChangeReturnWarehouse : undefined}
                                                                    onChangeInboundWarehouse={canUseScopedCorrections ? onChangeInboundWarehouse : undefined}
                                                                    onChangeLedgerAmount={canUsePriceCorrections ? onChangeLedgerAmount : undefined}
                                                                    onChangePurchaseQuantity={canUseScopedCorrections ? onChangePurchaseQuantity : undefined}
                                                                    onChangePurchaseProduct={canUseScopedCorrections ? onChangePurchaseProduct : undefined}
                                                                    onChangeSalesReturnProduct={canUseFullCorrections ? onChangeSalesReturnProduct : undefined}
                                                                    onChangeSalesReturnUnitPrice={canUsePriceCorrections ? onChangeSalesReturnUnitPrice : undefined}
                                                                     onDeleteOtherExportLine={canUseScopedCorrections ? onDeleteOtherExportLine : undefined}
                                                                     onDeleteOtherInboundLine={canUseScopedCorrections ? onDeleteOtherInboundLine : undefined}
                                                                     onNormalizeLegacyPostingTime={canUseFullCorrections ? onNormalizeLegacyPostingTime : undefined}
                                                                 />
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </Td>
                                                    ) : null}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {!items.length ? (
                                <div className="text-muted-foreground rounded-md border py-8 text-center text-sm">
                                    Phiếu chưa có dòng chi tiết.
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="text-muted-foreground py-10 text-center text-sm">Không tải được chi tiết phiếu.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
function InfoItem({
    label,
    value,
    className,
}: {
    label: string
    value?: string | null
    className?: string
}) {
    return (
        <div className={cn("min-w-0", className)}>
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="break-words font-medium">{value || "-"}</div>
        </div>
    )
}

function VoucherHeaderCorrectionActions({
    row,
    enabled,
    onChangePurchasePostingDateTime,
    onChangeDocumentPostingTime,
}: {
    row: InventoryLedgerReportRow | null
    enabled?: boolean
    onChangePurchasePostingDateTime?: (row: InventoryLedgerReportRow) => void
    onChangeDocumentPostingTime?: (row: InventoryLedgerReportRow) => void
}) {
    const actions: Array<{ label: string; icon: React.ReactNode; onClick: () => void }> = []
    if (row && enabled && isPurchasePostingDateTimeCorrectionLedger(row) && onChangePurchasePostingDateTime) {
        actions.push({
            label: "Đổi ngày/giờ chứng từ",
            icon: <Clock className="h-3.5 w-3.5" />,
            onClick: () => onChangePurchasePostingDateTime(row),
        })
    }
    if (row && enabled && isDocumentPostingTimeCorrectionLedger(row) && onChangeDocumentPostingTime) {
        actions.push({
            label: `${canChangeDocumentPostingDate(row.doc_type) ? "Đổi ngày/giờ" : "Sửa giờ"} ${documentPostingTimeLabel(row.doc_type)}`,
            icon: <Clock className="h-3.5 w-3.5" />,
            onClick: () => onChangeDocumentPostingTime(row),
        })
    }

    if (!actions.length) return null

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="shrink-0">
                    <Pencil className="mr-2 h-4 w-4" />
                    Sửa phiếu
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Thao tác cấp phiếu</div>
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={action.onClick}
                    >
                        {action.icon}
                        <span className="font-medium">{action.label}</span>
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}

function ScopedVoucherCorrectionActions({
    row,
    onChangeLot,
    onChangeSalesExportLot,
    onChangeSalesExportWarehouse,
    onChangeTransferWarehouse,
    onChangeReturnWarehouse,
    onChangeInboundWarehouse,
    onChangeLedgerAmount,
    onChangePurchaseQuantity,
    onChangePurchaseProduct,
    onChangeSalesReturnProduct,
    onChangeSalesReturnUnitPrice,
    onDeleteOtherExportLine,
    onDeleteOtherInboundLine,
    onNormalizeLegacyPostingTime,
}: {
    row: InventoryLedgerReportRow
    onChangeLot?: (row: InventoryLedgerReportRow) => void
    onChangeSalesExportLot?: (row: InventoryLedgerReportRow) => void
    onChangeSalesExportWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeTransferWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeReturnWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeInboundWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangeLedgerAmount?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseQuantity?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseProduct?: (row: InventoryLedgerReportRow) => void
    onChangeSalesReturnProduct?: (row: InventoryLedgerReportRow) => void
    onChangeSalesReturnUnitPrice?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherExportLine?: (row: InventoryLedgerReportRow) => void
    onDeleteOtherInboundLine?: (row: InventoryLedgerReportRow) => void
    onNormalizeLegacyPostingTime?: (row: InventoryLedgerReportRow) => void
}) {
    const actions: Array<{ label: string; icon: React.ReactNode; onClick: () => void; isNew?: boolean; destructive?: boolean }> = []
    const docType = String(row.doc_type || "").toUpperCase()
    if (isPurchaseInboundLedger(row) && onChangeLot) {
        actions.push({ label: "Đổi số lô", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangeLot(row) })
    }
    if (isSalesExportLedger(row) && onChangeSalesExportLot) {
        actions.push({ label: "Đổi số lô xuất", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangeSalesExportLot(row) })
    }
    if (isSalesExportWarehouseCorrectionLedger(row) && onChangeSalesExportWarehouse) {
        actions.push({ label: "Đổi kho xuất bán", icon: <WarehouseIcon className="h-3.5 w-3.5" />, onClick: () => onChangeSalesExportWarehouse(row), isNew: true })
    }
    if (isQuantityCorrectionLedger(row) && onChangePurchaseQuantity) {
        actions.push({ label: "Sửa số lượng", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangePurchaseQuantity(row) })
    }
    if (isPurchaseProductCorrectionLedger(row) && onChangePurchaseProduct) {
        actions.push({ label: "Sửa mã hàng", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangePurchaseProduct(row), isNew: docType === "OTHER_INBOUND" })
    }
    if (isSalesReturnProductCorrectionLedger(row) && onChangeSalesReturnProduct) {
        actions.push({ label: "Sửa mã hàng nhập trả", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangeSalesReturnProduct(row), isNew: true })
    }
    if (isTransferLedger(row) && onChangeTransferWarehouse) {
        actions.push({ label: "Đổi kho chuyển kho", icon: <WarehouseIcon className="h-3.5 w-3.5" />, onClick: () => onChangeTransferWarehouse(row) })
    }
    if (isSalesReturnInboundLedger(row) && onChangeReturnWarehouse) {
        actions.push({ label: "Đổi kho nhập trả", icon: <WarehouseIcon className="h-3.5 w-3.5" />, onClick: () => onChangeReturnWarehouse(row) })
    }
    if (isInboundWarehouseCorrectionLedger(row) && onChangeInboundWarehouse) {
        actions.push({ label: "Đổi kho nhập", icon: <WarehouseIcon className="h-3.5 w-3.5" />, onClick: () => onChangeInboundWarehouse(row), isNew: true })
    }
    if (isLedgerAmountCorrectionLedger(row) && onChangeLedgerAmount) {
        actions.push({ label: "Sửa tổng giá trị", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangeLedgerAmount(row), isNew: true })
    }
    if (isSalesReturnUnitPriceCorrectionLedger(row) && onChangeSalesReturnUnitPrice) {
        actions.push({ label: "Sửa đơn giá nhập trả", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => onChangeSalesReturnUnitPrice(row) })
    }
    if (isOtherExportLineDeleteLedger(row) && onDeleteOtherExportLine) {
        actions.push({ label: "Xóa dòng xuất kho khác", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => onDeleteOtherExportLine(row), destructive: true })
    }
    if (isOtherInboundLineDeleteLedger(row) && onDeleteOtherInboundLine) {
        actions.push({ label: "Xóa dòng nhập kho khác", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => onDeleteOtherInboundLine(row), isNew: true, destructive: true })
    }
    if (row.lot_id && row.posting_date && onNormalizeLegacyPostingTime) {
        actions.push({ label: "Chuẩn hóa giờ dữ liệu cũ", icon: <Clock className="h-3.5 w-3.5" />, onClick: () => onNormalizeLegacyPostingTime(row), isNew: true })
    }

    if (!actions.length) {
        return <span className="text-muted-foreground">-</span>
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Thao tác">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Thao tác</div>
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        className={cn(
                            "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted",
                            action.destructive && "text-destructive hover:bg-destructive/10",
                        )}
                        onClick={action.onClick}
                    >
                        {action.icon}
                        <span className="font-medium">
                            {action.label}
                            {action.isNew ? <NewBadge /> : null}
                        </span>
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    )
}

function voucherItemToLedgerRow(
    voucher: InventoryVoucherPrintDetail,
    item: any,
    voucherTypeCode: string,
    isInbound: boolean,
    fallbackWarehouse: any,
): InventoryLedgerReportRow | null {
    const ledgerId = Number(item.ledger_id || 0)
    if (!ledgerId) return null
    const quantity = Number(item.quantity || 0)
    const warehouse = item.warehouse || fallbackWarehouse || {}
    return {
        id: ledgerId,
        voucher_id: Number(voucher.id || 0) || null,
        voucher_item_id: item.id ? Number(item.id) : null,
        posting_date: String(voucher.posting_date || voucher.document_date || ""),
        posting_time: item.posting_time || voucher.posting_time || null,
        product_id: Number(item.product_id || item.product?.id || 0),
        warehouse_id: Number(item.warehouse_id || warehouse.id || 0),
        doc_type: voucherTypeCode,
        doc_no: String(voucher.voucher_no || ""),
        description: voucher.description || item.note || null,
        unit: item.unit || item.product?.unit || null,
        unit_price: item.unit_price == null ? null : Number(item.unit_price),
        amount: item.amount == null ? null : Number(item.amount),
        lot_id: item.lot_id == null ? null : Number(item.lot_id),
        lot_code: item.lot_code || null,
        quantity_in: isInbound ? quantity : 0,
        quantity_out: isInbound ? 0 : quantity,
        balance_quantity: 0,
        product_code: item.product?.code || "",
        product_name: item.product?.name || "",
        warehouse_code: warehouse.code || null,
        warehouse_name: warehouse.name || "",
    }
}

function VoucherPrintButton({ voucherId }: { voucherId: number }) {
    const mutation = useMutation({
        mutationFn: () => getVoucherPrintDetail(voucherId),
        onSuccess: (voucher) => printInventoryVoucher(voucher),
        onError: (error: any) => toast.error(error?.message || "Không tải được phiếu kho để in"),
    })

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={mutation.isPending}
            title="In phiếu"
            onClick={() => mutation.mutate()}
        >
            <Printer className="h-3.5 w-3.5" />
        </Button>
    )
}

function LedgerText({
    value,
    className,
}: {
    value?: string | null
    className?: string
}) {
    return (
        <span className={cn("block overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-xs leading-4", className)}>
            {value || "-"}
        </span>
    )
}

function printInventoryVoucher(voucher: InventoryVoucherPrintDetail) {
    const items = voucher.items || []
    if (!items.length) {
        toast.info("Phiếu chưa có dòng để in")
        return
    }

    const isInbound = String(voucher.type?.direction || "").toUpperCase() === "I"
    const title = isInbound ? "PHIẾU NHẬP KHO" : "PHIẾU XUẤT KHO"
    const voucherNo = voucher.voucher_no || `#${voucher.id}`
    const voucherTypeCode = String(voucher.voucher_type_code || voucher.type?.code || "")
    const isTransfer = voucherTypeCode === "TRANSFER_EXPORT"
    const showValueColumns = !isTransfer
    const printItems = items
    const totalQuantity = printItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalAmount = printItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const html = `
        <html>
            <head>
                <title>${escapeHtml(title)} ${escapeHtml(voucherNo)}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 12px; color: #111827; }
                    .company { text-align: center; margin-bottom: 6px; }
                    .company-name { font-weight: 700; font-size: 12px; text-transform: uppercase; }
                    .company-address { font-size: 10px; color: #6b7280; }
                    .meta-line { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 4px 8px; border: 1px solid #e5e7eb; font-size: 10.5px; }
                    .title { text-align: center; padding: 10px 0 8px; }
                    .title h1 { margin: 0; font-size: 20px; letter-spacing: .02em; }
                    .date { margin-top: 2px; font-size: 10.5px; color: #6b7280; font-style: italic; }
                    .info { font-size: 11px; line-height: 1.45; margin: 4px 0 8px; }
                    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9.6px; line-height: 1.18; }
                    th, td { border: 1px solid #9ca3af; padding: 3px 4px; vertical-align: top; }
                    th { background: #f3f4f6; text-align: center; font-weight: 700; }
                    td { overflow-wrap: break-word; word-break: normal; }
                    .product-name { font-size: 9.4px; line-height: 1.2; }
                    .warehouse-cell { font-size: 8.8px; line-height: 1.15; }
                    .right { text-align: right; }
                    .center { text-align: center; }
                    .mono { font-family: Consolas, monospace; }
                    .note { padding: 5px 4px; font-size: 10.5px; color: #4b5563; }
                    .sign-date { margin: 10px 24px 16px 0; text-align: right; font-size: 10px; color: #6b7280; font-style: italic; }
                    .signatures { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; text-align: center; font-size: 10.5px; }
                    .sign-role { font-weight: 700; min-height: 18px; }
                    .sign-hint { color: #6b7280; font-size: 9.5px; font-style: italic; }
                    .sign-space { margin-top: 34px; font-weight: 700; }
                    @media print {
                        body { padding: 4px; }
                        table { font-size: 9px; line-height: 1.14; }
                        th, td { padding: 2px 3px; }
                        .product-name { font-size: 8.9px; }
                        .warehouse-cell { font-size: 8.4px; }
                    }
                </style>
            </head>
            <body>
                <div class="company">
                    <div class="company-name">CÔNG TY CỔ PHẦN QUỐC TẾ CUỘC SỐNG VIỆT</div>
                    <div class="company-address">Số 54C1, KP 11, Phường Tân Triều, Tỉnh Đồng Nai, Việt Nam</div>
                </div>
                <div class="meta-line">
                    <div>Số phiếu: <strong class="mono">${escapeHtml(voucherNo)}</strong></div>
                    <div>Loại: <strong>${escapeHtml(voucher.type?.name || VOUCHER_TYPE_LABEL[voucher.voucher_type_code || ""] || voucher.voucher_type_code || "-")}</strong></div>
                </div>
                <div class="title">
                    <h1>${escapeHtml(title)}</h1>
                    <div class="date">${escapeHtml(formatViPrintDate(voucher.posting_date || voucher.document_date))}</div>
                </div>
                <div class="info">
                    <div>- Địa điểm kho ${isInbound ? "nhập" : "xuất"}: <strong>${escapeHtml(formatHeaderWarehouse(voucher.physical_warehouse || voucher.warehouse, printItems))}</strong></div>
                    <div>- Lý do: ${escapeHtml(voucher.description || VOUCHER_TYPE_LABEL[voucher.voucher_type_code || ""] || "")}</div>
                </div>
                <table>
                    <colgroup>
                        <col style="width: ${isTransfer ? "5%" : "5%"}" />
                        <col style="width: ${isTransfer ? "18%" : "14%"}" />
                        <col style="width: ${isTransfer ? "32%" : "27%"}" />
                        <col style="width: ${isTransfer ? "5%" : "6%"}" />
                        <col style="width: ${isTransfer ? "6%" : "8%"}" />
                        <col style="width: ${isTransfer ? "6%" : "9%"}" />
                        <col style="width: ${isTransfer ? "8%" : "9%"}" />
                        ${showValueColumns ? `
                            <col style="width: 8%" />
                            <col style="width: 8%" />
                        ` : ""}
                        <col style="width: ${isTransfer ? "10%" : "6%"}" />
                        ${isTransfer ? `<col style="width: 10%" />` : ""}
                    </colgroup>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Mã hàng</th>
                            <th>Tên sản phẩm, hàng hóa</th>
                            <th>ĐVT</th>
                            <th>Số lô</th>
                            <th>HSD</th>
                            <th>Số lượng</th>
                            ${showValueColumns ? `
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                            ` : ""}
                            <th>${isTransfer ? "Kho xuất" : isInbound ? "Nhập tại kho" : "Xuất tại kho"}</th>
                            ${isTransfer ? "<th>Kho nhận</th>" : ""}
                        </tr>
                    </thead>
                    <tbody>
                        ${printItems.map((item, index) => {
        const sourceWarehouse = item.warehouse || voucher.from_physical_warehouse || voucher.physical_warehouse || voucher.warehouse
        const targetWarehouse = item.to_warehouse || voucher.to_physical_warehouse || voucher.to_warehouse
        return `
                            <tr>
                                <td class="center">${index + 1}</td>
                                <td class="mono">${escapeHtml(item.product?.code || "")}</td>
                                <td class="product-name">${escapeHtml(item.product?.name || `[SP #${item.product_id || ""}]`)}</td>
                                <td class="center">${escapeHtml(item.unit || item.product?.unit || "")}</td>
                                <td class="mono">${escapeHtml(item.lot_code || "")}</td>
                                <td class="center">${escapeHtml(formatDate(item.expiry_date))}</td>
                                <td class="right">${escapeHtml(formatQty(item.quantity))}</td>
                                ${showValueColumns ? `
                                    <td class="right">${escapeHtml(formatMoney(item.unit_price))}</td>
                                    <td class="right">${escapeHtml(formatMoney(item.amount))}</td>
                                ` : ""}
                                <td class="warehouse-cell">${escapeHtml(formatWarehouse(sourceWarehouse))}</td>
                                ${isTransfer ? `<td class="warehouse-cell">${escapeHtml(formatWarehouse(targetWarehouse))}</td>` : ""}
                            </tr>
                        `
    }).join("")}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" class="right"><strong>Cộng</strong></td>
                            <td class="right"><strong>${escapeHtml(formatQty(totalQuantity))}</strong></td>
                            ${showValueColumns ? `
                                <td></td>
                                <td class="right"><strong>${escapeHtml(formatMoney(totalAmount))}</strong></td>
                            ` : ""}
                            <td></td>
                            ${isTransfer ? "<td></td>" : ""}
                        </tr>
                    </tfoot>
                </table>
                <div class="note">- Số chứng từ gốc kèm theo: .......................................</div>
                <div class="sign-date">Ngày ...... tháng ...... năm .........</div>
                <div class="signatures">
                    <div><div class="sign-role">Người lập biểu</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Người giao hàng</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Thủ kho</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Kế toán trưởng</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                    <div><div class="sign-role">Quản lý nhà máy</div><div class="sign-hint">(Ký, họ tên)</div><div class="sign-space">&nbsp;</div></div>
                </div>
            </body>
        </html>
    `

    const win = window.open("", "_blank", "width=1100,height=800")
    if (!win) {
        toast.error("Trình duyệt đang chặn cửa sổ in")
        return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
}

function Quantity({ value, tone }: { value: number; tone: "in" | "out" }) {
    if (!value) return <span className="text-muted-foreground">-</span>

    return (
        <span className={cn("font-semibold tabular-nums", tone === "in" ? "text-emerald-600" : "text-rose-600")}>
            {formatNumber(value)}
        </span>
    )
}

function QuantityValueCells({
    quantity,
    amount,
    quantityTone,
    quantityClassName,
}: {
    quantity: number
    amount: number
    quantityTone?: "in" | "out"
    quantityClassName?: string
}) {
    const hasQuantity = Number(quantity || 0) !== 0
    return (
        <>
            <Td className={cn("text-right tabular-nums", quantityClassName)}>
                {quantityTone ? <Quantity value={quantity} tone={quantityTone} /> : formatNumber(quantity)}
            </Td>
            <Td className={cn("text-right tabular-nums", !hasQuantity && "text-muted-foreground")}>
                {hasQuantity ? formatNumber(amount) : "-"}
            </Td>
        </>
    )
}

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("border-r bg-slate-100 px-2 py-1 text-center font-semibold leading-tight last:border-r-0", className)} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("overflow-hidden text-ellipsis border-r px-3 py-1.5 align-middle last:border-r-0", className)} {...props} />
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) => permission.module === module && permission.action === action)
}

function salesExportWarehouseLotKey(lot: SalesExportWarehouseAvailableLot) {
    const id = lot?.lot_id ?? lot?.id
    const lotNo = lot?.lot_no ?? lot?.lot_code
    return id != null ? `id:${id}` : `code:${lotNo || ""}`
}

function buildSalesExportWarehouseLotAllocations(
    lots: SalesExportWarehouseAvailableLot[],
    quantities: Record<string, string>
): SalesExportWarehouseLotAllocation[] {
    return lots
        .map((lot) => ({
            lot_id: lot.lot_id ?? lot.id,
            lot_code: lot.lot_no ?? lot.lot_code,
            quantity: Number(quantities[salesExportWarehouseLotKey(lot)] || 0),
        }))
        .filter((allocation) => allocation.quantity > 0)
}

function autoAllocateSalesExportWarehouseLots(
    lots: SalesExportWarehouseAvailableLot[],
    requiredQuantity: number
) {
    let remainingUnits = toThousandUnits(requiredQuantity)
    const next: Record<string, string> = {}
    const candidates = lots
        .map((lot) => ({
            key: salesExportWarehouseLotKey(lot),
            availableUnits: Math.max(toThousandUnits(Number(lot.history_safe_quantity ?? lot.available_quantity ?? 0)), 0),
            quantityUnits: 0,
        }))
        .filter((row) => row.key && row.availableUnits > 0)

    let active = candidates
    while (remainingUnits > 0 && active.length > 0) {
        const shareUnits = Math.floor(remainingUnits / active.length)
        let extraUnits = remainingUnits % active.length
        const nextActive: typeof candidates = []
        let usedUnits = 0
        for (const row of active) {
            const roomUnits = row.availableUnits - row.quantityUnits
            const desiredUnits = shareUnits + (extraUnits > 0 ? 1 : 0)
            if (extraUnits > 0) extraUnits -= 1
            const takeUnits = Math.min(roomUnits, desiredUnits)
            if (takeUnits > 0) {
                row.quantityUnits += takeUnits
                usedUnits += takeUnits
            }
            if (row.availableUnits - row.quantityUnits > 0) nextActive.push(row)
        }
        if (usedUnits <= 0) break
        remainingUnits -= usedUnits
        active = nextActive
    }

    for (const row of candidates) {
        if (row.quantityUnits > 0) next[row.key] = formatThousandUnits(row.quantityUnits)
    }
    return next
}

function sameDecimal(a: number, b: number) {
    return Math.abs(Number(a || 0) - Number(b || 0)) < 0.000001
}

function roundDecimal(value: number) {
    return Math.round(Number(value || 0) * 1000) / 1000
}

function toThousandUnits(value: number) {
    return Math.round(Number(value || 0) * 1000)
}

function formatThousandUnits(units: number) {
    return (units / 1000).toFixed(3).replace(/\.?0+$/, "")
}

function isPurchaseInboundLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    return ["IMPORT_PURCHASE", "DOMESTIC_PURCHASE", "OTHER_INBOUND", "PURCHASE"].includes(docType)
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.lot_code)
}

function isSalesReturnInboundLedger(item: InventoryLedgerReportRow) {
    return String(item.doc_type || "").toUpperCase() === "SALES_RETURN"
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
        && Boolean(item.lot_code)
}

function isSalesReturnUnitPriceCorrectionLedger(item: InventoryLedgerReportRow) {
    return String(item.doc_type || "").toUpperCase() === "SALES_RETURN"
        && Number(item.quantity_in || 0) > 0
}

function isSalesExportLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    return ["SALES_EXPORT", "EXPORT", "OTHER_EXPORT"].includes(docType)
        && Number(item.quantity_out || 0) > 0
        && Boolean(item.lot_code)
}

function isSalesExportWarehouseCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    return ["SALES_EXPORT", "EXPORT"].includes(docType)
        && Number(item.quantity_out || 0) > 0
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
}

function isTransferLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    const hasTransferQuantity = Number(item.quantity_out || 0) > 0 || Number(item.quantity_in || 0) > 0
    return ["TRANSFER_EXPORT", "TRANSFER_INBOUND"].includes(docType)
        && hasTransferQuantity
        && Boolean(item.lot_code)
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
}

function isQuantityCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    if (["IMPORT_PURCHASE", "DOMESTIC_PURCHASE", "OTHER_INBOUND"].includes(docType)) {
        return Number(item.quantity_in || 0) > 0 && Boolean(item.lot_code)
    }
    if (docType === "OTHER_EXPORT") {
        return Number(item.quantity_out || 0) > 0 && Boolean(item.lot_code)
    }
    return false
}

function isOtherExportLineDeleteLedger(item: InventoryLedgerReportRow) {
    return String(item.doc_type || "").toUpperCase() === "OTHER_EXPORT"
        && Number(item.quantity_out || 0) > 0
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
        && Boolean(item.lot_code)
}

function isOtherInboundLineDeleteLedger(item: InventoryLedgerReportRow) {
    return String(item.doc_type || "").toUpperCase() === "OTHER_INBOUND"
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
        && Boolean(item.lot_code)
}

function isInboundWarehouseCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    return ["IMPORT_PURCHASE", "DOMESTIC_PURCHASE", "OTHER_INBOUND"].includes(docType)
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
        && Boolean(item.lot_code)
}

function isLedgerAmountCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    if (["IMPORT_PURCHASE", "DOMESTIC_PURCHASE", "OTHER_INBOUND"].includes(docType)) {
        return Number(item.quantity_in || 0) > 0 && Boolean(item.lot_code)
    }
    if (docType === "OTHER_EXPORT") {
        return Number(item.quantity_out || 0) > 0 && Boolean(item.lot_code)
    }
    return false
}

function isPurchasePostingDateTimeCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    return ["IMPORT_PURCHASE", "DOMESTIC_PURCHASE"].includes(docType)
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.lot_code)
}

function isPurchaseProductCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    return ["IMPORT_PURCHASE", "DOMESTIC_PURCHASE", "OTHER_INBOUND"].includes(docType)
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.lot_code)
        && Boolean(item.voucher_item_id)
}

function isSalesReturnProductCorrectionLedger(item: InventoryLedgerReportRow) {
    return String(item.doc_type || "").toUpperCase() === "SALES_RETURN"
        && Number(item.quantity_in || 0) > 0
        && Boolean(item.lot_code)
        && Boolean(item.voucher_id)
        && Boolean(item.voucher_item_id)
}

function isDocumentPostingTimeCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    if (docType === "OTHER_INBOUND") return Number(item.quantity_in || 0) > 0
    if (docType === "OTHER_EXPORT") return Number(item.quantity_out || 0) > 0
    if (docType === "SALES_EXPORT") return Number(item.quantity_out || 0) > 0
    if (docType === "SALES_RETURN") return Number(item.quantity_in || 0) > 0
    if (docType === "PRODUCTION") return Number(item.quantity_in || 0) > 0
    return false
}

function canChangeDocumentPostingDate(docType?: string | null) {
    return ["SALES_EXPORT", "SALES_RETURN"].includes(String(docType || "").toUpperCase())
}

function documentPostingTimeLabel(docType?: string | null) {
    switch (String(docType || "").toUpperCase()) {
        case "OTHER_INBOUND":
            return "phiếu nhập khác"
        case "OTHER_EXPORT":
            return "phiếu xuất kho khác"
        case "SALES_EXPORT":
            return "phiếu xuất bán hàng"
        case "SALES_RETURN":
            return "phiếu nhập hàng bán trả lại"
        case "PRODUCTION":
            return "phiếu nhập thành phẩm sản xuất"
        default:
            return "chứng từ kho"
    }
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const datePart = value.split("T")[0]
    const [year, month, day] = datePart.split("-")
    if (year && month && day) {
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }
    return datePart
}

function formatTime(value?: string | null) {
    if (!value) return "-"
    return String(value).trim().split(".")[0]
}

function parseDecimalInput(value: string) {
    const normalized = String(value || "").trim().replace(/,/g, "")
    if (!normalized) return Number.NaN
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : Number.NaN
}

function toDateInputValue(value?: string | null) {
    if (!value) return ""
    return String(value).split("T")[0]
}

function toTimeInputValue(value?: string | null) {
    if (!value) return currentTimeInputValue()
    return String(value).trim().split(".")[0].slice(0, 8)
}

function normalizeTimeForApi(value?: string | null) {
    const raw = String(value || "").trim()
    if (!raw) return "00:00:00"
    const parts = raw.split(":")
    const hour = parts[0]?.padStart(2, "0") || "00"
    const minute = parts[1]?.padStart(2, "0") || "00"
    const second = parts[2]?.padStart(2, "0") || "00"
    return `${hour}:${minute}:${second}`
}

function currentTimeInputValue() {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
}

function currentLocalDateInputValue() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function textFilterDescription(label: string, op: string | undefined, value: string) {
    return `${label} ${textOpLabel(op)} "${value}"`
}

function textOpLabel(op?: string) {
    return TEXT_FILTER_OPERATORS.find((item) => item.value === normalizeTextOp(op))?.label.toLowerCase() || "chứa"
}

function normalizeTextOp(op?: string): TextFilterOp {
    return TEXT_FILTER_OPERATORS.some((item) => item.value === op) ? (op as TextFilterOp) : "contains"
}

function normalizeSearchText(value?: string | null) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()
}

function normalizeStaticValue(value?: string | null) {
    return String(value || "").trim()
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatViPrintDate(dateStr?: string): string {
    if (!dateStr) return "Ngày ...... tháng ...... năm ........."
    const [year, month, day] = dateStr.split("T")[0].split("-")
    if (year && month && day) {
        return `Ngày ${day} tháng ${month} năm ${year}`
    }
    return dateStr
}

function formatWarehouse(warehouse?: { code?: string; name?: string } | null) {
    if (!warehouse) return "-"
    return warehouse.name || warehouse.code || "-"
}

function formatHeaderWarehouse(
    warehouse?: { code?: string; name?: string } | null,
    items?: Array<{ warehouse?: { code?: string; name?: string } | null }>,
) {
    const headerValue = formatWarehouse(warehouse)
    if (headerValue !== "-") return headerValue

    const itemWarehouses = Array.from(new Set(
        (items || [])
            .map((item) => formatWarehouse(item.warehouse))
            .filter((value) => value && value !== "-"),
    ))
    if (itemWarehouses.length === 0) return "-"
    if (itemWarehouses.length === 1) return itemWarehouses[0]
    return `Nhiều kho: ${itemWarehouses.slice(0, 3).join(", ")}${itemWarehouses.length > 3 ? "..." : ""}`
}

function formatQty(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return ""
    const n = Number(value)
    if (Number.isNaN(n)) return String(value)
    return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 3,
    }).format(n)
}

function formatMoney(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return ""
    const n = Number(value)
    if (Number.isNaN(n)) return String(value)
    return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 3,
    }).format(n)
}

function CostPeriodIcon({ label, docType }: { label?: string | null; docType?: string | null }) {
    const isOpening = String(docType || "").toUpperCase() === "OPENING"
    const hasPeriod = Boolean(label && label.trim())
    const isOk = hasPeriod || isOpening
    const title = hasPeriod
        ? `Đã lấy từ kỳ tính giá: ${label}`
        : isOpening
            ? "Đơn giá khai báo đầu kỳ"
            : "Chưa có kỳ tính giá"

    return (
        <span
            className={cn(
                "inline-flex size-4 shrink-0 items-center justify-center rounded-full border",
                isOk
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
            )}
            title={title}
            aria-label={title}
        >
            {isOk ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
        </span>
    )
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
