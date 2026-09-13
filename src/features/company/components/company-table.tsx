import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Building2, type LucideIcon } from "lucide-react"

import { CrudTable } from "@/components/crud/crud-table"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { cn, formatNumber } from "@/lib/utils"
import type { Company } from "../data/schema"
import { companyColumns } from "./company-columns"

type CompanySummary = {
    total: number
}

type CompanyTableProps = {
    data: Company[]
    summary?: CompanySummary
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
}

export function CompanyTable({
    data,
    summary,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
}: CompanyTableProps) {
    return (
        <div className="space-y-4">
            <CompanySummaryStrip summary={summary} />

            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm tên công ty, địa chỉ..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.8_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />
            </div>

            <CrudTable<Company>
                data={data}
                columns={companyColumns}
                entityName="công ty"
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

function CompanySummaryStrip({ summary }: { summary?: CompanySummary }) {
    return (
        <div className="grid gap-2 md:grid-cols-3">
            <MetricCard
                icon={Building2}
                label="Tổng công ty"
                value={formatNumber(summary?.total ?? 0)}
                tone="opening"
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
    tone: "opening"
}) {
    const toneClass = {
        opening: {
            card: "border-sky-200 bg-sky-50 text-sky-800",
            icon: "bg-white/75 text-sky-700",
            value: "text-sky-950",
        },
    }[tone]

    return (
        <div className={cn("rounded-lg border p-2.5 shadow-sm", toneClass.card)}>
            <div className="flex items-center gap-2">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-center text-[11px] font-semibold uppercase leading-tight tracking-wide">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-right text-lg font-semibold tabular-nums", toneClass.value)}>
                        {value}
                    </div>
                </div>
            </div>
        </div>
    )
}
