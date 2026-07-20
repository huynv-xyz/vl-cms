import * as React from 'react'
import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { CrudTable } from '@/components/crud/crud-table'
import type { CustomerVip } from '../data/schema'
import { customerVipColumns } from './customer-vip-columns'
import { listCustomerVips } from '@/api/customer-vip'
import { listVipTiers } from '@/api/vip-tier'
import { DatePicker } from '@/components/date-picker'
import { SearchOnBlurInput } from '@/components/search-on-blur-input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import {
    Crown,
    ChevronLeft,
    ChevronRight,
    Users,
    TrendingUp,
    Wallet,
    AlertCircle,
    type LucideIcon,
} from 'lucide-react'

const NO_TIER_VALUE = '__NO_TIER__'
let keepVipTierFilterOpen = false
const NO_TIER_OPTION = { label: 'Chưa đủ điểm xét VIP', value: NO_TIER_VALUE }

const REGION_OPTIONS = [
    { label: 'Miền Bắc', value: 'MB' },
    { label: 'Miền Nam', value: 'MN' },
]

const GROUP_OPTIONS = [
    { label: 'B2B', value: 'B2B' },
    { label: 'B2C', value: 'B2C' },
]

const CUSTOMER_TYPE_OPTIONS = [
    { label: 'B2B', value: 'B2B' },
    { label: 'B2C', value: 'B2C' },
    { label: 'MB B2B', value: 'MB_B2B' },
]

const FILTER_CONTROL_CLASS = 'h-10 min-h-10 rounded-md border-slate-300 bg-white shadow-xs'

// ── getItems helper (khớp AsyncSelect) ────────────────────────────────
const getItems = (res: any): CustomerVip[] =>
    res?.items ?? res?.data?.items ?? []

const getPagedItems = <T,>(res: any): T[] =>
    res?.items ?? res?.data?.items ?? []

export type CustomerVipFilters = {
    calc_year?: number
    regions?: string[]
    tier_codes?: string[]
    group_codes?: string[]
    customer_types?: string[]
    customer_codes?: string[]
    from_date?: string
    to_date?: string
}

