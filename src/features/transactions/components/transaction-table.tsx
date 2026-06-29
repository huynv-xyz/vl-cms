import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { ClipboardList, Layers, MapPin, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { listTransactionOptions } from "@/api/transactions"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Transaction } from "../data/schema"
import { buildTransactionColumns } from "./transaction-columns"

type TransactionFilters = {
    customer_code?: string[]
    customer_name?: string[]
    product_code?: string[]
    product_name?: string[]
    product_group_name?: string[]
    customer_type?: string[]
    hdn_status?: string[]
    region?: string
    document_date_from?: string
    document_date_to?: string
}

type TransactionTableProps = {
    data: Transaction[]
    totalRevenue: number
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
    { value: "PP", label: "PP" },
    { value: "PPN.K", label: "PPN.K" },
    { value: "DAI_LY", label: "Dai ly" },
]

const HDN_STATUS_OPTIONS = [
    { value: "VALID", label: "Hop le" },
    { value: "INVALID", label: "Khong hop le" },
    { value: "PENDING", label: "Cho xu ly" },
]

export function TransactionTable({
    data,
    totalRevenue,
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
    const setFilter = <K extends keyof TransactionFilters>(
        key: K,
        value: TransactionFilters[K],
    ) => onFiltersChange({ ...filters, [key]: value })
    const columns = buildTransactionColumns(filters, onFiltersChange, {
        revenue: totalRevenue,
        saleQty: totalSaleQty,
        returnQty: totalReturnQty,
        actualQty: totalActualQty,
    })

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
            />
        </div>
    )
}

type IconComponent = React.ComponentType<{ className?: string }>
type Option = { value: string; label: string }

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
