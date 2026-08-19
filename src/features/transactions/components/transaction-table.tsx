import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardList, Layers, Loader2, MapPin, Users, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { listProductGroupPpStatusLookups } from "@/api/app-lookup"
import { getMyPermissions } from "@/api/auth/permission"
import { listTransactionOptions, updateTransactionUnitPrice } from "@/api/transactions"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Transaction } from "../data/schema"
import { buildTransactionColumns } from "./transaction-columns"

type TransactionFilters = {
    customer_code?: string[]
    customer_name?: string[]
    product_code?: string[]
    product_name?: string[]
    product_group_name?: string[]
    unit?: string[]
    customer_type?: string[]
    is_gift?: string[]
    npp?: string[]
    hdn_status?: string[]
    region?: string
    document_date_from?: string
    document_date_to?: string
}

type TransactionTableProps = {
    data: Transaction[]
    totalRevenue: number
    totalReturnRevenue: number
    totalActualRevenue: number
    totalSaleQty: number
    totalReturnQty: number
    totalActualQty: number
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: TransactionFilters
    onFiltersChange: (filters: TransactionFilters) => void
}

const CUSTOMER_TYPE_OPTIONS = [
    { value: "B2B", label: "B2B" },
    { value: "B2C", label: "B2C" },
    { value: "MB_B2B", label: "MB B2B" },
]

const NO_NPP_VALUE = "__NO_NPP__"

const HDN_STATUS_OPTIONS = [
    { value: "VALID", label: "Hop le" },
    { value: "INVALID", label: "Khong hop le" },
    { value: "PENDING", label: "Cho xu ly" },
]

const IS_GIFT_OPTIONS = [
    { value: "0", label: "0 - Không tặng" },
    { value: "1", label: "1 - Hàng tặng" },
]

