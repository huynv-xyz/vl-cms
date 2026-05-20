import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listArLedgers } from '@/api/sale/ar-ledger'
import { ArLedgerTable } from './components/ar-ledger-table'
import { Route } from '@/routes/_authenticated/sales/ar-ledgers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { ImportArLedgerButton } from './components/ar-ledger-import-button'
import { cn, formatCurrency } from '@/lib/utils'
import type React from 'react'
import {
    AlertCircle,
    ArrowDownLeft,
    ArrowUpRight,
    FileText,
    type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ArLedgerPage() {

    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
        singleFilters,
        setSingleFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ['source_type'], // multi
        ['from_date', 'to_date', 'customer_id'] // single
    )

    const sourceType = multiFilters.source_type?.[0] ?? ""

    const { data, isLoading, error } = usePaginatedList(
        [
            'ar-ledgers',
            search.page,
            search.size,
            keyword,
            sourceType,
            singleFilters,
        ],
        listArLedgers,
        {
            page: search.page,
            size: search.size,
            keyword,
            source_type: sourceType,
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: singleFilters.customer_id
                ? Number(singleFilters.customer_id)
                : undefined,

        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Công nợ phải thu"
            data={data}
            actions={<ImportArLedgerButton />}
        >
            {(data) => (
                <div className="space-y-4">
                    <ArLedgerSummary rows={data.items} />

                    <ArLedgerTable
                        data={data.items}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}

                        filters={{
                            ...singleFilters,
                            source_type: multiFilters.source_type,
                            customer_id: singleFilters.customer_id
                                ? Number(singleFilters.customer_id)
                                : undefined,
                        }}

                        onFiltersChange={(f) => {
                            setSingleFilters({
                                ...f,
                                customer_id: f.customer_id?.toString(),
                            })

                            setMultiFilters({
                                source_type: f.source_type,
                            })
                        }}
                    />
                </div>
            )}
        </PageSection>
    )
}

function ArLedgerSummary({ rows }: { rows: any[] }) {
    const debit = rows.reduce((sum, row) => sum + Number(row.debit_amount || 0), 0)
    const credit = rows.reduce((sum, row) => sum + Number(row.credit_amount || 0), 0)
    const net = debit - credit

    return (
        <div className="grid gap-3 md:grid-cols-4">
            <Metric icon={FileText} label="Số dòng đang xem" value={formatNumber(rows.length)} tone="info" />
            <Metric icon={ArrowUpRight} label="Tổng phát sinh Nợ" value={formatCurrency(debit)} tone="bad" />
            <Metric icon={ArrowDownLeft} label="Tổng phát sinh Có" value={formatCurrency(credit)} tone="ok" />
            <Metric
                icon={AlertCircle}
                label={net >= 0 ? "Còn phải thu" : "Thu vượt"}
                value={formatCurrency(Math.abs(net))}
                tone={net >= 0 ? "warn" : "ok"}
            />
        </div>
    )
}

function Metric({
    icon: Icon,
    label,
    value,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]

    return (
        <Card className={cn("gap-0 py-4 shadow-sm transition-shadow hover:shadow-md", styles.ring)}>
            <CardContent className="flex items-center gap-3 px-4">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", styles.iconBg)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate text-[11px] font-semibold uppercase tracking-wider">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-xl font-bold tabular-nums", styles.value)}>
                        {value}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const SUMMARY_TONES = {
    info: {
        ring: "border-blue-200/60 dark:border-blue-900/40",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        value: "",
    },
    bad: {
        ring: "border-rose-200/70 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10",
        iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
        value: "text-rose-600 dark:text-rose-400",
    },
    ok: {
        ring: "border-emerald-200/60 dark:border-emerald-900/40",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        value: "text-emerald-600 dark:text-emerald-400",
    },
    warn: {
        ring: "border-amber-300/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20",
        iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        value: "text-amber-700 dark:text-amber-400",
    },
    muted: {
        ring: "border-border/60",
        iconBg: "bg-muted text-muted-foreground",
        value: "text-muted-foreground",
    },
} as const

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}
