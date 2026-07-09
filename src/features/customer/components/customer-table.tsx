import type { OnChangeFn, PaginationState } from '@tanstack/react-table'
import { Building2, CheckCircle2, UserRound, Users, type LucideIcon } from 'lucide-react'

import { CrudTable } from '@/components/crud/crud-table'
import { SearchOnBlurInput } from '@/components/search-on-blur-input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn, formatNumber } from '@/lib/utils'
import type { Customer } from '../data/schema'
import { customerColumns } from './customer-columns'

type CustomerFilters = {
    type?: string
    region?: string
    status?: string
}

export type CustomerSummary = {
    total: number
    active: number
    b2b: number
    b2c: number
}

type CustomerTableProps = {
    data: Customer[]
    summary?: CustomerSummary
    isSummaryLoading?: boolean
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: CustomerFilters
    onFiltersChange: (filters: CustomerFilters) => void
}

export function CustomerTable({
    data,
    summary,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: CustomerTableProps) {
    return (
        <div className="space-y-4">
            <CustomerSummaryStrip summary={summary} />

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm mã, tên, địa chỉ..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            type: value === 'all' ? undefined : value,
                        })
                    }
                >
                    <SelectTrigger className={filterControlClass('min-w-[160px] flex-1')}>
                        <SelectValue placeholder="Loại khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả loại</SelectItem>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.region || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            region: value === 'all' ? undefined : value,
                        })
                    }
                >
                    <SelectTrigger className={filterControlClass('min-w-[150px] flex-1')}>
                        <SelectValue placeholder="Khu vực" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả khu vực</SelectItem>
                        <SelectItem value="MB">Miền Bắc</SelectItem>
                        <SelectItem value="MN">Miền Nam</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            status: value === 'all' ? undefined : value,
                        })
                    }
                >
                    <SelectTrigger className={filterControlClass('min-w-[150px] flex-1')}>
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="1">Hoạt động</SelectItem>
                        <SelectItem value="0">Ngừng</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <CrudTable<Customer>
                data={data}
                columns={customerColumns}
                entityName="khách hàng"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
                enableColumnResize
                enableStickyHorizontalScroll
                headerVariant="report"
                footer={false}
            />
        </div>
    )
}

function CustomerSummaryStrip({
    summary,
}: {
    summary?: CustomerSummary
}) {
    return (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
                icon={Users}
                label="Tổng khách hàng"
                value={formatNumber(summary?.total ?? 0)}
                tone="opening"
            />
            <MetricCard
                icon={CheckCircle2}
                label="Đang hoạt động"
                value={formatNumber(summary?.active ?? 0)}
                tone="credit"
            />
            <MetricCard
                icon={Building2}
                label="Khách B2B"
                value={formatNumber(summary?.b2b ?? 0)}
                tone="closing"
            />
            <MetricCard
                icon={UserRound}
                label="Khách B2C"
                value={formatNumber(summary?.b2c ?? 0)}
                tone="neutral"
            />
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: string
    tone: 'opening' | 'credit' | 'closing' | 'neutral'
}) {
    const toneClass = {
        opening: {
            card: 'border-sky-200 bg-sky-50 text-sky-800',
            icon: 'bg-white/75 text-sky-700',
            value: 'text-sky-950',
        },
        credit: {
            card: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            icon: 'bg-white/75 text-emerald-700',
            value: 'text-emerald-700',
        },
        closing: {
            card: 'border-blue-200 bg-blue-50 text-blue-800',
            icon: 'bg-white/75 text-blue-700',
            value: 'text-blue-950',
        },
        neutral: {
            card: 'border-amber-200 bg-amber-50 text-amber-800',
            icon: 'bg-white/75 text-amber-700',
            value: 'text-amber-700',
        },
    }[tone]

    return (
        <div className={cn('rounded-lg border p-2.5 shadow-sm', toneClass.card)}>
            <div className="flex items-center gap-2">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md', toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div className={cn('mt-1 truncate text-right text-lg font-semibold tabular-nums', toneClass.value)}>
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}

function filterControlClass(className?: string) {
    return `h-10 rounded-md border-slate-300 bg-white shadow-xs ${className ?? ''}`
}
