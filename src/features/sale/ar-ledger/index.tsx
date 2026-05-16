import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listArLedgers } from '@/api/sale/ar-ledger'
import { ArLedgerTable } from './components/ar-ledger-table'
import { Route } from '@/routes/_authenticated/sales/ar-ledgers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { ImportArLedgerButton } from './components/ar-ledger-import-button'
import { formatCurrency } from '@/lib/utils'
import type React from 'react'

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
            <Metric label="Số dòng đang xem" value={formatNumber(rows.length)} />
            <Metric label="Tổng phát sinh Nợ" value={formatCurrency(debit)} tone="bad" />
            <Metric label="Tổng phát sinh Có" value={formatCurrency(credit)} tone="ok" />
            <Metric
                label={net >= 0 ? "Còn phải thu" : "Thu vượt"}
                value={formatCurrency(Math.abs(net))}
                tone={net >= 0 ? "warn" : "ok"}
            />
        </div>
    )
}

function Metric({
    label,
    value,
    tone,
}: {
    label: string
    value: React.ReactNode
    tone?: "ok" | "warn" | "bad"
}) {
    const valueClass =
        tone === "ok"
            ? "text-emerald-600"
            : tone === "warn"
                ? "text-amber-600"
                : tone === "bad"
                    ? "text-rose-600"
                    : ""

    return (
        <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`mt-1 font-semibold ${valueClass}`}>{value}</div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}
