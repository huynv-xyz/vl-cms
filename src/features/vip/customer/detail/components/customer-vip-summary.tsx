import type { CustomerVipDetail } from "@/features/vip/customer/data/schema"
import { formatNumber } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    Crown,
    CalendarDays,
    MapPin,
    ArrowRight,
    Target,
    Users,
    Tag,
} from "lucide-react"
import type React from "react"

type Props = {
    data: CustomerVipDetail
}

export function CustomerVipSummary({ data }: Props) {
    return (
        <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-background to-muted/30 shadow-sm">
            {/* ── TOP STRIP ── */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-background/60 px-5 py-4 backdrop-blur">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                        <Crown className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-2xl font-bold tracking-tight">
                                {data.customer_name}
                            </h2>
                            <Badge variant="outline" className="font-mono text-xs">
                                {data.customer_code}
                            </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {data.customer_type && (
                                <span className="inline-flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {data.customer_type}
                                </span>
                            )}
                            {data.region && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {data.region}
                                </span>
                            )}
                            {data.group_code && (
                                <span className="inline-flex items-center gap-1">
                                    <Tag className="h-3.5 w-3.5" />
                                    {data.group_code}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Năm {data.calc_year}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tier badge (top-right) */}
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-sm font-semibold text-amber-700">
                    <Crown className="h-4 w-4" />
                    <span>{data.tier_name || "—"}</span>
                    {data.next_tier_name && (
                        <>
                            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                            <span className="text-xs font-normal opacity-70">{data.next_tier_name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* ── INFO GRID ── */}
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                    icon={<Crown className="h-4 w-4" />}
                    label="Hạng hiện tại"
                    value={data.tier_name || "—"}
                />
                <InfoCard
                    icon={<ArrowRight className="h-4 w-4" />}
                    label="Hạng kế tiếp"
                    value={data.next_tier_name || "Đã đạt cao nhất"}
                    sub={data.missing_point_message || undefined}
                />
                <InfoCard
                    icon={<Target className="h-4 w-4" />}
                    label="Điểm còn thiếu"
                    value={
                        <span className={Number(data.missing_point_to_next) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                            {formatNumber(data.missing_point_to_next)}
                        </span>
                    }
                />
                <InfoCard
                    icon={<Users className="h-4 w-4" />}
                    label="Nhóm / Vùng"
                    value={data.group_code || "—"}
                    sub={data.region || undefined}
                />
            </div>
        </div>
    )
}

function InfoCard({
    icon,
    label,
    value,
    sub,
}: {
    icon?: React.ReactNode
    label: string
    value: React.ReactNode
    sub?: string
}) {
    return (
        <div className="rounded-lg border bg-background/80 px-3.5 py-2.5 transition-colors hover:bg-background">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {icon}
                {label}
            </div>
            <div className="mt-1 min-h-[1.25rem] truncate text-sm font-semibold">{value}</div>
            {sub && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>
            )}
        </div>
    )
}
