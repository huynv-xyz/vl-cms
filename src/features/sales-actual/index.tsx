import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listSalesActuals, syncSalesActualsFromTransactions } from '@/api/sales-actual'
import { SalesActualTable } from './components/sales-actual-table'
import { SalesActualsProvider } from './components/sales-actuals-provider'
import { Route } from '@/routes/_authenticated/salary/sales-actuals'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import type { SalesActualItem } from './data/schema'
import { type ReactNode, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SalaryPeriodStepper, currentSalaryPeriod } from '@/components/salary/period-stepper'
import { AlertTriangle, CalendarDays, PlayCircle, Target, TrendingUp, UsersRound } from 'lucide-react'

function parseOptionalNumber(value?: string) {
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
}

function currentMonth() {
    return currentSalaryPeriod()
}

function compactPeriod(value: string) {
    return value.trim().replace('-', '')
}

function displayPeriod(value?: string | number) {
    if (value == null || value === '') return ''
    const raw = String(value)
    if (/^\d{6}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4)}`
    return raw
}

function isValidPeriod(value: string) {
    return value === '' || /^\d{4}-(0[1-9]|1[0-2])$/.test(value) || /^\d{6}$/.test(value)
}

function fmt(value: number) {
    return value.toLocaleString('vi-VN')
}

function sumTarget(item: SalesActualItem) {
    return item.target_gtqd_month ?? 0
}

function sumActual(item: SalesActualItem) {
    return item.actual_gtqd ?? 0
}

function SummaryTile({
    label,
    value,
    icon,
    tone = 'default',
}: {
    label: string
    value: string
    icon: ReactNode
    tone?: 'default' | 'warning'
}) {
    return (
        <div className="min-w-[150px] border-l px-4 py-1 first:border-l-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                <span className={tone === 'warning' ? 'text-amber-600' : undefined}>{icon}</span>
                {label}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums">{value}</div>
        </div>
    )
}

export default function SalesActualPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const qc = useQueryClient()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const {
        keyword,
        setKeyword,
        getSingle,
        setSingle,
        requestFilters,
    } = useUrlListFilters(search, navigate, [], ['employeeId', 'period'])

    const selectedPeriod = getSingle('period') || ''
    const [periodDraft, setPeriodDraft] = useState(displayPeriod(selectedPeriod))
    const period = selectedPeriod ? Number(compactPeriod(selectedPeriod)) : undefined
    const employeeId = parseOptionalNumber(requestFilters.employeeId)

    const { data, isLoading, error } = usePaginatedList(
        ['sales-actual', search.page, search.size, keyword, period, employeeId],
        listSalesActuals,
        {
            page: search.page,
            size: search.size,
            keyword,
            period,
            employeeId,
        },
    )

    const items = data?.items ?? []
    const totalActual = items.reduce((sum, item) => sum + sumActual(item), 0)
    const totalTarget = items.reduce((sum, item) => sum + sumTarget(item), 0)
    const employeeCount = new Set(items.map((item) => item.actual?.employee_id).filter(Boolean)).size
    const missingTargetCount = items.filter((item) => !item.target).length
    const completionRate = totalTarget > 0 ? `${((totalActual / totalTarget) * 100).toFixed(1)}%` : '-'

    const syncMutation = useMutation({
        mutationFn: () => {
            const nextPeriod = periodDraft.trim() || currentMonth()
            if (!isValidPeriod(nextPeriod) || !nextPeriod) {
                throw new Error('Kỳ không hợp lệ. Định dạng YYYY-MM')
            }
            return syncSalesActualsFromTransactions(compactPeriod(nextPeriod))
        },
        onSuccess: (res) => {
            const normalized = res.period
            setPeriodDraft(displayPeriod(normalized))
            setSingle('period', normalized)
            qc.invalidateQueries({ queryKey: ['sales-actual'] })
            if (res.source_rows === 0) {
                toast.warning(`Chưa có giao dịch bán hàng trong sales_transactions cho kỳ ${displayPeriod(normalized)}`)
                return
            }
            const missingText = res.missing_employees > 0 ? `, ${res.missing_employees} giao dịch chưa map được nhân viên` : ''
            toast.success(`Đã đồng bộ ${res.inserted} dòng từ ${res.source_rows} giao dịch kỳ ${displayPeriod(normalized)}${missingText}`)
        },
        onError: (e: Error) => toast.error(e.message),
    })

    useEffect(() => {
        setPeriodDraft(displayPeriod(selectedPeriod))
    }, [selectedPeriod])

    const commitPeriodFilter = (value = periodDraft) => {
        const nextPeriod = value.trim()
        if (!isValidPeriod(nextPeriod)) return

        const normalized = nextPeriod ? compactPeriod(nextPeriod) : undefined
        if ((normalized ?? '') === selectedPeriod) return
        setSingle('period', normalized)
    }

    return (
        <SalesActualsProvider>
            <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Doanh số thực hiện</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Đối chiếu số thực đạt theo tháng với chỉ tiêu năm để tính lương, quỹ vùng và thưởng vượt.
                        </p>
                    </div>
                    <Badge variant="secondary">Dữ liệu đọc từ sales_actuals</Badge>
                </div>

                <div className="rounded-md border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <SalaryPeriodStepper
                                className="h-14 w-80"
                                value={periodDraft}
                                onChange={setPeriodDraft}
                                onCommit={commitPeriodFilter}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const month = currentMonth()
                                    setPeriodDraft(month)
                                    setSingle('period', compactPeriod(month))
                                }}
                            >
                                Tháng hiện tại
                            </Button>
                            <Button
                                className={!selectedPeriod ? 'hidden' : undefined}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setPeriodDraft('')
                                    setSingle('period', undefined)
                                }}
                            >
                                Bỏ lọc kỳ
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                            >
                                <PlayCircle className="mr-2 h-4 w-4" />
                                {syncMutation.isPending ? 'Đang đồng bộ...' : 'Đồng bộ từ giao dịch'}
                            </Button>
                        </div>
                        <Badge variant="secondary">Kỳ {displayPeriod(selectedPeriod) || 'tất cả'}</Badge>
                    </div>

                    <div className="flex flex-wrap divide-x-0 px-1 py-3">
                        <SummaryTile icon={<Target className="h-4 w-4" />} label="Dòng" value={String(data?.total ?? 0)} />
                        <SummaryTile icon={<UsersRound className="h-4 w-4" />} label="Nhân viên" value={String(employeeCount)} />
                        <SummaryTile icon={<TrendingUp className="h-4 w-4" />} label="GTQD TH" value={fmt(totalActual)} />
                        <SummaryTile icon={<CalendarDays className="h-4 w-4" />} label="% HT" value={completionRate} />
                        <SummaryTile
                            icon={<AlertTriangle className="h-4 w-4" />}
                            label="Thiếu CT"
                            value={String(missingTargetCount)}
                            tone={missingTargetCount > 0 ? 'warning' : 'default'}
                        />
                    </div>
                </div>

                {error ? (
                    <div className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">
                        Lỗi tải dữ liệu doanh số thực hiện.
                    </div>
                ) : (
                    <div>
                        <SalesActualTable
                            data={items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data?.total_page ?? 0}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>
        </SalesActualsProvider>
    )
}
