import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { listCustomerVips, getCustomerVipPlan, saveCustomerVipPlan } from "@/api/customer-vip"
import type { CustomerVip, CustomerVipPlanItem } from "@/features/vip/customer/data/schema"
import { Route } from "@/routes/_authenticated/vip/customer-plan"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Loader2, Save, Wand2 } from "lucide-react"
import { toast } from "sonner"

export default function VipCustomerPlanPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()
    const customerId = cleanId(search.customer_id)
    const dateRange = React.useMemo(() => ({
        from_date: search.from_date,
        to_date: search.to_date,
    }), [search.from_date, search.to_date])

    const planQuery = useQuery({
        queryKey: ["customer-vip-plan-page", customerId, search.from_date, search.to_date],
        queryFn: () => getCustomerVipPlan(customerId!, dateRange),
        enabled: !!customerId,
    })

    const [targetTierCode, setTargetTierCode] = React.useState("")
    const [items, setItems] = React.useState<CustomerVipPlanItem[]>([])

    React.useEffect(() => {
        if (!planQuery.data) {
            setTargetTierCode("")
            setItems([])
            return
        }
        setTargetTierCode(planQuery.data.target_tier_code ?? "")
        setItems(planQuery.data.items ?? [])
    }, [planQuery.data])

    const data = planQuery.data
    const selectedTier = data?.available_tiers?.find((tier) => tier.code === targetTierCode)
    const targetPoint = Number(selectedTier?.point ?? data?.target_point ?? 0)
    const currentPoint = Number(data?.total_vip_point ?? 0)
    const plannedPoint = sum(items.map((item) => item.projected_point))
    const projectedTotalPoint = currentPoint + plannedPoint
    const missingToTarget = Math.max(0, targetPoint - projectedTotalPoint)

    const saveMutation = useMutation({
        mutationFn: () => {
            if (!customerId || !targetTierCode) throw new Error("Vui lòng chọn khách hàng và hạng mục tiêu")
            return saveCustomerVipPlan(customerId, {
                target_tier_code: targetTierCode,
                target_tier_name: selectedTier?.name,
                from_date: search.from_date,
                to_date: search.to_date,
                items: items.map((item) => ({
                    group_code: item.group_code,
                    product_group: item.product_group,
                    unit: item.unit,
                    planned_qty: Number(item.planned_qty || 0),
                    projected_point: Number(item.projected_point || 0),
                    priority: item.priority,
                })),
            })
        },
        onSuccess: (next) => {
            setTargetTierCode(next.target_tier_code ?? "")
            setItems(next.items ?? [])
            queryClient.invalidateQueries({ queryKey: ["customer-vip-plan-page"] })
            queryClient.invalidateQueries({ queryKey: ["customer-vip-plan"] })
            queryClient.invalidateQueries({ queryKey: ["customer-vip"] })
            toast.success("Đã lưu kế hoạch VIP")
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Lưu kế hoạch VIP thất bại")
        },
    })

    const updateSearch = (next: Partial<{ customer_id: string; from_date: string; to_date: string }>) => {
        navigate({
            search: (prev) => ({
                ...prev,
                ...next,
            }),
            replace: true,
        })
    }

    const updatePlannedQty = (index: number, value: string) => {
        const qty = Number(value || 0)
        setItems((prev) => prev.map((item, i) => {
            if (i !== index) return item
            const projectedPoint = qty * Number(item.point_factor || 0)
            return {
                ...item,
                planned_qty: qty,
                projected_point: round2(projectedPoint),
                total_point_after_plan: round2(Number(item.achieved_point || 0) + projectedPoint),
            }
        }))
    }

    const autoAllocate = () => {
        if (!targetPoint || targetPoint <= currentPoint) {
            toast.info("Khách hàng đã đủ điểm mục tiêu")
            return
        }
        let remainingPoint = targetPoint - currentPoint
        const sorted = [...items]
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => Number(item.point_factor || 0) > 0)
            .sort((a, b) => Number(b.item.point_factor || 0) - Number(a.item.point_factor || 0))

        if (!sorted.length) {
            toast.warning("Chưa có nhóm hàng có hệ số để tự phân bổ")
            return
        }

        const next = items.map((item) => ({ ...item, planned_qty: 0, projected_point: 0, total_point_after_plan: Number(item.achieved_point || 0) }))
        for (const { item, index } of sorted) {
            if (remainingPoint <= 0) break
            const factor = Number(item.point_factor || 0)
            const qty = round2(remainingPoint / factor)
            next[index] = {
                ...next[index],
                planned_qty: qty,
                projected_point: round2(qty * factor),
                total_point_after_plan: round2(Number(item.achieved_point || 0) + qty * factor),
            }
            remainingPoint -= qty * factor
        }
        setItems(next)
        toast.success("Đã tự phân bổ theo nhóm có hệ số cao nhất")
    }

    return (
        <PageSection
            title="Kế hoạch VIP khách hàng"
            description="Xem điểm/hạng hiện tại và lập kế hoạch số lượng dự kiến để đạt hạng mục tiêu năm nay."
            isLoading={false}
            error={null}
            data
        >
            {() => (
                <div className="space-y-4">
                    <div className="grid gap-3 rounded-md border bg-background p-3 shadow-sm lg:grid-cols-[minmax(340px,1fr)_180px_180px_auto]">
                        <div>
                            <div className="mb-1 text-sm font-semibold">Chọn khách hàng</div>
                            <AsyncSelect
                                value={customerId}
                                onChange={(value: string | undefined) => updateSearch({ customer_id: value, from_date: search.from_date, to_date: search.to_date })}
                                dataSource={{
                                    getList: (params: any) => listCustomerVips({ page: 1, size: 30, keyword: params.keyword }),
                                }}
                                mapOption={(x: CustomerVip) => ({
                                    value: String(x.id),
                                    label: `${x.customer_code} - ${x.customer_name}`,
                                    raw: x,
                                })}
                                placeholder="Chọn khách hàng VIP"
                                searchPlaceholder="Tìm mã hoặc tên khách hàng..."
                                emptyText="Không có khách hàng VIP"
                                required
                                className="h-10"
                            />
                        </div>
                        <div>
                            <div className="mb-1 text-sm font-semibold">Từ ngày</div>
                            <DatePicker
                                className="[&_button]:h-10"
                                value={search.from_date}
                                onChange={(value) => updateSearch({ from_date: value || undefined })}
                                placeholder="Từ ngày CT"
                            />
                        </div>
                        <div>
                            <div className="mb-1 text-sm font-semibold">Đến ngày</div>
                            <DatePicker
                                className="[&_button]:h-10"
                                value={search.to_date}
                                onChange={(value) => updateSearch({ to_date: value || undefined })}
                                placeholder="Đến ngày CT"
                            />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="button" variant="outline" onClick={autoAllocate} disabled={!data}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Tự phân bổ
                            </Button>
                            <Button type="button" onClick={() => saveMutation.mutate()} disabled={!data || !targetTierCode || saveMutation.isPending}>
                                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Lưu
                            </Button>
                        </div>
                    </div>

                    {!customerId ? (
                        <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
                            Chọn khách hàng để lập kế hoạch VIP.
                        </div>
                    ) : planQuery.isLoading ? (
                        <div className="flex h-56 items-center justify-center rounded-md border text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải kế hoạch VIP...
                        </div>
                    ) : planQuery.error ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            {planQuery.error instanceof Error ? planQuery.error.message : "Không tải được kế hoạch VIP"}
                        </div>
                    ) : data ? (
                        <PlanBoard
                            data={data}
                            items={items}
                            targetTierCode={targetTierCode}
                            setTargetTierCode={setTargetTierCode}
                            targetPoint={targetPoint}
                            currentPoint={currentPoint}
                            projectedTotalPoint={projectedTotalPoint}
                            missingToTarget={missingToTarget}
                            plannedPoint={plannedPoint}
                            updatePlannedQty={updatePlannedQty}
                            autoAllocate={autoAllocate}
                        />
                    ) : null}
                </div>
            )}
        </PageSection>
    )
}

