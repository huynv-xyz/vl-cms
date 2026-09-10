import type {
    ColumnDef,
    OnChangeFn,
    PaginationState,
} from "@tanstack/react-table"
import { Database, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { CrudTable } from "@/components/crud/crud-table"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { cn, formatNumber } from "@/lib/utils"

type MasterDataReportTableProps<T> = {
    data: T[]
    columns: ColumnDef<T, unknown>[]
    entityName: string
    summaryLabel: string
    summaryValue?: number
    searchPlaceholder: string
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    icon?: LucideIcon
    filters?: ReactNode
}

export function MasterDataReportTable<T>({
    data,
    columns,
    entityName,
    summaryLabel,
    summaryValue,
    searchPlaceholder,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    icon = Database,
    filters,
}: MasterDataReportTableProps<T>) {
    return (
        <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
                <MetricCard
                    icon={icon}
                    label={summaryLabel}
                    value={formatNumber(summaryValue ?? 0)}
                />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder={searchPlaceholder}
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />
                {filters}
            </div>

            <CrudTable<T>
                data={data}
                columns={columns}
                entityName={entityName}
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

function MetricCard({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon
    label: string
    value: string
}) {
    return (
        <div className={cn("rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-sky-800 shadow-sm")}>
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/75 text-sky-700">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div className="mt-1 truncate text-right text-lg font-semibold tabular-nums text-sky-950">
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}
