import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { Route } from "@/routes/_authenticated/vip/customer/$id"
import { getCustomerVipAudit, getCustomerVipDetail } from "@/api/customer-vip"
import { CustomerVipSummary } from "./components/customer-vip-summary"
import { CustomerVipDetailTable } from "./components/customer-vip-detail-table"
import { CustomerVipAuditPanel } from "./components/customer-vip-audit-panel"
import { CustomerVipPlanSheet } from "../components/customer-vip-plan-sheet"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
    Sparkles,
    TrendingUp,
    Award,
    Target,
    Wallet,
    type LucideIcon,
} from "lucide-react"

export default function CustomerVipDetailPage() {
    const { id } = Route.useParams()
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const asOfDate = search.as_of_date
    const fromDate = search.from_date
    const toDate = search.to_date
    const dateRange = {
        from_date: fromDate,
        to_date: toDate,
        as_of_date: asOfDate,
    }
    const [planOpen, setPlanOpen] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ["customer-vip-detail", id, fromDate, toDate, asOfDate],
        queryFn: () => getCustomerVipDetail(id, dateRange),
    })

    const auditQuery = useQuery({
        queryKey: ["customer-vip-audit", id, fromDate, toDate, asOfDate],
        queryFn: () => getCustomerVipAudit(id, dateRange),
    })

    const setDateRange = (next: { from_date?: string; to_date?: string }) => {
        navigate({
            search: (prev) => ({
                ...prev,
                from_date: next.from_date || undefined,
                to_date: next.to_date || undefined,
                as_of_date: undefined,
            }),
            replace: true,
        })
    }

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            data={data}
            title="Chi tiết VIP khách hàng"
            description={data?.customer_name}
            showBack
            actions={
                data ? (
                    <Button type="button" onClick={() => setPlanOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Lập kế hoạch năm nay
                    </Button>
                ) : undefined
            }
        >
            {(detail) => (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background p-3">
                        <div>
                            <div className="text-sm font-semibold">Mốc tạm tính VIP</div>
                            <div className="text-xs text-muted-foreground">
                                {fromDate || toDate
                                    ? `Đang tính theo ngày chứng từ ${formatDateRange(fromDate, toDate)}`
                                    : asOfDate
                                        ? `Đang tính theo ngày chứng từ đến ${formatDisplayDate(asOfDate)}`
                                        : "Đang xem kết quả đã chốt theo năm"}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DatePicker
                                className="min-w-[180px] [&_button]:h-10"
                                value={fromDate}
                                onChange={(value) => setDateRange({ from_date: value, to_date: toDate })}
                                placeholder="Từ ngày CT"
                            />
                            <DatePicker
                                className="min-w-[180px] [&_button]:h-10"
                                value={toDate}
                                onChange={(value) => setDateRange({ from_date: fromDate, to_date: value })}
                                placeholder="Đến ngày CT"
                            />
                        </div>
                    </div>

                    <CustomerVipSummary data={detail} />

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Metric
                            icon={TrendingUp}
                            tone="primary"
                            label="Tổng điểm VIP"
                            value={formatNumber(detail.total_vip_point)}
                            sub="Điểm tích lũy trong năm"
                        />
                        <Metric
                            icon={Wallet}
                            tone="ok"
                            label="Thưởng cuối"
                            value={formatCurrency(Number(detail.final_bonus_amount ?? 0))}
                            sub={`Tổng: ${formatCurrency(Number(detail.total_reward_amount ?? 0))}`}
                        />
                        <Metric
                            icon={Target}
                            tone={Number(detail.missing_point_to_next) > 0 ? "warn" : "ok"}
                            label="Điểm còn thiếu"
                            value={formatNumber(detail.missing_point_to_next)}
                            sub={detail.missing_point_message || undefined}
                        />
                        <Metric
                            icon={Award}
                            tone="info"
                            label="Điểm mã riêng"
                            value={formatNumber(Number(detail.ma_rieng_point ?? 0))}
                            sub={`MA VTHH: ${formatNumber(Number(detail.ma_vthh_point ?? 0))}`}
                        />
                    </div>

                    <CustomerVipDetailTable items={detail.items ?? []} />

                    {auditQuery.isLoading ? (
                        <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                            Đang tải audit điểm VIP...
                        </div>
                    ) : auditQuery.error ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            Không tải được audit: {auditQuery.error instanceof Error ? auditQuery.error.message : "Lỗi không xác định"}
                        </div>
                    ) : auditQuery.data ? (
                        <CustomerVipAuditPanel data={auditQuery.data} />
                    ) : null}

                    <CustomerVipPlanSheet
                        customer={detail}
                        open={planOpen}
                        onOpenChange={setPlanOpen}
                    />
                </div>
            )}
        </PageSection>
    )
}

function formatDisplayDate(value?: string) {
    if (!value) return ""
    const [datePart] = value.split("T")
    const [year, month, day] = datePart.split("-")
    return year && month && day ? `${day}/${month}/${year}` : value
}

function formatDateRange(fromDate?: string, toDate?: string) {
    if (fromDate && toDate) return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
    if (fromDate) return `từ ${formatDisplayDate(fromDate)}`
    if (toDate) return `đến ${formatDisplayDate(toDate)}`
    return ""
}

type Tone = "primary" | "ok" | "warn" | "info" | "muted"

const TONE_TEXT: Record<Tone, string> = {
    primary: "text-foreground",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
    muted: "text-muted-foreground",
}

const TONE_ICON_BG: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary",
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    muted: "bg-muted text-muted-foreground",
}

function Metric({
    icon: Icon,
    label,
    value,
    sub,
    tone = "primary",
}: {
    icon?: LucideIcon
    label: string
    value: ReactNode
    sub?: ReactNode
    tone?: Tone
}) {
    return (
        <div className="group rounded-xl border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                {Icon && (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_ICON_BG[tone]}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>
            <div className={`mt-2 text-xl font-bold tracking-tight tabular-nums ${TONE_TEXT[tone]}`}>
                {value}
            </div>
            {sub && (
                <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
            )}
        </div>
    )
}
