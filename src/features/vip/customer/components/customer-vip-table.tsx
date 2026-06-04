import * as React from 'react'
import type { PaginationState, OnChangeFn } from '@tanstack/react-table'
import { CrudTable } from '@/components/crud/crud-table'
import type { CustomerVip } from '../data/schema'
import { customerVipColumns } from './customer-vip-columns'
import { listCustomerVips, type CustomerVipListParams } from '@/api/customer-vip'
import { SearchOnBlurInput } from '@/components/search-on-blur-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { exportXlsx } from '@/lib/xlsx-export'
import { toast } from 'sonner'
import {
    Download,
    Crown,
    Loader2,
    Users,
    TrendingUp,
    Wallet,
    AlertCircle,
    type LucideIcon,
} from 'lucide-react'

// ── Năm tính động ─────────────────────────────────────────────────────
const currentYear = new Date().getFullYear()
const CALC_YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
    const y = String(currentYear - 2 + i)
    return { label: y, value: y }
})

const TIER_OPTIONS = [
    { label: 'Thành viên 2', value: 'THANH_VIEN_2' },
    { label: 'Thành viên 1', value: 'THANH_VIEN_1' },
    { label: 'Bạc', value: 'BAC' },
    { label: 'Vàng', value: 'VANG' },
    { label: 'Bạch Kim', value: 'BACH_KIM' },
    { label: 'Kim Cương', value: 'KIM_CUONG' },
    { label: 'B_600', value: 'B_600' },
    { label: 'B_700', value: 'B_700' },
]

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

type Filters = {
    regions?: string[]
    tier_codes?: string[]
    group_codes?: string[]
    calc_years?: string[]
    customer_types?: string[]
    customer_codes?: string[]
}

type CustomerVipTableProps = {
    data: CustomerVip[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
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
}: CustomerVipTableProps) {
    const [isExporting, setIsExporting] = React.useState(false)
    const summary = buildSummary(data)
    const setFilter = (key: keyof Filters, value: string[] | undefined) =>
        onFiltersChange({ ...filters, [key]: value })
    const exportFilters = buildExportFilters(keyword, filters)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const rows = await fetchAllCustomerVips(exportFilters)
            if (!rows.length) {
                toast.warning('Không có dữ liệu để xuất')
                return
            }

            exportCustomerVipXlsx(rows)
            toast.success(`Đã xuất ${rows.length} khách hàng VIP`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'Xuất Excel thất bại')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-5">

            {/* ── SUMMARY CARDS ── */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.2_1_0]"
                        className={cn(FILTER_CONTROL_CLASS, 'pl-10')}
                    />
                    <AsyncMultiFilterDropdown
                        className={cn(FILTER_CONTROL_CLASS, 'min-w-[260px] flex-[1.8_1_0]')}
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
                    <FilterDropdown
                        label="Khu vực"
                        options={REGION_OPTIONS}
                        selected={filters.regions ?? []}
                        onChange={(v) => setFilter('regions', v)}
                    />
                    <FilterDropdown
                        label="Hạng VIP"
                        options={TIER_OPTIONS}
                        selected={filters.tier_codes ?? []}
                        onChange={(v) => setFilter('tier_codes', v)}
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
                    <FilterDropdown
                        label="Năm tính"
                        options={CALC_YEAR_OPTIONS}
                        selected={filters.calc_years ?? []}
                        onChange={(v) => setFilter('calc_years', v)}
                    />
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="h-10 min-w-[130px] px-3"
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        Xuất Excel
                    </Button>
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
            />
        </div>
    )
}

/* ── AsyncMultiFilterDropdown ────────────────────────────────────────── */
// Popover + Command có debounce search + multi-select checkbox

