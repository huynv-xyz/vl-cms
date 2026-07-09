import type { OnChangeFn, PaginationState } from '@tanstack/react-table'
import { CheckCircle2, UserRoundX, Users, type LucideIcon } from 'lucide-react'

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
import type { Employee } from '../data/schema'
import { employeeColumns } from './employee-columns'

type EmployeeFilters = {
    status?: string
}

type EmployeeSummary = {
    total: number
    active: number
    inactive: number
}

type EmployeeTableProps = {
    data: Employee[]
    summary?: EmployeeSummary
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: EmployeeFilters
    onFiltersChange: (filters: EmployeeFilters) => void
}

export function EmployeeTable({
    data,
    summary,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: EmployeeTableProps) {
    return (
        <div className="space-y-4">
            <EmployeeSummaryStrip summary={summary} />

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm mã, tên, CCCD, địa chỉ..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

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
                        <SelectItem value="1">Còn làm</SelectItem>
                        <SelectItem value="0">Đã nghỉ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <CrudTable<Employee>
                data={data}
                columns={employeeColumns}
                entityName="nhân viên"
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

function EmployeeSummaryStrip({ summary }: { summary?: EmployeeSummary }) {
    return (
        <div className="grid gap-2 md:grid-cols-3">
            <MetricCard
                icon={Users}
                label="Tổng nhân viên"
                value={formatNumber(summary?.total ?? 0)}
                tone="opening"
            />
            <MetricCard
                icon={CheckCircle2}
                label="Còn làm"
                value={formatNumber(summary?.active ?? 0)}
                tone="credit"
            />
            <MetricCard
                icon={UserRoundX}
                label="Đã nghỉ"
                value={formatNumber(summary?.inactive ?? 0)}
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
    tone: 'opening' | 'credit' | 'neutral'
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