function PlanBoard({
    data,
    items,
    targetTierCode,
    setTargetTierCode,
    targetPoint,
    currentPoint,
    projectedTotalPoint,
    missingToTarget,
    plannedPoint,
    updatePlannedQty,
    autoAllocate,
}: {
    data: NonNullable<Awaited<ReturnType<typeof getCustomerVipPlan>>>
    items: CustomerVipPlanItem[]
    targetTierCode: string
    setTargetTierCode: (value: string) => void
    targetPoint: number
    currentPoint: number
    projectedTotalPoint: number
    missingToTarget: number
    plannedPoint: number
    updatePlannedQty: (index: number, value: string) => void
    autoAllocate: () => void
}) {
    const progressPct = targetPoint > 0 ? Math.min(100, Math.round((projectedTotalPoint / targetPoint) * 100)) : 0
    const currentPct = targetPoint > 0 ? Math.min(100, Math.round((currentPoint / targetPoint) * 100)) : 0
    const achievedPoint = sum(items.map((item) => item.achieved_point))
    const achievedQty = sum(items.map((item) => item.achieved_qty))
    const plannedQty = sum(items.map((item) => item.planned_qty))

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-md border bg-background shadow-sm">
                <div className="border-b bg-muted/30 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-lg font-semibold">{data.customer_name}</h2>
                                <Badge variant="outline" className="font-mono">{data.customer_code}</Badge>
                                {data.group_code && <Badge variant="secondary">{data.group_code}</Badge>}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                Dữ liệu tính đến {formatDisplayDate(data.to_date || data.as_of_date)} · Năm {data.calc_year}
                            </div>
                        </div>

                        <div className="min-w-[260px]">
                            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Hạng mục tiêu năm nay</div>
                            <Select value={targetTierCode} onValueChange={setTargetTierCode}>
                                <SelectTrigger className="h-10 w-full bg-background">
                                    <SelectValue placeholder="Chọn hạng mục tiêu" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.available_tiers.map((tier) => (
                                        <SelectItem key={tier.code} value={tier.code}>
                                            {tier.name} - {formatNumber(tier.point)} điểm
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid border-b md:grid-cols-2 xl:grid-cols-6">
                    <PlanMetric label="Bậc hiện tại" value={data.tier_name || "Chưa đủ VIP"} />
                    <PlanMetric label="Điểm hiện tại" value={formatNumber(currentPoint)} strong />
                    <PlanMetric label="Hạng kế tiếp" value={data.next_tier_name || "Cao nhất"} />
                    <PlanMetric label="Thiếu lên hạng kế tiếp" value={formatNumber(Number(data.missing_point_to_next || 0))} tone="warn" />
                    <PlanMetric label="Điểm mục tiêu năm" value={formatNumber(targetPoint)} />
                    <PlanMetric label="Thiếu so với mục tiêu" value={missingToTarget > 0 ? formatNumber(missingToTarget) : "Đạt"} tone={missingToTarget > 0 ? "danger" : "success"} />
                </div>

                <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold">Tiến độ sau kế hoạch</div>
                            <div className="text-sm font-semibold tabular-nums">{progressPct}%</div>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-slate-400" style={{ width: `${currentPct}%` }} />
                            <div className="-mt-3 h-full bg-emerald-500/80" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Hiện tại: {formatNumber(currentPoint)}</span>
                            <span>Dự kiến thêm: {formatNumber(plannedPoint)}</span>
                            <span>Tổng dự kiến: {formatNumber(projectedTotalPoint)}</span>
                        </div>
                    </div>
                    <div className={cn(
                        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                        missingToTarget > 0 ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900",
                    )}>
                        {missingToTarget > 0 ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                        <div>
                            <div className="font-semibold">{missingToTarget > 0 ? "Chưa đạt mục tiêu" : "Đạt mục tiêu"}</div>
                            <div>{missingToTarget > 0 ? `Còn thiếu ${formatNumber(missingToTarget)} điểm.` : "Tổng điểm dự kiến đã đủ hạng mục tiêu."}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-md border bg-background shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                    <div>
                        <div className="font-semibold">Phân bổ nhóm hàng</div>
                        <div className="text-xs text-muted-foreground">Nhập số lượng dự kiến thêm hoặc dùng tự phân bổ để đạt hạng mục tiêu.</div>
                    </div>
                    <Button type="button" variant="outline" onClick={autoAllocate}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Tự phân bổ
                    </Button>
                </div>
                <div className="overflow-x-auto">
                <Table className="min-w-[1180px]">
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <PlanHead className="w-14 text-center">STT</PlanHead>
                            <PlanHead className="min-w-[150px]">Mã chung</PlanHead>
                            <PlanHead className="min-w-[280px]">Nhóm hàng hóa</PlanHead>
                            <PlanHead className="w-20 text-center">ĐVT</PlanHead>
                            <PlanHead className="w-[150px] text-right">SL đạt</PlanHead>
                            <PlanHead className="w-24 text-right">Hệ số</PlanHead>
                            <PlanHead className="w-[150px] text-right">Điểm đạt</PlanHead>
                            <PlanHead className="w-[160px] text-right">SL dự kiến thêm</PlanHead>
                            <PlanHead className="w-[160px] text-right">Điểm dự kiến</PlanHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={`${item.group_code}-${index}`} className="hover:bg-muted/30">
                                <PlanCell className="text-center text-muted-foreground">{index + 1}</PlanCell>
                                <PlanCell className="font-mono font-medium">{item.group_code}</PlanCell>
                                <PlanCell>{item.product_group || "-"}</PlanCell>
                                <PlanCell className="text-center text-muted-foreground">{item.unit || "-"}</PlanCell>
                                <PlanCell className="text-right tabular-nums">{formatNumberOrDash(item.achieved_qty)}</PlanCell>
                                <PlanCell className="text-right tabular-nums">{formatNumber(item.point_factor)}</PlanCell>
                                <PlanCell className="text-right tabular-nums">{formatNumberOrDash(item.achieved_point)}</PlanCell>
                                <PlanCell className="bg-muted/20 p-1">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={item.planned_qty ?? 0}
                                        onChange={(event) => updatePlannedQty(index, event.target.value)}
                                        className="h-8 bg-background text-right font-semibold tabular-nums"
                                    />
                                </PlanCell>
                                <PlanCell className="text-right font-semibold tabular-nums text-primary">
                                    {formatNumberOrDash(item.projected_point)}
                                </PlanCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <PlanCell colSpan={4} className="text-right font-bold">Tổng</PlanCell>
                            <PlanCell className="text-right font-bold">{formatNumberOrDash(achievedQty)}</PlanCell>
                            <PlanCell />
                            <PlanCell className="text-right font-bold">{formatNumber(achievedPoint)}</PlanCell>
                            <PlanCell className="text-right font-bold">{formatNumberOrDash(plannedQty)}</PlanCell>
                            <PlanCell className="text-right font-bold text-primary">{formatNumberOrDash(plannedPoint)}</PlanCell>
                        </TableRow>
                    </TableFooter>
                </Table>
                </div>
            </div>
        </div>
    )
}

function PlanMetric({
    label,
    value,
    strong,
    tone,
}: {
    label: string
    value: React.ReactNode
    strong?: boolean
    tone?: "warn" | "danger" | "success"
}) {
    return (
        <div className="border-r px-4 py-3 last:border-r-0">
            <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
            <div className={cn(
                "mt-1 truncate text-base font-semibold tabular-nums",
                strong && "text-primary",
                tone === "warn" && "text-amber-600",
                tone === "danger" && "text-red-600",
                tone === "success" && "text-emerald-600",
            )}>
                {value}
            </div>
        </div>
    )
}

function PlanHead({ className, ...props }: React.ComponentProps<typeof TableHead>) {
    return (
        <TableHead
            className={cn("h-10 border-b px-3 py-2 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
            {...props}
        />
    )
}

function PlanCell({ className, ...props }: React.ComponentProps<typeof TableCell>) {
    return (
        <TableCell
            className={cn("h-10 border-b px-3 py-2 align-middle", className)}
            {...props}
        />
    )
}

function sum(values: Array<number | null | undefined>) {
    return round2(values.reduce<number>((total, value) => total + Number(value || 0), 0))
}

function round2(value: number) {
    return Math.round(value * 100) / 100
}

function formatNumber(value: number | null | undefined) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(value || 0))
}

function formatNumberOrDash(value: number | null | undefined) {
    const numeric = Number(value || 0)
    return numeric === 0 ? "-" : formatNumber(numeric)
}

function formatDisplayDate(value?: string | null) {
    if (!value) return ""
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length !== 3) return value
    return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function cleanId(value?: string) {
    return value?.replace(/^"+|"+$/g, "")
}