type CustomerVipTableProps = {
    data: CustomerVip[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: CustomerVipFilters
    onFiltersChange: (filters: CustomerVipFilters) => void
    onCalcYearChange: (year: number) => void
    onDateRangeChange: (value: Pick<CustomerVipFilters, 'from_date' | 'to_date'>) => void
}

export function CustomerVipTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
    onCalcYearChange,
    onDateRangeChange,
}: CustomerVipTableProps) {
    const [tierFilterOpen, setTierFilterOpen] = React.useState(keepVipTierFilterOpen)
    const tierOptionsQuery = useQuery({
        queryKey: ['vip-tier-options'],
        queryFn: () => listVipTiers({ page: 1, size: 200 }),
        staleTime: 5 * 60 * 1000,
    })
    const tierOptions = React.useMemo(() => {
        const items = getPagedItems<{
            id: number
            name: string
            sort_order?: number
            status?: number
        }>(tierOptionsQuery.data)
        return [
            NO_TIER_OPTION,
            ...items
                .filter((tier) => Number(tier.status ?? 1) === 1)
                .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
                .map((tier) => ({
                    label: tier.name,
                    value: String(tier.id),
                })),
        ]
    }, [tierOptionsQuery.data])
    const summary = buildSummary(data)
    const setFilter = (key: keyof CustomerVipFilters, value: string[] | undefined) =>
        onFiltersChange({ ...filters, [key]: value })
    const setTierFilter = (value: string[] | undefined) => {
        keepVipTierFilterOpen = true
        setTierFilterOpen(true)
        setFilter('tier_codes', value)
    }
    const setTierFilterOpenState = (open: boolean) => {
        keepVipTierFilterOpen = open
        setTierFilterOpen(open)
    }
    return (
        <div className="space-y-4">
            {(filters.from_date || filters.to_date) && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    Đang xem số liệu tạm tính theo ngày chứng từ {formatDateRange(filters.from_date, filters.to_date)}. Dữ liệu này không ghi đè kết quả đã chốt năm.
                </div>
            )}

            {/* ── SUMMARY CARDS ── */}
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={Users}
                    label="Khách hàng đang xem"
                    value={formatNumber(summary.count)}
                    tone="info"
                />
                <SummaryCard
                    icon={TrendingUp}
                    label="Tổng điểm VIP"
                    value={formatNumber(summary.totalPoints)}
                    tone="primary"
                />
                <SummaryCard
                    icon={Wallet}
                    label="Tổng thưởng cuối"
                    value={formatCurrency(summary.totalBonus)}
                    tone="success"
                />
                <SummaryCard
                    icon={summary.missingCount > 0 ? AlertCircle : Crown}
                    label="Còn thiếu điểm"
                    value={formatNumber(summary.missingCount) + ' KH'}
                    tone={summary.missingCount > 0 ? 'warn' : 'muted'}
                />
            </div>

            {/* ── FILTER ROW 1: search + async multi customer select ── */}
            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo mã hoặc tên khách hàng..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />
                    <AsyncMultiFilterDropdown
                        className={cn(FILTER_CONTROL_CLASS, 'min-w-[280px] flex-[1.8_1_0]')}
                        placeholder="Chọn khách hàng VIP..."
                        selected={filters.customer_codes ?? []}
                        onChange={(v) => setFilter('customer_codes', v)}
                        loadOptions={async (kw) => {
                            const res = await listCustomerVips({ page: 1, size: 30, keyword: kw })
                            return getItems(res).map((x) => ({
                                value: x.customer_code,
                                label: `${x.customer_code} — ${x.customer_name}`,
                            }))
                        }}
                    />
                </div>

                {/* ── FILTER ROW 2: dropdown filters ── */}
                <div className="flex w-full flex-wrap items-center gap-2">
                    <YearStepper
                        value={Number(filters.calc_year || new Date().getFullYear())}
                        onChange={onCalcYearChange}
                    />
                    <FilterDropdown
                        label="Khu vực"
                        options={REGION_OPTIONS}
                        selected={filters.regions ?? []}
                        onChange={(v) => setFilter('regions', v)}
                    />
                    <PersistentFilterPopover
                        label="Hạng VIP"
                        options={tierOptions}
                        selected={filters.tier_codes ?? []}
                        onChange={setTierFilter}
                        open={tierFilterOpen}
                        onOpenChange={setTierFilterOpenState}
                    />
                    <FilterDropdown
                        label="Loại KH"
                        options={CUSTOMER_TYPE_OPTIONS}
                        selected={filters.customer_types ?? []}
                        onChange={(v) => setFilter('customer_types', v)}
                    />
                    <FilterDropdown
                        label="Nhóm"
                        options={GROUP_OPTIONS}
                        selected={filters.group_codes ?? []}
                        onChange={(v) => setFilter('group_codes', v)}
                    />
                    <DatePicker
                        className="min-w-[180px] flex-1 [&_button]:h-10 [&_button]:rounded-md [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        value={filters.from_date}
                        onChange={(value) => onDateRangeChange({ from_date: value, to_date: filters.to_date })}
                        placeholder="Từ ngày CT"
                    />
                    <DatePicker
                        className="min-w-[180px] flex-1 [&_button]:h-10 [&_button]:rounded-md [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                        value={filters.to_date}
                        onChange={(value) => onDateRangeChange({ from_date: filters.from_date, to_date: value })}
                        placeholder="Đến ngày CT"
                    />
                </div>
            </div>

            {/* ── TABLE ── */}
            <CrudTable<CustomerVip>
                data={data}
                columns={customerVipColumns}
                entityName="khách hàng VIP"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                enableColumnResize
                enableStickyHorizontalScroll
                headerVariant="report"
                footer={false}
                className="[&_tbody_td]:border-r [&_tbody_td]:border-slate-200 [&_tbody_td:last-child]:border-r-0 [&_tbody_tr]:border-b"
            />
        </div>
    )
}

