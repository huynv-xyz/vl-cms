import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { AlertTriangle, CheckCircle2, Funnel, Loader2, MoreHorizontal, Pencil, Printer, Warehouse as WarehouseIcon, X } from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import {
    applyPurchaseLotChange,
    applyPurchaseQuantityChange,
    applyReturnWarehouseChange,
    checkPurchaseLotChange,
    checkPurchaseQuantityChange,
    checkReturnWarehouseChange,
    type PurchaseLotChangeResult,
    type PurchaseQuantityChangeResult,
    type ReturnWarehouseChangeResult,
} from "@/api/inventory/ledger"
import { getVoucherPrintDetail, listVoucherTypes, VOUCHER_TYPE_LABEL, type InventoryVoucherPrintDetail } from "@/api/inventory/voucher"
import { listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
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
import { cn, formatNumber } from "@/lib/utils"
import type { InventoryLedgerReportRow } from "../data/schema"
import { getDocTypeMeta } from "../data/schema"
import type { Warehouse } from "@/features/warehouse/data/schema"

type TextFilterOp = "contains" | "equals" | "not_equals" | "not_contains"

type Props = {
    data: InventoryLedgerReportRow[]
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

const UNIT_OPTIONS = ["Kg", "Lít", "Bao", "Cái", "Thùng", "Mét"]

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

export function InventoryLedgerTable({
    data,
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
    const [detailVoucherId, setDetailVoucherId] = useState<number | null>(null)
    const [lotChangeRow, setLotChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [returnWarehouseChangeRow, setReturnWarehouseChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const [purchaseQuantityChangeRow, setPurchaseQuantityChangeRow] = useState<InventoryLedgerReportRow | null>(null)
    const queryClient = useQueryClient()
    const { data: inboundDocTypes = [] } = useQuery({
        queryKey: ["inventory-voucher-types", "I"],
        queryFn: () => listVoucherTypes("I"),
    })
    const { data: outboundDocTypes = [] } = useQuery({
        queryKey: ["inventory-voucher-types", "O"],
        queryFn: () => listVoucherTypes("O"),
    })
    const inboundDocValues = useMemo(() => new Set(inboundDocTypes.map((type) => type.code)), [inboundDocTypes])
    const outboundDocValues = useMemo(() => new Set(outboundDocTypes.map((type) => type.code)), [outboundDocTypes])
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUseLedgerCorrections = useMemo(
        () => hasPermission(permissions, "inventory.ledgers", "correction.change"),
        [permissions],
    )

    const setFilter = (key: keyof Props["filters"], value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value || undefined,
        })
    }

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

    const inboundValue =
        filters.doc_type && inboundDocValues.has(filters.doc_type as any)
            ? filters.doc_type
            : "ALL"
    const outboundValue =
        filters.doc_type && outboundDocValues.has(filters.doc_type as any)
            ? filters.doc_type
            : "ALL"

    const activeFilterChips = [
        keyword
            ? { key: "keyword", label: `Tìm kiếm "${keyword}"`, onClear: () => onKeywordChange("") }
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
                label: `ĐVT: ${filterValueLabels(filters.unit, UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit })))}`,
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
    ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>

    const clearAllActiveFilters = () => {
        onKeywordChange("")
        onFiltersChange({
            ...filters,
            warehouse_id: undefined,
            warehouse_ids: undefined,
            product_ids: undefined,
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

                    {direction !== "OUT" ? (
                        <Select
                            value={inboundValue}
                            onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[180px] flex-[0.9_1_210px] xl:max-w-[260px]")}>
                                <SelectValue placeholder="Chứng từ nhập" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ nhập</SelectItem>
                                {inboundDocTypes.map((type) => (
                                    <SelectItem key={type.code} value={type.code}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : null}

                    {direction !== "IN" ? (
                        <Select
                            value={outboundValue}
                            onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                        >
                            <SelectTrigger className={cn(controlClass, "min-w-[180px] flex-[0.9_1_210px] xl:max-w-[260px]")}>
                                <SelectValue placeholder="Chứng từ xuất" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả chứng từ xuất</SelectItem>
                                {outboundDocTypes.map((type) => (
                                    <SelectItem key={type.code} value={type.code}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : null}

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
                        ? [64, 110, 180, 260, 80, 80, 150, 320, 80, 150, 160, 220, 120, 120, 110, 110, 120, 140, 260, 260, 100]
                        : [64, 110, 180, 260, 80, 80, 150, 320, 80, 150, 160, 220, 120, 110, 110, 120, 260, 260, 100]}
                    defaultPinnedUntil={7}
                    renderHeader={() => (
                        <>
                            <tr>
                                <Th className="min-w-[56px] text-center">STT</Th>
                                <Th className="min-w-[110px]">Ngày</Th>
                                <Th className="min-w-[170px]">
                                    <ColumnTextFilter
                                        label="Chứng từ"
                                        value={filters.doc_text}
                                        op={filters.doc_text_op}
                                        onApply={(value, op) => setTextFilter("doc_text", "doc_text_op", value, op)}
                                        onClear={() => clearTextFilter("doc_text", "doc_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[260px]">
                                    <ColumnTextFilter
                                        label="Diễn giải"
                                        value={filters.description_text}
                                        op={filters.description_text_op}
                                        onApply={(value, op) => setTextFilter("description_text", "description_text_op", value, op)}
                                        onClear={() => clearTextFilter("description_text", "description_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[70px]">TK Nợ</Th>
                                <Th className="min-w-[70px]">TK Có</Th>
                                <Th className="min-w-[150px]">
                                    <ColumnTextFilter
                                        label="Mã hàng"
                                        value={filters.product_code_text}
                                        op={filters.product_code_text_op}
                                        onApply={(value, op) => setTextFilter("product_code_text", "product_code_text_op", value, op)}
                                        onClear={() => clearTextFilter("product_code_text", "product_code_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[300px]">
                                    <ColumnTextFilter
                                        label="Tên hàng"
                                        value={filters.product_name_text}
                                        op={filters.product_name_text_op}
                                        onApply={(value, op) => setTextFilter("product_name_text", "product_name_text_op", value, op)}
                                        onClear={() => clearTextFilter("product_name_text", "product_name_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[80px]">
                                    <ColumnMultiSelectFilter
                                        label="ĐVT"
                                        value={filters.unit}
                                        options={UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit }))}
                                        onApply={(value) => setFilter("unit", value)}
                                    />
                                </Th>
                                <Th className="min-w-[140px]">
                                    <ColumnTextFilter
                                        label="Số lô"
                                        value={filters.lot_text}
                                        op={filters.lot_text_op}
                                        onApply={(value, op) => setTextFilter("lot_text", "lot_text_op", value, op)}
                                        onClear={() => clearTextFilter("lot_text", "lot_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[160px]">
                                    <ColumnTextFilter
                                        label="Mã kho"
                                        value={filters.warehouse_code_text}
                                        op={filters.warehouse_code_text_op}
                                        onApply={(value, op) => setTextFilter("warehouse_code_text", "warehouse_code_text_op", value, op)}
                                        onClear={() => clearTextFilter("warehouse_code_text", "warehouse_code_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[220px]">
                                    <ColumnTextFilter
                                        label="Tên kho"
                                        value={filters.warehouse_name_text}
                                        op={filters.warehouse_name_text_op}
                                        onApply={(value, op) => setTextFilter("warehouse_name_text", "warehouse_name_text_op", value, op)}
                                        onClear={() => clearTextFilter("warehouse_name_text", "warehouse_name_text_op")}
                                    />
                                </Th>
                                {showValues ? <Th className="min-w-[120px]">{"\u0110\u01a1n gi\u00e1"}</Th> : null}
                                <Th className="min-w-[120px]">Tồn đầu</Th>
                                <Th className="min-w-[110px]">Nhập</Th>
                                <Th className="min-w-[110px]">Xuất</Th>
                                <Th className="min-w-[120px]">Tồn sau</Th>
                                {showValues ? <Th className="min-w-[140px]">{"Th\u00e0nh ti\u1ec1n"}</Th> : null}
                                <Th className="min-w-[260px]">Loại</Th>
                                <Th className="min-w-[260px]">
                                    <ColumnTextFilter
                                        label="Tên nhà cung cấp"
                                        value={filters.supplier_text}
                                        op={filters.supplier_text_op}
                                        onApply={(value, op) => setTextFilter("supplier_text", "supplier_text_op", value, op)}
                                        onClear={() => clearTextFilter("supplier_text", "supplier_text_op")}
                                    />
                                </Th>
                                <Th className="min-w-[100px] text-center">Thao tác</Th>
                            </tr>
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
                                    onChangeLot={canUseLedgerCorrections ? setLotChangeRow : undefined}
                                    onChangeReturnWarehouse={canUseLedgerCorrections ? setReturnWarehouseChangeRow : undefined}
                                    onChangePurchaseQuantity={canUseLedgerCorrections ? setPurchaseQuantityChangeRow : undefined}
                                    showValues={showValues}
                                    direction={direction}
                                />
                            ))}
                        </>
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
                open={!!detailVoucherId}
                onOpenChange={(open) => {
                    if (!open) setDetailVoucherId(null)
                }}
            />
            <PurchaseLotChangeDialog
                row={lotChangeRow}
                open={!!lotChangeRow}
                onOpenChange={(open) => {
                    if (!open) setLotChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
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
                }}
            />
            <PurchaseQuantityChangeDialog
                row={purchaseQuantityChangeRow}
                open={!!purchaseQuantityChangeRow}
                onOpenChange={(open) => {
                    if (!open) setPurchaseQuantityChangeRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
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

function LedgerRow({
    index,
    item,
    onOpenVoucher,
    onChangeLot,
    onChangeReturnWarehouse,
    onChangePurchaseQuantity,
    showValues,
    direction,
}: {
    index: number
    item: InventoryLedgerReportRow
    onOpenVoucher: (voucherId: number) => void
    onChangeLot?: (row: InventoryLedgerReportRow) => void
    onChangeReturnWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseQuantity?: (row: InventoryLedgerReportRow) => void
    showValues: boolean
    direction?: "IN" | "OUT"
}) {
    const meta = getDocTypeMeta(item.doc_type)
    const quantityIn = Number(item.quantity_in || 0)
    const quantityOut = Number(item.quantity_out || 0)
    const openingBalance = Number(item.balance_quantity || 0) - quantityIn + quantityOut
    const centerVoucherFields = Boolean(direction)

    return (
        <tr className="hover:bg-muted/30 border-b">
            <Td className="text-muted-foreground text-center font-mono">{formatNumber(index)}</Td>
            <Td className="whitespace-nowrap text-center tabular-nums">
                {formatDate(item.posting_date)}
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
                <Td className="text-right tabular-nums">
                    {formatNumber(Number(item.unit_price || 0))}
                </Td>
            ) : null}
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
                {formatNumber(Number(item.balance_quantity || 0))}
            </Td>
            {showValues ? (
                <Td className="text-right tabular-nums">
                    {formatNumber(Number(item.amount || 0))}
                </Td>
            ) : null}
            <Td className="text-center">
                <LedgerText value={meta.label} className="text-center" />
            </Td>
            <Td>
                <LedgerText value={item.supplier_name} />
            </Td>
            <Td className="text-center">
                <LedgerCorrectionActions
                    item={item}
                    onChangeLot={onChangeLot}
                    onChangeReturnWarehouse={onChangeReturnWarehouse}
                    onChangePurchaseQuantity={onChangePurchaseQuantity}
                />
            </Td>
        </tr>
    )
}

function LedgerCorrectionActions({
    item,
    onChangeLot,
    onChangeReturnWarehouse,
    onChangePurchaseQuantity,
}: {
    item: InventoryLedgerReportRow
    onChangeLot?: (row: InventoryLedgerReportRow) => void
    onChangeReturnWarehouse?: (row: InventoryLedgerReportRow) => void
    onChangePurchaseQuantity?: (row: InventoryLedgerReportRow) => void
}) {
    const canChangeLot = Boolean(onChangeLot && isPurchaseInboundLedger(item))
    const canChangeReturnWarehouse = Boolean(onChangeReturnWarehouse && isSalesReturnInboundLedger(item))
    const canChangePurchaseQuantity = Boolean(onChangePurchaseQuantity && isQuantityCorrectionLedger(item))

    if (!canChangeLot && !canChangeReturnWarehouse && !canChangePurchaseQuantity) {
        return <span className="text-muted-foreground">-</span>
    }

    // These are narrow correction flows for audited mistakes. Do not turn this menu into generic ledger editing:
    // each action must own its validation, simulation and rollback path.
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Thao tác sửa sai">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Thao tác sửa sai</div>
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
                {canChangePurchaseQuantity ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onChangePurchaseQuantity?.(item)}
                    >
                        <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Sửa số lượng</span>
                            <span className="block text-xs text-muted-foreground">Áp dụng cho mua hàng nhập khẩu, nhập kho khác hoặc xuất kho khác.</span>
                        </span>
                    </button>
                ) : null}
                {canChangeReturnWarehouse ? (
                    <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => onChangeReturnWarehouse?.(item)}
                    >
                        <WarehouseIcon className="mt-0.5 h-4 w-4 text-primary" />
                        <span>
                            <span className="block font-medium">Đổi kho nhập trả hàng</span>
                            <span className="block text-xs text-muted-foreground">Áp dụng cho dòng nhập kho từ hàng bán trả lại.</span>
                        </span>
                    </button>
                ) : null}
            </PopoverContent>
        </Popover>
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
    const [warehouseSearch, setWarehouseSearch] = useState("")
    const [warehouseSelectOpen, setWarehouseSelectOpen] = useState(false)
    const [result, setResult] = useState<ReturnWarehouseChangeResult | null>(null)
    const [errorMessage, setErrorMessage] = useState("")
    const warehouseSearchInputRef = useRef<HTMLInputElement | null>(null)

    const { data: warehousePage } = useQuery({
        queryKey: ["warehouses", "return-warehouse-change"],
        queryFn: () => listWarehouses({ page: 1, size: 1000, status: "ACTIVE" }),
        enabled: open,
    })
    const warehouses = (warehousePage?.items || []) as Warehouse[]

    useEffect(() => {
        if (open && row) {
            setNewWarehouseId("")
            setWarehouseSearch("")
            setWarehouseSelectOpen(false)
            setResult(null)
            setErrorMessage("")
        }
    }, [open, row])

    useEffect(() => {
        if (!warehouseSelectOpen) return
        const timer = window.setTimeout(() => warehouseSearchInputRef.current?.focus(), 0)
        return () => window.clearTimeout(timer)
    }, [warehouseSelectOpen])

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

    const selectedWarehouse = warehouses.find((warehouse) => String(warehouse.id) === newWarehouseId)
    const filteredWarehouses = useMemo(() => {
        const keyword = normalizeSearchText(warehouseSearch)
        if (!keyword) return warehouses
        return warehouses.filter((warehouse) =>
            normalizeSearchText([
                warehouse.code,
                warehouse.name,
                warehouse.physical_warehouse?.code,
                warehouse.physical_warehouse?.name,
            ].filter(Boolean).join(" ")).includes(keyword),
        )
    }, [warehouseSearch, warehouses])
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
                            <Select
                                value={newWarehouseId}
                                open={warehouseSelectOpen}
                                onOpenChange={setWarehouseSelectOpen}
                                onValueChange={(value) => {
                                    setNewWarehouseId(value)
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
                                            ref={warehouseSearchInputRef}
                                            value={warehouseSearch}
                                            onChange={(event) => setWarehouseSearch(event.target.value)}
                                            onKeyDown={(event) => event.stopPropagation()}
                                            placeholder="Tìm kho nhập mới"
                                            className="h-9"
                                        />
                                    </div>
                                    {filteredWarehouses.length ? filteredWarehouses.map((warehouse) => (
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
                                    Kho mới: {selectedWarehouse.name || selectedWarehouse.code}
                                </div>
                            ) : null}
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
                <ResultInfo label="Số dòng trong phiếu nhập" value={formatNumber(Number(result.voucher_item_count || 0))} />
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

function PurchaseQuantityChangeDialog({
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
                            <InfoItem label="Đơn giá hiện tại" value={formatNumber(Number(row.unit_price || 0))} />
                            <InfoItem label="Thành tiền hiện tại" value={formatNumber(Number(row.amount || 0))} />
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

                        {result ? <PurchaseQuantityChangeResultPanel result={result} /> : null}
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

function PurchaseQuantityChangeResultPanel({ result }: { result: PurchaseQuantityChangeResult }) {
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
                <span>{applied ? "Đã sửa số lượng" : valid ? "Có thể sửa số lượng" : "Không thể sửa số lượng"}</span>
            </div>
            <div className="mt-1 pl-6">{result.message}</div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
                <ResultInfo label="Số lượng hiện tại" value={formatNumber(Number(result.old_quantity || 0))} />
                <ResultInfo label="Số lượng mới" value={formatNumber(Number(result.new_quantity || 0))} />
                <ResultInfo label="Chênh lệch SL" value={formatNumber(Number(result.delta_quantity || 0))} />
                <ResultInfo label="Đơn giá" value={formatNumber(Number(result.unit_price || 0))} />
                <ResultInfo label="Thành tiền hiện tại" value={formatNumber(Number(result.old_amount || 0))} />
                <ResultInfo label="Thành tiền mới" value={formatNumber(Number(result.new_amount || 0))} />
                <ResultInfo label="Chênh lệch tiền" value={formatNumber(Number(result.delta_amount || 0))} />
                {applied ? <ResultInfo label="Dòng sổ kho đã cập nhật" value={formatNumber(Number(changes.updated_ledger_rows || 0))} /> : null}
                {applied ? <ResultInfo label="Dòng phiếu kho đã cập nhật" value={formatNumber(Number(changes.updated_voucher_items || 0))} /> : null}
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

function ResultInfo({ label, value }: { label: string; value?: React.ReactNode }) {
    return (
        <div className="rounded-md border bg-white/80 p-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="font-semibold text-foreground">{value || "-"}</div>
        </div>
    )
}

function VoucherDetailDialog({
    voucherId,
    open,
    onOpenChange,
}: {
    voucherId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const { data: voucher, isLoading } = useQuery({
        queryKey: ["inventory-voucher-detail", voucherId],
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
                    <DialogTitle>Chi tiết phiếu {detailType}</DialogTitle>
                    <DialogDescription>
                        {voucher?.voucher_no || (voucherId ? `#${voucherId}` : "")}
                        {voucher?.type?.name ? ` - ${voucher.type.name}` : ""}
                    </DialogDescription>
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
                                <table className="w-full min-w-[1320px] text-sm">
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
                                            <Th className="min-w-[220px]">Ghi chú</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
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
                                                <Td>
                                                    <LedgerText value={item.note} />
                                                </Td>
                                            </tr>
                                        ))}
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
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    const html = `
        <html>
            <head>
                <title>${escapeHtml(title)} ${escapeHtml(voucherNo)}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 18px; color: #111827; }
                    .company { text-align: center; margin-bottom: 8px; }
                    .company-name { font-weight: 700; font-size: 13px; text-transform: uppercase; }
                    .company-address { font-size: 11px; color: #6b7280; }
                    .meta-line { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; padding: 6px 10px; border: 1px solid #e5e7eb; font-size: 12px; }
                    .title { text-align: center; padding: 14px 0 10px; }
                    .title h1 { margin: 0; font-size: 22px; letter-spacing: .02em; }
                    .date { margin-top: 3px; font-size: 12px; color: #6b7280; font-style: italic; }
                    .info { font-size: 13px; line-height: 1.6; margin: 6px 0 10px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #9ca3af; padding: 5px 6px; vertical-align: top; }
                    th { background: #f3f4f6; text-align: center; font-weight: 700; }
                    .right { text-align: right; }
                    .center { text-align: center; }
                    .mono { font-family: Consolas, monospace; }
                    .note { padding: 7px 4px; font-size: 12px; color: #4b5563; }
                    .sign-date { margin: 12px 28px 20px 0; text-align: right; font-size: 11px; color: #6b7280; font-style: italic; }
                    .signatures { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; font-size: 12px; }
                    .sign-role { font-weight: 700; min-height: 18px; }
                    .sign-hint { color: #6b7280; font-size: 11px; font-style: italic; }
                    .sign-space { margin-top: 44px; font-weight: 700; }
                    @media print {
                        body { padding: 8px; }
                        table { font-size: 10px; line-height: 1.2; }
                        th, td { padding: 3px 5px; }
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
                    <div>- Địa điểm kho ${isInbound ? "nhập" : "xuất"}: <strong>${escapeHtml(formatHeaderWarehouse(voucher.physical_warehouse || voucher.warehouse, items))}</strong></div>
                    <div>- Lý do: ${escapeHtml(voucher.description || VOUCHER_TYPE_LABEL[voucher.voucher_type_code || ""] || "")}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 38px">STT</th>
                            <th style="width: 90px">Mã hàng</th>
                            <th>Tên sản phẩm, hàng hóa</th>
                            <th style="width: 50px">ĐVT</th>
                            <th style="width: 90px">Số lô</th>
                            <th style="width: 85px">HSD</th>
                            <th style="width: 80px">Số lượng</th>
                            <th style="width: 90px">Đơn giá</th>
                            <th style="width: 100px">Thành tiền</th>
                            <th style="width: 130px">${isInbound ? "Nhập tại kho" : "Xuất tại kho"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((item, index) => `
                            <tr>
                                <td class="center">${index + 1}</td>
                                <td class="mono">${escapeHtml(item.product?.code || "")}</td>
                                <td>${escapeHtml(item.product?.name || `[SP #${item.product_id || ""}]`)}</td>
                                <td class="center">${escapeHtml(item.unit || item.product?.unit || "")}</td>
                                <td class="mono">${escapeHtml(item.lot_code || "")}</td>
                                <td class="center">${escapeHtml(formatDate(item.expiry_date))}</td>
                                <td class="right">${escapeHtml(formatQty(item.quantity))}</td>
                                <td class="right">${escapeHtml(formatMoney(item.unit_price))}</td>
                                <td class="right">${escapeHtml(formatMoney(item.amount))}</td>
                                <td>${escapeHtml(formatWarehouse(item.warehouse))}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="6" class="right"><strong>Cộng</strong></td>
                            <td class="right"><strong>${escapeHtml(formatQty(totalQuantity))}</strong></td>
                            <td></td>
                            <td class="right"><strong>${escapeHtml(formatMoney(totalAmount))}</strong></td>
                            <td></td>
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

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("border-r bg-slate-100 px-2 py-1 text-center font-semibold leading-tight last:border-r-0", className)} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("overflow-hidden text-ellipsis border-r px-3 py-1.5 align-middle last:border-r-0", className)} {...props} />
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) => permission.module === module && permission.action === action)
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

function isQuantityCorrectionLedger(item: InventoryLedgerReportRow) {
    const docType = String(item.doc_type || "").toUpperCase()
    if (["IMPORT_PURCHASE", "OTHER_INBOUND"].includes(docType)) {
        return Number(item.quantity_in || 0) > 0 && Boolean(item.lot_code)
    }
    if (docType === "OTHER_EXPORT") {
        return Number(item.quantity_out || 0) > 0 && Boolean(item.lot_code)
    }
    return false
}

function formatDate(value?: string) {
    if (!value) return "-"
    const datePart = value.split("T")[0]
    const [year, month, day] = datePart.split("-")
    if (year && month && day) {
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    }
    return datePart
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
        maximumFractionDigits: 6,
    }).format(n)
}

function formatMoney(value?: number | string | null) {
    if (value === null || value === undefined || value === "") return ""
    const n = Number(value)
    if (Number.isNaN(n)) return String(value)
    return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 2,
    }).format(n)
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}
