import { type ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import { listProductUnitLookups } from "@/api/app-lookup"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn, formatCurrency } from "@/lib/utils"
import { Check, Funnel, MoreHorizontal, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { listTransactionOptions, updateTransactionNpp } from "@/api/transactions"
import type { Transaction } from "../data/schema"

type TextColumnKey = keyof Transaction

export type TransactionColumnFilters = {
    customer_code?: string[]
    customer_name?: string[]
    product_code?: string[]
    product_name?: string[]
    product_group_name?: string[]
    unit?: string[]
    customer_type?: string[]
    npp?: string[]
    hdn_status?: string[]
    region?: string
    document_date_from?: string
    document_date_to?: string
}

type FilterableColumnKey = "customer_code" | "customer_name" | "product_code" | "product_name"
type ColumnMultiFilterKey = FilterableColumnKey | "unit"

function textColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 160,
    header?: ColumnDef<Transaction>["header"],
    minWidth = 90,
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        minSize: Math.min(width, minWidth),
        header: header ?? (({ column }) => <DataTableColumnHeader column={column} title={title} />),
        cell: ({ row }) => {
            const value = row.getValue(accessorKey as string)
            return (
                <span className="block truncate text-sm" title={value == null ? "" : String(value)}>
                    {value == null || value === "" ? "-" : String(value)}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] max-w-[${width}px]`,
        },
    }
}

function numberColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 120,
    footer?: React.ReactNode,
    minWidth = 100,
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        minSize: Math.min(width, minWidth),
        header: ({ column }) => (
            <div className="text-right">
                <DataTableColumnHeader column={column} title={title} />
            </div>
        ),
        cell: ({ row }) => {
            const value = Number(row.getValue(accessorKey as string) ?? 0)
            return (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatNumber(value)}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
            footer: footer ? () => footer : undefined,
        },
    }
}

function actualQuantityColumn(totalActualQty = 0): ColumnDef<Transaction> {
    return {
        id: "actual_qty",
        accessorFn: (row) => Number(row.sale_qty || 0) - Number(row.return_qty || 0),
        enableSorting: false,
        header: ({ column }) => (
            <div className="text-right">
                <DataTableColumnHeader column={column} title="SL bán thực tế theo ĐVC" />
            </div>
        ),
        cell: ({ row }) => {
            const value = Number(row.getValue("actual_qty") ?? 0)
            return (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatNumber(value)}
                </span>
            )
        },
        size: 180,
        minSize: 150,
        meta: {
            thClassName: "w-[180px] whitespace-nowrap text-right",
            tdClassName: "w-[180px] whitespace-nowrap",
            footer: () => (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatNumber(totalActualQty)}
                </span>
            ),
        },
    }
}

function moneyColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 150,
    footer?: React.ReactNode,
    minWidth = 110,
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        minSize: Math.min(width, minWidth),
        header: ({ column }) => (
            <div className="text-right">
                <DataTableColumnHeader column={column} title={title} />
            </div>
        ),
        cell: ({ row }) => {
            const value = Number(row.getValue(accessorKey as string) ?? 0)
            return (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {value ? formatCurrency(value) : "-"}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
            footer: footer ? () => footer : undefined,
        },
    }
}

function saleRevenue(row: Transaction) {
    return Number(row.sale_qty || 0) > 0 ? Number(row.revenue || 0) : 0
}

function returnRevenue(row: Transaction) {
    return Number(row.return_qty || 0) > 0 ? Number(row.revenue || 0) : 0
}

function computedMoneyColumn({
    id,
    title,
    width = 170,
    footer,
    value,
}: {
    id: string
    title: string
    width?: number
    footer?: React.ReactNode
    value: (row: Transaction) => number
}): ColumnDef<Transaction> {
    return {
        id,
        accessorFn: value,
        enableSorting: false,
        minSize: 120,
        header: ({ column }) => (
            <div className="text-right">
                <DataTableColumnHeader column={column} title={title} />
            </div>
        ),
        cell: ({ row }) => {
            const amount = Number(row.getValue(id) ?? 0)
            return (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {amount ? formatCurrency(amount) : "-"}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
            footer: footer ? () => footer : undefined,
        },
    }
}

function dateColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 125,
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        minSize: 110,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => (
            <span className="block whitespace-nowrap text-sm tabular-nums">
                {formatDate(row.getValue(accessorKey as string))}
            </span>
        ),
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
        },
    }
}

function NppCell({ row }: { row: Transaction }) {
    const [value, setValue] = useState(row.npp || "")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setValue(row.npp || "")
    }, [row.id, row.npp])

    const save = async (next: string) => {
        const previous = value
        setValue(next)
        setSaving(true)
        try {
            await updateTransactionNpp(row.id, next)
            toast.success(next ? "Đã cập nhật NPP" : "Đã xóa NPP")
        } catch (error) {
            setValue(previous)
            toast.error(error instanceof Error ? error.message : "Cập nhật NPP thất bại")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex items-center gap-1">
            <Select value={value || undefined} onValueChange={save} disabled={saving}>
                <SelectTrigger size="sm" className="h-8 w-[92px] bg-white px-2">
                    <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="PPH">PPH</SelectItem>
                    <SelectItem value="PPL">PPL</SelectItem>
                    <SelectItem value="PPN.C">PPN.C</SelectItem>
                    <SelectItem value="PPN.K">PPN.K</SelectItem>
                </SelectContent>
            </Select>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={saving || !value}
                onClick={() => save("")}
                title="Xóa NPP"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function buildTransactionColumns(
    filters: TransactionColumnFilters,
    onFiltersChange: (filters: TransactionColumnFilters) => void,
    totals: { revenue: number; returnRevenue: number; actualRevenue: number; saleQty: number; returnQty: number; actualQty: number } = {
        revenue: 0,
        returnRevenue: 0,
        actualRevenue: 0,
        saleQty: 0,
        returnQty: 0,
        actualQty: 0,
    },
    options: {
        canUseCorrections?: boolean
        onEditUnitPrice?: (row: Transaction) => void
    } = {},
): ColumnDef<Transaction>[] {
    const setColumnFilter = (key: ColumnMultiFilterKey, value?: string[]) => {
        onFiltersChange({
            ...filters,
            [key]: value?.length ? value : undefined,
        })
    }

    const filterHeader = (key: FilterableColumnKey, title: string) => (
        <ColumnFilterHeader
            title={title}
            field={key}
            value={filters[key]}
            filters={filters}
            onChange={(value) => setColumnFilter(key, value)}
        />
    )

    return [
        ...(options.canUseCorrections ? [
        {
            id: "correction_actions",
            enableSorting: false,
            enableHiding: false,
            size: 92,
            minSize: 86,
            header: () => <span className="block text-center">Thao tác</span>,
            cell: ({ row }) => (
                <TransactionCorrectionActions
                    row={row.original}
                    canUseCorrections={Boolean(options.canUseCorrections)}
                    onEditUnitPrice={options.onEditUnitPrice}
                />
            ),
            meta: {
                thClassName: "w-[92px] whitespace-nowrap text-center",
                tdClassName: "w-[92px] whitespace-nowrap text-center",
            },
        },
        ] : []),
        {
            ...buildIndexColumn<Transaction>(),
            size: 56,
            minSize: 48,
            meta: {
                thClassName: "w-14 whitespace-nowrap",
                tdClassName: "w-14 ps-3 whitespace-nowrap",
            },
        },
        dateColumn("document_date", "Ngày chứng từ", 125),
        textColumn("document_no", "Số chứng từ", 150),
        textColumn("customer_code", "Mã khách hàng", 180, () => filterHeader("customer_code", "Mã khách hàng")),
        textColumn("customer_name", "Tên khách hàng", 260, () => filterHeader("customer_name", "Tên khách hàng")),
        textColumn("customer_address", "Địa chỉ", 300),
        textColumn("product_code", "Mã hàng", 180, () => filterHeader("product_code", "Mã hàng")),
        textColumn("product_name", "Tên hàng trên chứng từ", 300, () => filterHeader("product_name", "Tên hàng trên chứng từ")),
        textColumn("unit", "Đơn vị chính (ĐVC)", 140, () => (
            <UnitColumnFilterHeader
                title="Đơn vị chính (ĐVC)"
                value={filters.unit}
                onChange={(value) => setColumnFilter("unit", value)}
            />
        )),
        numberColumn(
            "sale_qty",
            "Tổng SL bán theo ĐVC",
            160,
            <span className="block text-right tabular-nums whitespace-nowrap">
                {formatNumber(totals.saleQty)}
            </span>,
        ),
        moneyColumn("unit_price", "Đơn giá theo ĐVC", 150),
        computedMoneyColumn({
            id: "sale_revenue",
            title: "Doanh số bán",
            width: 170,
            value: saleRevenue,
            footer: (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatCurrency(totals.revenue)}
                </span>
            ),
        }),
        computedMoneyColumn({
            id: "return_revenue",
            title: "Doanh số trả lại",
            width: 180,
            value: returnRevenue,
            footer: (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatCurrency(totals.returnRevenue)}
                </span>
            ),
        }),
        computedMoneyColumn({
            id: "actual_revenue",
            title: "Doanh số bán thực tế",
            width: 190,
            value: (row) => saleRevenue(row) - returnRevenue(row),
            footer: (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatCurrency(totals.actualRevenue)}
                </span>
            ),
        }),
        numberColumn(
            "return_qty",
            "SL trả lại theo ĐVC",
            160,
            <span className="block text-right tabular-nums whitespace-nowrap">
                {formatNumber(totals.returnQty)}
            </span>,
        ),
        actualQuantityColumn(totals.actualQty),
        textColumn("sale_user_code", "Mã nhân viên bán hàng", 180),
        textColumn("sale_user_name", "Tên nhân viên bán hàng", 220),
        textColumn("warehouse_code", "Mã kho", 120),
        textColumn("warehouse_name", "Tên kho", 180),
        textColumn("description", "Mô tả HH", 260),
        textColumn("contact_name", "Người liên hệ", 180),
        textColumn("vthh_con", "VTHH_CON", 140),
        textColumn("vthh_group_name", "Tên nhóm VTHH", 180),
        textColumn("customer_type", "PHÂN_LOẠI_KH", 140),
        textColumn("ext_detail_2", "Trường mở rộng chi tiết 2", 280),
        numberColumn("is_gift", "HÀNG_TẶNG", 120),
        textColumn("private_code", "MÃ_RIÊNG", 150),
        numberColumn("sl_rieng_tl", "SL_RIÊNG_TL", 140),
        numberColumn("sl_tl_nhom", "SL_TL_NHÓM", 140),
        numberColumn("sl_lb2c", "SL_L_B2C", 120),
        numberColumn("sl_lb2b", "SL_L_B2B", 120),
        numberColumn("sl_hdn", "SL_HDN", 110),
        numberColumn("diem_hdn", "DIEM_HDN", 120),
        numberColumn("process_month", "THANG_XU_LY", 130),
        {
            accessorKey: "npp",
            enableSorting: false,
            minSize: 140,
            size: 150,
            header: ({ column }) => <DataTableColumnHeader column={column} title="NPP" />,
            cell: ({ row }) => <NppCell row={row.original} />,
            meta: {
                thClassName: "w-[150px] whitespace-nowrap",
                tdClassName: "w-[150px] whitespace-nowrap",
            },
        },
        textColumn("valid_code", "MA_HOP _LE", 130),
        textColumn("hdn_status", "TINH_TRANG_HDN", 160),
        textColumn("common_group", "NHÓM-CHUNG", 150),
        textColumn("region", "KHU_VUC", 120),
        numberColumn("sl_hdn_k0_ma_rieng", "SL_HDN_K0_MA_RIENG", 190),
    ]
}

function TransactionCorrectionActions({
    row,
    canUseCorrections,
    onEditUnitPrice,
}: {
    row: Transaction
    canUseCorrections: boolean
    onEditUnitPrice?: (row: Transaction) => void
}) {
    const canEditUnitPrice = canUseCorrections && Boolean(row.import_batch_id) && Boolean(onEditUnitPrice)

    if (!canEditUnitPrice) {
        return <span className="text-muted-foreground">-</span>
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Thao tác sửa sai">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Thao tác sửa sai</div>
                <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => onEditUnitPrice?.(row)}
                >
                    <Pencil className="mt-0.5 h-4 w-4 text-primary" />
                    <span>
                        <span className="block font-medium">Sửa đơn giá theo ĐVC</span>
                        <span className="block text-xs text-muted-foreground">Chỉ áp dụng cho dữ liệu được import từ file.</span>
                    </span>
                </button>
            </PopoverContent>
        </Popover>
    )
}

type Option = {
    value: string
    label: string
}

let reopenFilterField: FilterableColumnKey | null = null

function ColumnFilterHeader({
    title,
    field,
    value,
    filters,
    onChange,
}: {
    title: string
    field: FilterableColumnKey
    value?: string[]
    filters: TransactionColumnFilters
    onChange: (value?: string[]) => void
}) {
    const selected = value ?? []
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState("")
    const [loading, setLoading] = useState(false)
    const [options, setOptions] = useState<Option[]>([])
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const keepOpenAfterSelectRef = useRef(false)

    const selectedSet = useMemo(() => new Set(selected.map(String)), [selected])

    useEffect(() => {
        if (reopenFilterField === field) {
            reopenFilterField = null
            setOpen(true)
        }
    }, [field])

    useEffect(() => {
        if (!open) return
        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await listTransactionOptions({
                    field,
                    keyword,
                    size: 50,
                    ...buildOptionParams(filters, field),
                })
                setOptions((res.items ?? []).map((item) => ({
                    value: String(item.value),
                    label: String(item.label || item.value),
                })))
            } finally {
                setLoading(false)
            }
        }, 250)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [open, keyword, field, filters])

    const allOptions = useMemo(() => {
        const map = new Map<string, Option>()
        selected.forEach((item) => map.set(item, { value: item, label: item }))
        options.forEach((item) => map.set(item.value, item))
        return Array.from(map.values())
    }, [options, selected])

    const selectedOptions = allOptions.filter((item) => selectedSet.has(item.value))
    const unselectedOptions = allOptions.filter((item) => !selectedSet.has(item.value))

    const toggle = (option: Option) => {
        keepOpenAfterSelectRef.current = true
        reopenFilterField = field
        const next = new Set(selectedSet)
        if (next.has(option.value)) {
            next.delete(option.value)
        } else {
            next.add(option.value)
        }
        onChange(Array.from(next))
        window.setTimeout(() => setOpen(true), 0)
    }

    const clear = () => {
        keepOpenAfterSelectRef.current = true
        reopenFilterField = field
        onChange(undefined)
        window.setTimeout(() => setOpen(true), 0)
    }

    return (
        <div className="flex min-w-0 items-center gap-1">
            <span className="truncate">{title}</span>
            <Popover
                open={open}
                onOpenChange={(next) => {
                    if (!next && keepOpenAfterSelectRef.current) {
                        keepOpenAfterSelectRef.current = false
                        window.setTimeout(() => setOpen(true), 0)
                        return
                    }
                    setOpen(next)
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                            "h-6 shrink-0 gap-1 rounded-sm px-1.5 text-slate-500 hover:bg-slate-100",
                            selected.length && "bg-teal-50 text-teal-700 hover:bg-teal-100",
                        )}
                    >
                        <Funnel className="h-3.5 w-3.5" />
                        {selected.length > 0 ? (
                            <span className="rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                {selected.length}
                            </span>
                        ) : null}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={`Tìm ${title.toLowerCase()}...`}
                            value={keyword}
                            onValueChange={setKeyword}
                        />
                        <CommandList className="max-h-[420px] overflow-y-auto">
                            <CommandEmpty>{loading ? "Đang tải..." : "Không có dữ liệu"}</CommandEmpty>

                            {selectedOptions.length > 0 ? (
                                <>
                                    <CommandGroup heading="Đã chọn">
                                        {selectedOptions.map((option) => (
                                            <CommandItem
                                                key={`selected-${option.value}`}
                                                value={`selected-${option.value}`}
                                                onMouseDown={(event) => event.preventDefault()}
                                                onSelect={() => toggle(option)}
                                            >
                                                <Check className="mr-2 h-4 w-4 opacity-100" />
                                                <span className="truncate">{option.label}</span>
                                                <X className="ml-auto h-4 w-4 opacity-60" />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandSeparator />
                                </>
                            ) : null}

                            <CommandGroup heading="Kết quả">
                                {unselectedOptions.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={`option-${option.value}`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onSelect={() => toggle(option)}
                                    >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        <span className="truncate">{option.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {selected.length > 0 ? (
                                <CommandItem
                                    onMouseDown={(event) => event.preventDefault()}
                                    onSelect={clear}
                                    className="justify-center text-center text-muted-foreground"
                                >
                                    Xóa bộ lọc
                                </CommandItem>
                            ) : null}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

function buildOptionParams(filters: TransactionColumnFilters, currentField: FilterableColumnKey) {
    return {
        customer_code: currentField === "customer_code" ? undefined : encodeMulti(filters.customer_code),
        customer_name: currentField === "customer_name" ? undefined : encodeMulti(filters.customer_name),
        product_code: currentField === "product_code" ? undefined : encodeMulti(filters.product_code),
        product_name: currentField === "product_name" ? undefined : encodeMulti(filters.product_name),
        unit: encodeMulti(filters.unit),
        product_group_name: encodeMulti(filters.product_group_name),
        customer_type: encodeMulti(filters.customer_type),
        hdn_status: encodeMulti(filters.hdn_status),
        region: filters.region,
        document_date_from: filters.document_date_from,
        document_date_to: filters.document_date_to,
    }
}

function encodeMulti(value?: string[]) {
    return value?.length ? value.join(",") : undefined
}

function UnitColumnFilterHeader({
    title,
    value,
    onChange,
}: {
    title: string
    value?: string[]
    onChange: (value?: string[]) => void
}) {
    const selected = useMemo(() => value ?? [], [value])
    const [open, setOpen] = useState(false)
    const [draftSelected, setDraftSelected] = useState<string[]>(selected)
    const active = selected.length > 0
    const { data: unitLookupPage } = useQuery({
        queryKey: ["transactions-product-unit-lookups"],
        queryFn: () => listProductUnitLookups({ page: 1, size: 200 }),
    })

    const options = useMemo(() => {
        const fromSelected = selected.map((unit) => ({ value: unit, label: unit }))
        const fromLookup = (unitLookupPage?.items ?? []).map((item) => ({
            value: item.name || item.code,
            label: item.name || item.code,
        }))
        return uniqueOptions([...fromSelected, ...fromLookup])
    }, [selected, unitLookupPage])

    useEffect(() => {
        if (open) {
            setDraftSelected(selected)
        }
    }, [open, selected])

    const toggle = (optionValue: string) => {
        setDraftSelected((current) =>
            current.includes(optionValue)
                ? current.filter((item) => item !== optionValue)
                : [...current, optionValue],
        )
    }

    const apply = () => {
        onChange(draftSelected.length ? draftSelected : undefined)
        setOpen(false)
    }

    const clear = () => {
        setDraftSelected([])
        onChange(undefined)
        setOpen(false)
    }

    return (
        <div className="flex min-w-0 items-center justify-center gap-1.5">
            <span className="truncate">{title}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
                            active ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        aria-label={`Lọc ${title}`}
                    >
                        <Funnel className="h-4 w-4" />
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-2">
                    <div className="px-2 pb-2 font-semibold text-foreground">Lọc {title}</div>
                    <div className="max-h-[320px] space-y-1 overflow-y-auto">
                        {options.length ? options.map((option) => (
                            <label
                                key={option.value}
                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                            >
                                <Checkbox
                                    checked={draftSelected.includes(option.value)}
                                    onCheckedChange={() => toggle(option.value)}
                                />
                                <span className="truncate">{option.label}</span>
                            </label>
                        )) : (
                            <div className="px-2 py-3 text-sm text-muted-foreground">
                                Chưa có danh mục đơn vị tính.
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex justify-end gap-2 border-t pt-2">
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
                    onClick={() => onChange(undefined)}
                    aria-label={`Xóa lọc ${title}`}
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            ) : null}
        </div>
    )
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

function formatNumber(value: number) {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: 6,
    })
}

function formatDate(value: unknown) {
    if (!value) return "-"
    const raw = String(value)
    const date = raw.trim().split(/[T\s]/)[0]
    const dmy = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`
    const ymd = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) return `${ymd[3].padStart(2, "0")}/${ymd[2].padStart(2, "0")}/${ymd[1]}`
    return raw
}