/* ── AsyncMultiFilterDropdown ────────────────────────────────────────── */
// Popover + Command có debounce search + multi-select checkbox

type AsyncOption = { value: string; label: string }

function YearStepper({
    value,
    onChange,
}: {
    value: number
    onChange: (year: number) => void
}) {
    return (
        <div className={cn(FILTER_CONTROL_CLASS, 'flex min-w-[150px] items-center justify-between overflow-hidden px-1')}>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onChange(value - 1)}
                aria-label="Năm trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums">
                Năm {value}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onChange(value + 1)}
                aria-label="Năm sau"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

function AsyncMultiFilterDropdown({
    placeholder = 'Chọn...',
    selected,
    onChange,
    loadOptions,
    className,
}: {
    placeholder?: string
    selected: string[]
    onChange: (values: string[] | undefined) => void
    loadOptions: (keyword: string) => Promise<AsyncOption[]>
    className?: string
}) {
    const [open, setOpen] = React.useState(false)
    const [keyword, setKeyword] = React.useState('')
    const [options, setOptions] = React.useState<AsyncOption[]>([])
    const [loading, setLoading] = React.useState(false)
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    // Chọn label cho selected values đã load
    const [selectedLabels, setSelectedLabels] = React.useState<Record<string, string>>({})

    React.useEffect(() => {
        if (!open) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const opts = await loadOptions(keyword)
                setOptions(opts)
                // Lưu labels cho các giá trị đang selected
                setSelectedLabels((prev) => {
                    const next = { ...prev }
                    opts.forEach((o) => { next[o.value] = o.label })
                    return next
                })
            } finally {
                setLoading(false)
            }
        }, 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [keyword, open])

    const toggle = (value: string) => {
        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value]
        onChange(next.length ? next : undefined)
    }

    const label = selected.length === 0
        ? placeholder
        : selected.length === 1
            ? (selectedLabels[selected[0]] ?? selected[0])
            : `Khách hàng (${selected.length})`

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn('justify-between truncate px-3', className)}
                >
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                        {label}
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Tìm mã hoặc tên khách hàng..."
                        value={keyword}
                        onValueChange={setKeyword}
                    />
                    <CommandList className="max-h-72 overflow-y-auto">
                        <CommandEmpty>
                            {loading ? 'Đang tải...' : 'Không có kết quả'}
                        </CommandEmpty>

                        {/* Nút xóa filter nếu đang có chọn */}
                        {selected.length > 0 && (
                            <CommandItem
                                className="text-muted-foreground text-xs border-b mb-1"
                                onSelect={() => {
                                    onChange(undefined)
                                    setOpen(false)
                                }}
                            >
                                Xóa {selected.length} lựa chọn
                            </CommandItem>
                        )}

                        {options.map((opt) => {
                            const isChecked = selected.includes(opt.value)
                            return (
                                <CommandItem
                                    key={opt.value}
                                    onSelect={() => toggle(opt.value)}
                                    className="gap-2"
                                >
                                    <div className={cn(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                                        isChecked
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input'
                                    )}>
                                        {isChecked && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="min-w-0 truncate text-sm">{opt.label}</span>
                                </CommandItem>
                            )
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

/* ── PersistentFilterPopover (static options, stays open while selecting) */

function PersistentFilterPopover({
    label,
    options,
    selected,
    onChange,
    open,
    onOpenChange,
}: {
    label: string
    options: { label: string; value: string }[]
    selected: string[]
    onChange: (values: string[] | undefined) => void
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const toggle = (value: string) => {
        const nextSelected = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value]
        onChange(nextSelected.length ? nextSelected : undefined)
    }

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(FILTER_CONTROL_CLASS, 'min-w-[130px] flex-1 justify-between px-3')}
                >
                    <span className="truncate">
                        {selected.length ? `${label} (${selected.length})` : label}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[220px] p-1">
                <div className="max-h-72 overflow-y-auto">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-left text-sm outline-none select-none"
                            onClick={(event) => {
                                event.preventDefault()
                                toggle(opt.value)
                            }}
                        >
                            {selected.includes(opt.value) ? (
                                <span className="absolute start-2 flex size-3.5 items-center justify-center">
                                    <Check className="size-4" />
                                </span>
                            ) : null}
                            {opt.label}
                        </button>
                    ))}
                </div>
                {selected.length ? (
                    <>
                        <div className="bg-border -mx-1 my-1 h-px" />
                        <button
                            type="button"
                            className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-8 w-full items-center rounded-sm px-2 text-left text-sm"
                            onClick={(event) => {
                                event.preventDefault()
                                onChange(undefined)
                            }}
                        >
                            Bỏ chọn tất cả
                        </button>
                    </>
                ) : null}
            </PopoverContent>
        </Popover>
    )
}