type AsyncOption = { value: string; label: string }

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
        const next = selected.includes(value)
            ? selected.filter((v) => v !== value)
            : [...selected, value]
        onChange(next.length ? next : undefined)
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
                {selected.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xóa bộ lọc
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

/* ── SummaryCard ─────────────────────────────────────────────────────── */

const SUMMARY_TONES = {
    info: {
        ring: 'border-blue-200/60 dark:border-blue-900/40',
        iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        value: '',
    },
    primary: {
        ring: 'border-primary/20 bg-primary/[0.02]',
        iconBg: 'bg-primary/10 text-primary',
        value: 'text-primary',
    },
    success: {
        ring: 'border-emerald-200/60 dark:border-emerald-900/40',
        iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        value: '',
    },
    warn: {
        ring: 'border-amber-300/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20',
        iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        value: 'text-amber-700 dark:text-amber-400',
    },
    muted: {
        ring: 'border-border/60',
        iconBg: 'bg-muted text-muted-foreground',
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
        <Card className={cn('gap-0 py-4 shadow-sm transition-shadow hover:shadow-md', styles.ring)}>
            <CardContent className="flex items-center gap-3 px-4">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', styles.iconBg)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                    </div>
                    <div className={cn('mt-1 truncate text-xl font-bold tabular-nums', styles.value)}>
                        {value}
                    </div>
                </div>
            </CardContent>
        </Card>
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

function buildExportFilters(keyword: string, filters: Filters): Omit<CustomerVipListParams, 'page' | 'size'> {
    return {
        keyword: keyword || undefined,
        region: stringifyFilter(filters.regions),
        tier_code: stringifyFilter(filters.tier_codes),
        group_code: stringifyFilter(filters.group_codes),
        calc_year: parseCalcYear(filters.calc_years),
        customer_type: stringifyFilter(filters.customer_types),
        customer_code: stringifyFilter(filters.customer_codes),
    }
}

function stringifyFilter(values?: string[]) {
    return values && values.length > 0 ? values.join(',') : undefined
}

function parseCalcYear(values?: string[]) {
    const value = stringifyFilter(values)
    return value ? Number(value) : undefined
}

async function fetchAllCustomerVips(filters: Omit<CustomerVipListParams, 'page' | 'size'>) {
    const size = 200
    const rows: CustomerVip[] = []
    let page = 1

    for (let guard = 0; guard < 300; guard += 1) {
        const res = await listCustomerVips({
            ...filters,
            page,
            size,
        })
        const items = getItems(res)
        rows.push(...items)
        if (page >= (res.total_page || 1) || items.length === 0) break
        page += 1
    }

    return rows
}

function exportCustomerVipXlsx(rows: CustomerVip[]) {
    const sheetRows: (string | number)[][] = [
        ['DANH SÁCH KHÁCH HÀNG VIP'],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
        [],
        [
            'STT',
            'Năm tính',
            'Mã khách hàng',
            'Tên khách hàng',
            'Loại KH',
            'Khu vực',
            'Nhóm',
            'Tổng điểm VIP',
            'Điểm nhóm chung',
            'Điểm MA VTHH',
            'Điểm mã riêng',
            'Hạng VIP',
            'Hạng kế tiếp',
            'Điểm còn thiếu',
            'Thông báo còn thiếu',
            'Thưởng / điểm',
            'Tổng thưởng',
            'Thưởng riêng',
            'Thưởng cuối',
            'Ghi chú',
        ],
    ]

    rows.forEach((row, index) => {
        sheetRows.push([
            index + 1,
            Number(row.calc_year || 0),
            row.customer_code || '',
            row.customer_name || '',
            row.customer_type || '',
            row.region || '',
            row.group_code || '',
            Number(row.total_vip_point || 0),
            Number(row.common_group_point || 0),
            Number(row.ma_vthh_point || 0),
            Number(row.ma_rieng_point || 0),
            row.tier_name || row.tier_code || '',
            row.next_tier_name || row.next_tier_code || '',
            Number(row.missing_point_to_next || 0),
            row.missing_point_message || '',
            Number(row.reward_amount || 0),
            Number(row.total_reward_amount || 0),
            Number(row.private_bonus_amount || 0),
            Number(row.final_bonus_amount || 0),
            row.note || '',
        ])
    })

    exportXlsx(`khach-hang-vip-${new Date().toISOString().slice(0, 10)}.xlsx`, [
        { name: 'Khách hàng VIP', rows: sheetRows },
    ])
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0))
}