export function TransactionTable({
    data,
    totalRevenue,
    totalReturnRevenue,
    totalActualRevenue,
    totalSaleQty,
    totalReturnQty,
    totalActualQty,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: TransactionTableProps) {
    const queryClient = useQueryClient()
    const [unitPriceRow, setUnitPriceRow] = useState<Transaction | null>(null)
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const { data: nppLookupPage } = useQuery({
        queryKey: ["app-lookups", "PRODUCT_GROUP_PP_STATUS"],
        queryFn: () => listProductGroupPpStatusLookups({ page: 1, size: 100 }),
    })
    const nppOptions = useMemo(() => uniqueOptions([
        { value: NO_NPP_VALUE, label: "Không có" },
        ...(nppLookupPage?.items ?? []).map((item) => ({
            value: item.code,
            label: item.name || item.code,
        })),
    ]), [nppLookupPage])
    const canUseCorrections = hasPermission(permissions, "transactions", "correction.change")
    const { data: productGroupOptionPage } = useQuery({
        queryKey: ["transactions-product-group-options"],
        queryFn: () => listTransactionOptions({ field: "product_group_name", page: 1, size: 100 }),
    })
    const productGroupOptions = (productGroupOptionPage?.items ?? []).map((item) => ({
        value: String(item.value),
        label: String(item.label || item.value),
    }))
    const setFilter = <K extends keyof TransactionFilters>(
        key: K,
        value: TransactionFilters[K],
    ) => onFiltersChange({ ...filters, [key]: value })
    const columns = buildTransactionColumns(filters, onFiltersChange, {
        revenue: totalRevenue,
        returnRevenue: totalReturnRevenue,
        actualRevenue: totalActualRevenue,
        saleQty: totalSaleQty,
        returnQty: totalReturnQty,
        actualQty: totalActualQty,
    }, {
        canUseCorrections,
        onEditUnitPrice: setUnitPriceRow,
        nppFilterOptions: nppOptions,
    })
    const activeFilterChips = [
        keyword
            ? { key: "keyword", label: `Tìm kiếm "${keyword}"`, onClear: () => onKeywordChange("") }
            : null,
        filters.customer_type?.length
            ? {
                key: "customer_type",
                label: `Loại KH: ${filterValueLabels(filters.customer_type, CUSTOMER_TYPE_OPTIONS)}`,
                onClear: () => setFilter("customer_type", undefined),
            }
            : null,
        filters.npp?.length
            ? {
                key: "npp",
                label: `NPP: ${filterValueLabels(filters.npp, nppOptions)}`,
                onClear: () => setFilter("npp", undefined),
            }
            : null,
        filters.product_group_name?.length
            ? {
                key: "product_group_name",
                label: `Nhóm VTHH: ${filterValueLabels(filters.product_group_name, productGroupOptions)}`,
                onClear: () => setFilter("product_group_name", undefined),
            }
            : null,
        filters.is_gift?.length
            ? {
                key: "is_gift",
                label: `Hàng tặng: ${filterValueLabels(filters.is_gift, IS_GIFT_OPTIONS)}`,
                onClear: () => setFilter("is_gift", undefined),
            }
            : null,
        filters.customer_code?.length
            ? { key: "customer_code", label: `Mã KH: ${filters.customer_code.join(", ")}`, onClear: () => setFilter("customer_code", undefined) }
            : null,
        filters.customer_name?.length
            ? { key: "customer_name", label: `Tên KH: ${filters.customer_name.join(", ")}`, onClear: () => setFilter("customer_name", undefined) }
            : null,
        filters.product_code?.length
            ? { key: "product_code", label: `Mã hàng: ${filters.product_code.join(", ")}`, onClear: () => setFilter("product_code", undefined) }
            : null,
        filters.product_name?.length
            ? { key: "product_name", label: `Tên hàng: ${filters.product_name.join(", ")}`, onClear: () => setFilter("product_name", undefined) }
            : null,
        filters.unit?.length
            ? { key: "unit", label: `ĐVC: ${filters.unit.join(", ")}`, onClear: () => setFilter("unit", undefined) }
            : null,
        filters.hdn_status?.length
            ? {
                key: "hdn_status",
                label: `Tình trạng HDN: ${filterValueLabels(filters.hdn_status, HDN_STATUS_OPTIONS)}`,
                onClear: () => setFilter("hdn_status", undefined),
            }
            : null,
        filters.region
            ? { key: "region", label: `Khu vực: ${filters.region}`, onClear: () => setFilter("region", undefined) }
            : null,
        filters.document_date_from
            ? { key: "document_date_from", label: `Từ ngày CT: ${filters.document_date_from}`, onClear: () => setFilter("document_date_from", undefined) }
            : null,
        filters.document_date_to
            ? { key: "document_date_to", label: `Đến ngày CT: ${filters.document_date_to}`, onClear: () => setFilter("document_date_to", undefined) }
            : null,
    ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>

    const clearAllActiveFilters = () => {
        onKeywordChange("")
        onFiltersChange({
            customer_code: undefined,
            customer_name: undefined,
            product_code: undefined,
            product_name: undefined,
            product_group_name: undefined,
            unit: undefined,
            customer_type: undefined,
            is_gift: undefined,
            npp: undefined,
            hdn_status: undefined,
            region: undefined,
            document_date_from: undefined,
            document_date_to: undefined,
        })
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tim theo so CT, ma KH, ten KH, ma SP..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <MultiSelectFilter
                        icon={Users}
                        label="Loai KH"
                        value={filters.customer_type}
                        onChange={(v) => setFilter("customer_type", v)}
                        options={CUSTOMER_TYPE_OPTIONS}
                        className="min-w-[160px] flex-1"
                    />

                    <MultiSelectFilter
                        icon={ClipboardList}
                        label="NPP"
                        value={filters.npp}
                        onChange={(v) => setFilter("npp", v)}
                        options={nppOptions}
                        className="min-w-[150px] flex-1"
                    />

                    <MultiSelectFilter
                        icon={ClipboardList}
                        label="Tinh trang HDN"
                        value={filters.hdn_status}
                        onChange={(v) => setFilter("hdn_status", v)}
                        options={HDN_STATUS_OPTIONS}
                        className="min-w-[170px] flex-1"
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <DynamicMultiSelectFilter
                        icon={Layers}
                        field="product_group_name"
                        label="Nhom VTHH"
                        value={filters.product_group_name}
                        onChange={(v) => setFilter("product_group_name", v)}
                        className="min-w-[220px] flex-1"
                    />

                    <DynamicSingleSelectFilter
                        icon={MapPin}
                        field="region"
                        label="Khu vuc"
                        value={filters.region}
                        onChange={(v) => setFilter("region", v)}
                        className="min-w-[180px] flex-1"
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.document_date_from}
                        onChange={(v) => setFilter("document_date_from", v)}
                        placeholder="Tu ngay CT"
                    />

                    <DatePicker
                        className="min-w-[150px] flex-1 [&_button]:h-10"
                        value={filters.document_date_to}
                        onChange={(v) => setFilter("document_date_to", v)}
                        placeholder="Den ngay CT"
                    />
                </div>
            </div>

            {activeFilterChips.length ? (
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-white px-3 py-2">
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

            <CrudTable<Transaction>
                data={data}
                columns={columns}
                entityName="giao dich"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                enableColumnResize
                enableStickyHorizontalScroll
                enableColumnPinning
                defaultPinnedColumnId="customer_name"
                headerVariant="report"
                className="[&_td]:border-r [&_td]:border-slate-200 [&_td:last-child]:border-r-0 [&_tbody_tr]:border-b [&_th]:border-r [&_th]:border-slate-200 [&_th:last-child]:border-r-0"
            />
            <UnitPriceCorrectionDialog
                row={unitPriceRow}
                open={!!unitPriceRow}
                onOpenChange={(open) => {
                    if (!open) setUnitPriceRow(null)
                }}
                onChanged={() => {
                    queryClient.invalidateQueries({ queryKey: ["transactions"] })
                    queryClient.invalidateQueries({ queryKey: ["transactions-summary"] })
                    setUnitPriceRow(null)
                }}
            />
        </div>
    )
}

type IconComponent = React.ComponentType<{ className?: string }>
type Option = { value: string; label: string }

function UnitPriceCorrectionDialog({
    row,
    open,
    onOpenChange,
    onChanged,
}: {
    row: Transaction | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onChanged: () => void
}) {
    const [value, setValue] = useState("")

    useEffect(() => {
        if (open && row) {
            setValue(String(row.unit_price ?? ""))
        }
    }, [open, row])

    const unitPrice = parseDecimalInput(value)
    const currentUnitPrice = Number(row?.unit_price || 0)
    const quantity = Number(row?.sale_qty || 0) > 0
        ? Number(row?.sale_qty || 0)
        : Math.max(Number(row?.return_qty || 0), 0)
    const discount = Number(row?.discount || 0)
    const previewRevenue = Number.isFinite(unitPrice)
        ? Math.max(unitPrice * quantity - discount, 0)
        : 0
    const unchanged = Number.isFinite(unitPrice) && Math.abs(unitPrice - currentUnitPrice) < 0.000001

    const mutation = useMutation({
        mutationFn: () => updateTransactionUnitPrice(Number(row?.id), unitPrice),
        onSuccess: () => {
            toast.success("Da cap nhat don gia va doanh thu")
            onChanged()
        },
        onError: (error: any) => {
            toast.error(error?.message || "Khong cap nhat duoc don gia")
        },
    })

    const canSubmit = Boolean(row && row.import_batch_id && Number.isFinite(unitPrice) && unitPrice >= 0 && !unchanged && !mutation.isPending)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Sửa đơn giá theo ĐVC</DialogTitle>
                    <DialogDescription>
                        Chỉ sửa dòng được import từ file. Doanh thu sẽ được tính lại theo số lượng tương ứng và chiết khấu.
                    </DialogDescription>
                </DialogHeader>

                {row ? (
                    <div className="space-y-4">
                        <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
                            <InfoLine label="Chứng từ" value={row.document_no || `#${row.id}`} />
                            <InfoLine label="Khách hàng" value={`${row.customer_code || "-"} - ${row.customer_name || "-"}`} />
                            <InfoLine label="Hàng hóa" value={`${row.product_code || "-"} - ${row.product_name || "-"}`} />
                            <InfoLine label="Số lượng tính doanh thu" value={formatNumber(quantity)} />
                            <InfoLine label="Chiết khấu" value={formatMoney(discount)} />
                            <InfoLine label="Doanh thu hiện tại" value={formatMoney(Number(row.revenue || 0))} />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Đơn giá mới</label>
                            <Input
                                value={value}
                                onChange={(event) => setValue(event.target.value)}
                                placeholder="Nhap don gia moi"
                                className="h-10 font-mono"
                            />
                            {!Number.isFinite(unitPrice) ? (
                                <div className="text-sm text-destructive">Don gia moi khong hop le.</div>
                            ) : null}
                            {unchanged ? (
                                <div className="text-sm text-muted-foreground">Don gia moi dang trung don gia hien tai.</div>
                            ) : null}
                        </div>

                        <div className="grid gap-2 rounded-md border p-3 text-sm">
                            <InfoLine label="Đơn giá hiện tại" value={formatMoney(currentUnitPrice)} />
                            <InfoLine label="Đơn giá mới" value={Number.isFinite(unitPrice) ? formatMoney(unitPrice) : "-"} />
                            <InfoLine label="Doanh thu mới" value={Number.isFinite(unitPrice) ? formatMoney(previewRevenue) : "-"} />
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="button" disabled={!canSubmit} onClick={() => mutation.mutate()}>
                        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Cập nhật
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="min-w-0 truncate font-medium" title={typeof value === "string" ? value : undefined}>{value}</span>
        </div>
    )
}

function parseDecimalInput(value: string) {
    const normalized = value.trim().replace(/\s/g, "").replace(/,/g, "")
    if (!normalized) return Number.NaN
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : Number.NaN
}

function formatMoney(value: number) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)
}

function MultiSelectFilter({
    icon: Icon,
    label,
    value,
    onChange,
    options,
    className,
}: {
    icon?: IconComponent
    label: string
    value?: string[]
    onChange: (value?: string[]) => void
    options: Option[]
    className?: string
}) {
    const selected = value ?? []

    const toggle = (v: string) => {
        const next = selected.includes(v)
            ? selected.filter((item) => item !== v)
            : [...selected, v]
        onChange(next.length ? next : undefined)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className={filterButtonClass(className)}>
                    <FilterLabel icon={Icon} label={selected.length ? `${label} (${selected.length})` : label} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[420px] w-[260px] overflow-y-auto">
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selected.includes(option.value)}
                        onCheckedChange={() => toggle(option.value)}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xoa bo loc
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function DynamicMultiSelectFilter({
    icon: Icon,
    field,
    label,
    value,
    onChange,
    className,
}: {
    icon?: IconComponent
    field: "product_group_name"
    label: string
    value?: string[]
    onChange: (value?: string[]) => void
    className?: string
}) {
    const selected = value ?? []
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<Option[]>([])
    const [draftSelected, setDraftSelected] = useState<string[]>(selected)

    useEffect(() => {
        if (open) {
            setDraftSelected(selected)
        }
    }, [open, value])

    useEffect(() => {
        if (!open) return
        let cancelled = false
        listTransactionOptions({ field, page: 1, size: 100 })
            .then((res) => {
                if (cancelled) return
                setOptions((res.items ?? []).map((item) => ({
                    value: String(item.value),
                    label: String(item.label || item.value),
                })))
            })
            .catch(() => setOptions([]))
        return () => {
            cancelled = true
        }
    }, [open, field])

    const allOptions = mergeSelectedOptions(draftSelected, options)
    const toggle = (v: string) => {
        setDraftSelected((current) => current.includes(v)
            ? current.filter((item) => item !== v)
            : [...current, v])
    }
    const apply = () => {
        onChange(draftSelected.length ? draftSelected : undefined)
        setOpen(false)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className={filterButtonClass(className)}>
                    <FilterLabel icon={Icon} label={selected.length ? `${label} (${selected.length})` : label} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[320px] p-0">
                <div className="max-h-[360px] overflow-y-auto p-1">
                    {allOptions.length ? allOptions.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={draftSelected.includes(option.value)}
                            onCheckedChange={() => toggle(option.value)}
                            onSelect={(event) => event.preventDefault()}
                        >
                            {option.label}
                        </DropdownMenuCheckboxItem>
                    )) : (
                        <DropdownMenuItem disabled>Khong co du lieu</DropdownMenuItem>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-2 p-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setDraftSelected([])
                            onChange(undefined)
                            setOpen(false)
                        }}
                        disabled={!draftSelected.length && !selected.length}
                    >
                        Xoa bo loc
                    </Button>
                    <Button type="button" size="sm" onClick={apply}>
                        Ap dung
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function DynamicSingleSelectFilter({
    icon: Icon,
    field,
    label,
    value,
    onChange,
    className,
}: {
    icon?: IconComponent
    field: "region"
    label: string
    value?: string
    onChange: (value?: string) => void
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<Option[]>([])

    useEffect(() => {
        if (!open) return
        let cancelled = false
        listTransactionOptions({ field, page: 1, size: 100 })
            .then((res) => {
                if (cancelled) return
                setOptions((res.items ?? []).map((item) => ({
                    value: String(item.value),
                    label: String(item.label || item.value),
                })))
            })
            .catch(() => setOptions([]))
        return () => {
            cancelled = true
        }
    }, [open, field])

    const selectedLabel = options.find((option) => option.value === value)?.label ?? value

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className={filterButtonClass(className)}>
                    <FilterLabel icon={Icon} label={selectedLabel || label} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[420px] w-[260px] overflow-y-auto">
                {options.length ? options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </DropdownMenuItem>
                )) : (
                    <DropdownMenuItem disabled>Khong co du lieu</DropdownMenuItem>
                )}
                {value ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xoa bo loc
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function FilterLabel({ icon: Icon, label }: { icon?: IconComponent; label: string }) {
    return (
        <span className="inline-flex min-w-0 items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-500" /> : null}
            <span className="truncate">{label}</span>
        </span>
    )
}

function filterButtonClass(className?: string) {
    return `h-10 justify-between rounded-md border-slate-300 bg-white px-3 shadow-xs ${className ?? ""}`
}

function mergeSelectedOptions(selected: string[], options: Option[]) {
    const map = new Map<string, Option>()
    selected.forEach((item) => map.set(item, { value: item, label: item }))
    options.forEach((item) => map.set(item.value, item))
    return Array.from(map.values())
}

function uniqueOptions(options: Option[]) {
    const map = new Map<string, Option>()
    options.forEach((option) => {
        const value = option.value.trim()
        if (value && !map.has(value)) {
            map.set(value, { value, label: option.label.trim() || value })
        }
    })
    return Array.from(map.values())
}

function filterValueLabels(values: string[], options: Option[]) {
    const labels = new Map(options.map((option) => [option.value, option.label]))
    return values.map((value) => labels.get(value) ?? value).join(", ")
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) => permission.module === module && permission.action === action)
}