/* ── FilterDropdown (static options) ────────────────────────────────── */

function FilterDropdown({
    label,
    options,
    selected,
    onChange,
}: {
    label: string
    options: { label: string; value: string }[]
    selected: string[]
    onChange: (values: string[] | undefined) => void
}) {
    const toggle = (value: string) => {
        const nextSelected = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value]
        onChange(nextSelected.length ? nextSelected : undefined)
    }

    const clear = () => {
        onChange(undefined)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(FILTER_CONTROL_CLASS, 'min-w-[130px] flex-1 justify-between px-3')}
                >
                    <span className="truncate">
                        {selected.length ? `${label} (${selected.length})` : label}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={selected.includes(opt.value)}
                        onCheckedChange={() => toggle(opt.value)}
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length ? <DropdownMenuSeparator /> : null}
                {selected.length ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-8 w-full justify-start px-2 font-normal"
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            clear()
                        }}
                    >
                        Bỏ chọn tất cả
                    </Button>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/* ── SummaryCard ─────────────────────────────────────────────────────── */

const SUMMARY_TONES = {
    info: {
        card: 'border-sky-200 bg-sky-50 text-sky-800',
        iconBg: 'bg-white/75 text-sky-700',
        value: 'text-sky-950',
    },
    primary: {
        card: 'border-blue-200 bg-blue-50 text-blue-800',
        iconBg: 'bg-white/75 text-blue-700',
        value: 'text-blue-950',
    },
    success: {
        card: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        iconBg: 'bg-white/75 text-emerald-700',
        value: 'text-emerald-700',
    },
    warn: {
        card: 'border-amber-200 bg-amber-50 text-amber-800',
        iconBg: 'bg-white/75 text-amber-700',
        value: 'text-amber-700',
    },
    muted: {
        card: 'border-slate-200 bg-slate-50 text-slate-700',
        iconBg: 'bg-white/75 text-slate-600',
        value: 'text-muted-foreground',
    },
} as const

function SummaryCard({
    icon: Icon,
    label,
    value,
    tone = 'muted',
}: {
    icon: LucideIcon
    label: string
    value: string
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]
    return (
        <div className={cn('rounded-lg border p-2.5 shadow-sm', styles.card)}>
            <div className="flex items-center gap-2">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md', styles.iconBg)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div className={cn('mt-1 truncate text-right text-lg font-semibold tabular-nums', styles.value)}>
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── buildSummary ────────────────────────────────────────────────────── */

function buildSummary(data: CustomerVip[]) {
    return data.reduce(
        (acc, row) => {
            acc.count += 1
            acc.totalPoints += Number(row.total_vip_point || 0)
            acc.totalBonus += Number(row.final_bonus_amount || 0)
            if (Number(row.missing_point_to_next || 0) > 0) acc.missingCount += 1
            return acc
        },
        { count: 0, totalPoints: 0, totalBonus: 0, missingCount: 0 }
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0))
}

function formatDisplayDate(value?: string) {
    if (!value) return ''
    const [datePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return year && month && day ? `${day}/${month}/${year}` : value
}

function formatDateRange(fromDate?: string, toDate?: string) {
    if (fromDate && toDate) return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
    if (fromDate) return `từ ${formatDisplayDate(fromDate)}`
    if (toDate) return `đến ${formatDisplayDate(toDate)}`
    return ''
}
