import { useQuery } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { Route } from "@/routes/_authenticated/vip/customer/$id"
import { getCustomerVipDetail } from "@/api/customer-vip"
import { CustomerVipSummary } from "./components/customer-vip-summary"
import { CustomerVipDetailTable } from "./components/customer-vip-detail-table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
    TrendingUp,
    Award,
    Target,
    Wallet,
    type LucideIcon,
} from "lucide-react"
import type React from "react"

export default function CustomerVipDetailPage() {
    const { id } = Route.useParams()

    const { data, isLoading, error } = useQuery({
        queryKey: ["customer-vip-detail", id],
        queryFn: () => getCustomerVipDetail(id),
    })

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            data={data}
            title="Chi tiết VIP khách hàng"
            description={data?.customer_name}
            showBack
        >
            {(detail) => (
                <div className="space-y-6">

                    {/* ── HEADER INFO ── */}
                    <CustomerVipSummary data={detail} />

                    {/* ── KPI METRICS ── */}
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
                            label="Thưởng riêng"
                            value={formatCurrency(Number(detail.private_bonus_amount ?? 0))}
                            sub={`Thưởng/điểm: ${formatCurrency(Number(detail.reward_amount ?? 0))}`}
                        />
                    </div>

                    {/* ── DETAIL TABLE ── */}
                    <CustomerVipDetailTable items={detail.items ?? []} />

                </div>
            )}
        </PageSection>
    )
}

/* ── Metric card (same pattern as order detail) ─────────────────────── */

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
    value: React.ReactNode
    sub?: React.ReactNode
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
