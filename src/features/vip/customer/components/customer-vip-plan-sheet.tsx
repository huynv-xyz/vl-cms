import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    getCustomerVipPlan,
    saveCustomerVipPlan,
    type CustomerVipDateRangeParams,
} from '@/api/customer-vip'
import type { CustomerVip, CustomerVipPlanItem } from '../data/schema'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/date-picker'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Save,
    Target,
    Trophy,
    TrendingUp,
    Wand2,
    type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

type AllocationStrategy = 'PRO_RATA' | 'FACTOR_HIGH' | 'EQUAL' | 'PRIORITY'

const ALLOCATION_STRATEGIES: Array<{
    value: AllocationStrategy
    label: string
    hint: string
}> = [
    {
        value: 'PRO_RATA',
        label: 'Theo tỷ lệ đã đạt',
        hint: 'Dồn vào nhóm KH đã mua nhiều — bám sát thói quen mua.',
    },
    {
        value: 'FACTOR_HIGH',
        label: 'Ưu tiên nhóm hệ số cao',
        hint: 'Tối thiểu SL cần bán — chọn nhóm điểm/đơn vị cao nhất.',
    },
    {
        value: 'EQUAL',
        label: 'Chia đều các nhóm',
        hint: 'Cân bằng điểm cần đạt giữa các nhóm có hệ số > 0.',
    },
    {
        value: 'PRIORITY',
        label: 'Theo priority KT đánh dấu',
        hint: 'Chỉ phân bổ vào nhóm KT đã đánh ưu tiên (priority).',
    },
]

type Props = {
    customer: CustomerVip | null
    open: boolean
    onOpenChange: (open: boolean) => void
    dateRange?: CustomerVipDateRangeParams
    onDateRangeChange?: (range: CustomerVipDateRangeParams) => void
}

export function CustomerVipPlanSheet({
    customer,
    open,
    onOpenChange,
    dateRange,
    onDateRangeChange,
}: Props) {
    const queryClient = useQueryClient()
    const customerId = customer?.id

    // Gap 7: cho phép đổi mốc tính ngay trong sheet (uncontrolled fallback nếu
    // không có onDateRangeChange từ parent)
    const [localRange, setLocalRange] = React.useState<CustomerVipDateRangeParams>(
        dateRange ?? {},
    )
    const effectiveRange = onDateRangeChange ? dateRange ?? {} : localRange
    const updateRange = (next: CustomerVipDateRangeParams) => {
        if (onDateRangeChange) onDateRangeChange(next)
        else setLocalRange(next)
    }
    React.useEffect(() => {
        if (dateRange) setLocalRange(dateRange)
    }, [dateRange])

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-vip-plan', customerId, effectiveRange],
        queryFn: () => getCustomerVipPlan(customerId!, effectiveRange),
        enabled: open && !!customerId,
    })

    const [targetTierCode, setTargetTierCode] = React.useState('')
    const [items, setItems] = React.useState<CustomerVipPlanItem[]>([])
    const [strategy, setStrategy] = React.useState<AllocationStrategy>('PRO_RATA')

    React.useEffect(() => {
        if (!data) return
        setTargetTierCode(data.target_tier_code ?? '')
        setItems(data.items ?? [])
    }, [data])

    const currentPoint = Number(data?.total_vip_point ?? 0)

    // Gap 2: chỉ liệt kê tier có point > currentPoint. Nếu KH đã đạt hạng cao
    // nhất, vẫn cho thấy hạng đó để duy trì.
    const eligibleTiers = React.useMemo(() => {
        const all = data?.available_tiers ?? []
        const higher = all.filter((tier) => Number(tier.point ?? 0) > currentPoint)
        return higher.length > 0
            ? higher
            : all.filter((tier) => Number(tier.point ?? 0) >= currentPoint)
    }, [data?.available_tiers, currentPoint])

    const selectedTier = data?.available_tiers?.find((tier) => tier.code === targetTierCode)
    const targetPoint = Number(selectedTier?.point ?? data?.target_point ?? 0)
    const plannedPoint = sum(items.map((item) => item.projected_point))
    const projectedTotalPoint = currentPoint + plannedPoint
    const missingToTarget = Math.max(0, targetPoint - projectedTotalPoint)

    // Gap 6: % hoàn thành so với mục tiêu cho progress bar
    const targetProgress = targetPoint > 0
        ? Math.min(100, Math.round((projectedTotalPoint / targetPoint) * 100))
        : 0

    const saveMutation = useMutation({
        mutationFn: () => {
            if (!customerId || !targetTierCode) throw new Error('Vui lòng chọn hạng mục tiêu năm nay')
            return saveCustomerVipPlan(customerId, {
                target_tier_code: targetTierCode,
                target_tier_name: selectedTier?.name,
                from_date: dateRange?.from_date,
                to_date: dateRange?.to_date,
                as_of_date: dateRange?.as_of_date,
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
            setTargetTierCode(next.target_tier_code ?? '')
            setItems(next.items ?? [])
            queryClient.invalidateQueries({ queryKey: ['customer-vip-plan'] })
            queryClient.invalidateQueries({ queryKey: ['customer-vip'] })
            toast.success('Đã lưu kế hoạch VIP')
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Lưu kế hoạch VIP thất bại')
        },
    })

    // Gap 5: confirm trước khi save kế hoạch chưa đủ điểm mục tiêu
    const handleSave = () => {
        if (!data || !targetTierCode) {
            toast.error('Vui lòng chọn hạng mục tiêu năm nay')
            return
        }
        if (missingToTarget > 0) {
            const ok = window.confirm(
                `Kế hoạch hiện còn thiếu ${formatNumber(missingToTarget)} điểm để đạt hạng "${selectedTier?.name ?? targetTierCode}". Bạn vẫn muốn lưu kế hoạch tạm này?`,
            )
            if (!ok) return
        }
        saveMutation.mutate()
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
            toast.info('Khách hàng đã đủ điểm mục tiêu')
            return
        }
        const totalRemainingPoint = targetPoint - currentPoint
        const eligible = items
            .map((item, index) => ({ item, index, factor: Number(item.point_factor || 0) }))
            .filter(({ factor }) => factor > 0)

        if (!eligible.length) {
            toast.warning('Chưa có nhóm hàng có hệ số để tự phân bổ')
            return
        }

        // Reset toàn bộ planned_qty
        const next = items.map((item) => ({
            ...item,
            planned_qty: 0,
            projected_point: 0,
            total_point_after_plan: Number(item.achieved_point || 0),
        }))

        const applyToRow = (index: number, qty: number) => {
            const item = next[index]
            const factor = Number(item.point_factor || 0)
            const projectedPoint = round2(qty * factor)
            next[index] = {
                ...item,
                planned_qty: round2(qty),
                projected_point: projectedPoint,
                total_point_after_plan: round2(
                    Number(item.achieved_point || 0) + projectedPoint,
                ),
            }
        }

        const strategyMeta = ALLOCATION_STRATEGIES.find((s) => s.value === strategy)
        const label = strategyMeta?.label ?? strategy

        if (strategy === 'FACTOR_HIGH') {
            // Cũ: dồn vào nhóm có factor cao nhất
            const sorted = [...eligible].sort((a, b) => b.factor - a.factor)
            let remaining = totalRemainingPoint
            for (const { index, factor } of sorted) {
                if (remaining <= 0) break
                const qty = remaining / factor
                applyToRow(index, qty)
                remaining -= qty * factor
            }
        } else if (strategy === 'EQUAL') {
            // Chia ĐỀU điểm cần đạt giữa các nhóm có factor > 0
            const pointPerGroup = totalRemainingPoint / eligible.length
            for (const { index, factor } of eligible) {
                applyToRow(index, pointPerGroup / factor)
            }
        } else if (strategy === 'PRIORITY') {
            // Chỉ phân bổ vào nhóm có priority được đánh dấu (priority != null/empty)
            const prioritized = eligible.filter(
                ({ item }) => item.priority && String(item.priority).trim() !== '',
            )
            if (!prioritized.length) {
                toast.warning(
                    'Chưa có nhóm nào được đánh priority. Hãy đánh ưu tiên trên dòng hoặc đổi sang strategy khác.',
                )
                return
            }
            const pointPerGroup = totalRemainingPoint / prioritized.length
            for (const { index, factor } of prioritized) {
                applyToRow(index, pointPerGroup / factor)
            }
        } else {
            // PRO_RATA (default): phân bổ theo tỷ lệ achieved_qty (hoặc achieved_point) của
            // từng nhóm — bám sát thói quen mua hàng của KH.
            const weights = eligible.map(({ item }) => {
                const achieved = Number(item.achieved_qty || 0)
                const achievedPoint = Number(item.achieved_point || 0)
                // Ưu tiên SL đã đạt; fallback điểm đã đạt; cuối cùng = 1 để tránh chia 0
                return achieved > 0 ? achieved : achievedPoint > 0 ? achievedPoint : 1
            })
            const totalWeight = weights.reduce((s, w) => s + w, 0)

            if (totalWeight === 0) {
                // Tất cả achieved = 0 → fallback chia đều
                const pointPerGroup = totalRemainingPoint / eligible.length
                for (const { index, factor } of eligible) {
                    applyToRow(index, pointPerGroup / factor)
                }
            } else {
                eligible.forEach(({ index, factor }, idx) => {
                    const share = (weights[idx] / totalWeight) * totalRemainingPoint
                    applyToRow(index, share / factor)
                })
            }
        }

        setItems(next)
        toast.success(`Đã tự phân bổ: ${label}`)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[96vw] overflow-hidden p-0 sm:max-w-[1180px]">
                <SheetHeader className="border-b px-5 py-4">
                    <SheetTitle>Kế hoạch VIP năm {data?.calc_year ?? customer?.calc_year}</SheetTitle>
                    <SheetDescription>
                        {customer?.customer_code} - {customer?.customer_name}
                    </SheetDescription>

                    {/* Gap 7: DatePicker để KT đổi mốc tính ngay trong sheet */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Mốc tạm tính:
                        </span>
                        <DatePicker
                            className="min-w-[150px] [&_button]:h-9"
                            value={effectiveRange?.from_date}
                            onChange={(value) =>
                                updateRange({
                                    ...effectiveRange,
                                    from_date: value || undefined,
                                    as_of_date: undefined,
                                })
                            }
                            placeholder="Từ ngày CT"
                        />
                        <DatePicker
                            className="min-w-[150px] [&_button]:h-9"
                            value={effectiveRange?.to_date}
                            onChange={(value) =>
                                updateRange({
                                    ...effectiveRange,
                                    to_date: value || undefined,
                                    as_of_date: undefined,
                                })
                            }
                            placeholder="Đến ngày CT"
                        />
                    </div>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải kế hoạch VIP...
                        </div>
                    ) : error ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            {error instanceof Error ? error.message : 'Không tải được kế hoạch VIP'}
                        </div>
                    ) : data ? (
                        <div className="space-y-4">
                            {/* ── SUMMARY CARDS ────────────────────────────── */}
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <StatCard
                                    icon={Trophy}
                                    label="Hạng hiện tại"
                                    value={data.tier_name || 'Chưa đủ VIP'}
                                    sub={
                                        data.next_tier_name
                                            ? `Kế tiếp: ${data.next_tier_name}`
                                            : 'Cao nhất'
                                    }
                                    tone="info"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Điểm hiện tại"
                                    value={formatNumber(currentPoint)}
                                    sub={
                                        Number(data.missing_point_to_next || 0) > 0
                                            ? `Thiếu ${formatNumber(data.missing_point_to_next)} để lên hạng`
                                            : 'Đã đủ hạng kế tiếp'
                                    }
                                    tone="default"
                                />
                                <StatCard
                                    icon={Target}
                                    label={`Mục tiêu năm ${data.calc_year}`}
                                    value={formatNumber(targetPoint)}
                                    sub={
                                        selectedTier
                                            ? `Hạng: ${selectedTier.name}`
                                            : 'Chưa chọn hạng'
                                    }
                                    tone="primary"
                                />
                                <StatCard
                                    icon={missingToTarget > 0 ? AlertCircle : CheckCircle2}
                                    label="Còn thiếu để đạt mục tiêu"
                                    value={
                                        missingToTarget > 0
                                            ? formatNumber(missingToTarget)
                                            : 'Đã đạt'
                                    }
                                    sub={`Dự kiến cuối kỳ: ${formatNumber(projectedTotalPoint)} điểm`}
                                    tone={missingToTarget > 0 ? 'warn' : 'ok'}
                                />
                            </div>

                            {/* ── TARGET TIER + STRATEGY TOOLBAR ───────────── */}
                            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-4 py-3">
                                <div className="flex min-w-[260px] flex-1 flex-col gap-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Hạng mục tiêu năm {data.calc_year}
                                    </label>
                                    <Select value={targetTierCode} onValueChange={setTargetTierCode}>
                                        <SelectTrigger className="h-10 bg-background">
                                            <SelectValue placeholder="Chọn hạng mục tiêu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleTiers.map((tier) => (
                                                <SelectItem key={tier.code} value={tier.code}>
                                                    {tier.name} — {formatNumber(tier.point)} điểm
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex min-w-[260px] flex-1 flex-col gap-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Chiến lược tự phân bổ
                                    </label>
                                    <Select
                                        value={strategy}
                                        onValueChange={(v) => setStrategy(v as AllocationStrategy)}
                                    >
                                        <SelectTrigger className="h-10 bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ALLOCATION_STRATEGIES.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium">{opt.label}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {opt.hint}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        &nbsp;
                                    </label>
                                    <Button
                                        type="button"
                                        onClick={autoAllocate}
                                        className="h-10"
                                    >
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Tự phân bổ
                                    </Button>
                                </div>
                            </div>

                            {/* ── PLAN TABLE ───────────────────────────────── */}
                            <div className="overflow-hidden rounded-md border bg-background">
                                <div className="overflow-x-auto">
                                    <Table className="min-w-[1080px]">
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                                <CleanHead className="w-12 text-center">#</CleanHead>
                                                <CleanHead className="min-w-[160px]">Mã chung</CleanHead>
                                                <CleanHead className="min-w-[260px]">Nhóm hàng hóa</CleanHead>
                                                <CleanHead className="w-20 text-center">ĐVT</CleanHead>
                                                <CleanHead className="w-[130px] text-right">
                                                    SL đạt
                                                    <div className="text-[10px] font-normal text-muted-foreground">
                                                        đến {formatDisplayDate(data.to_date || data.as_of_date)}
                                                    </div>
                                                </CleanHead>
                                                <CleanHead className="w-20 text-right">Hệ số</CleanHead>
                                                <CleanHead className="w-[130px] text-right">Điểm đạt</CleanHead>
                                                <CleanHead className="w-[150px] text-right text-primary">
                                                    SL dự kiến thêm
                                                </CleanHead>
                                                <CleanHead className="w-[140px] text-right text-primary">
                                                    Điểm dự kiến {data.calc_year}
                                                </CleanHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow
                                                    key={`${item.group_code}-${index}`}
                                                    className="border-b last:border-0"
                                                >
                                                    <CleanCell className="text-center text-xs text-muted-foreground tabular-nums">
                                                        {index + 1}
                                                    </CleanCell>
                                                    <CleanCell className="font-mono text-xs font-medium">
                                                        {item.group_code}
                                                    </CleanCell>
                                                    <CleanCell className="text-sm">
                                                        {item.product_group || '-'}
                                                    </CleanCell>
                                                    <CleanCell className="text-center text-xs text-muted-foreground">
                                                        {item.unit || '-'}
                                                    </CleanCell>
                                                    <CleanCell className="text-right tabular-nums">
                                                        {formatNumberOrDash(item.achieved_qty)}
                                                    </CleanCell>
                                                    <CleanCell className="text-right tabular-nums text-muted-foreground">
                                                        {formatNumber(item.point_factor)}
                                                    </CleanCell>
                                                    <CleanCell className="text-right tabular-nums">
                                                        {formatNumberOrDash(item.achieved_point)}
                                                    </CleanCell>
                                                    <CleanCell className="p-1">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            value={item.planned_qty ?? 0}
                                                            onChange={(event) => updatePlannedQty(index, event.target.value)}
                                                            className="h-8 border-slate-200 text-right font-medium tabular-nums focus-visible:ring-1"
                                                        />
                                                    </CleanCell>
                                                    <CleanCell
                                                        className={cn(
                                                            'text-right font-semibold tabular-nums',
                                                            Number(item.projected_point) > 0
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {formatNumberOrDash(item.projected_point)}
                                                    </CleanCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow className="border-t bg-muted/30 hover:bg-muted/30">
                                                <CleanCell colSpan={4} className="text-right font-semibold">
                                                    Tổng
                                                </CleanCell>
                                                <CleanCell className="text-right font-semibold tabular-nums">
                                                    {formatNumberOrDash(sum(items.map((item) => item.achieved_qty)))}
                                                </CleanCell>
                                                <CleanCell />
                                                <CleanCell className="text-right font-semibold tabular-nums">
                                                    {formatNumber(sum(items.map((item) => item.achieved_point)))}
                                                </CleanCell>
                                                <CleanCell className="text-right font-semibold tabular-nums">
                                                    {formatNumberOrDash(sum(items.map((item) => item.planned_qty)))}
                                                </CleanCell>
                                                <CleanCell className="text-right font-bold tabular-nums text-primary">
                                                    {formatNumberOrDash(plannedPoint)}
                                                </CleanCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <SheetFooter className="border-t">
                    {/* Gap 6: Progress bar trực quan */}
                    {data && targetPoint > 0 ? (
                        <div className="mr-auto flex w-full max-w-[420px] flex-col gap-1 px-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    Tiến độ đạt mục tiêu
                                </span>
                                <span
                                    className={cn(
                                        'font-bold tabular-nums',
                                        missingToTarget > 0
                                            ? 'text-amber-600'
                                            : 'text-emerald-600',
                                    )}
                                >
                                    {targetProgress}%
                                    {missingToTarget > 0
                                        ? ` · còn thiếu ${formatNumber(missingToTarget)} điểm`
                                        : ' · Đã đạt'}
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                    className={cn(
                                        'h-2 rounded-full',
                                        missingToTarget > 0
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500',
                                    )}
                                    style={{ width: `${targetProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={!data || !targetTierCode || saveMutation.isPending}
                        >
                            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Lưu kế hoạch
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

type StatTone = 'default' | 'primary' | 'info' | 'ok' | 'warn'

const STAT_TONE_TEXT: Record<StatTone, string> = {
    default: 'text-foreground',
    primary: 'text-primary',
    info: 'text-blue-700 dark:text-blue-400',
    ok: 'text-emerald-700 dark:text-emerald-400',
    warn: 'text-amber-700 dark:text-amber-400',
}

const STAT_TONE_ICON: Record<StatTone, string> = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    tone = 'default',
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
    tone?: StatTone
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', STAT_TONE_ICON[tone])}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className={cn('mt-1.5 text-xl font-bold tracking-tight tabular-nums', STAT_TONE_TEXT[tone])}>
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>
            ) : null}
        </div>
    )
}

function CleanHead({ className, ...props }: React.ComponentProps<typeof TableHead>) {
    return (
        <TableHead
            className={cn(
                'h-10 px-3 align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                className,
            )}
            {...props}
        />
    )
}

function CleanCell({ className, ...props }: React.ComponentProps<typeof TableCell>) {
    return (
        <TableCell
            className={cn('h-11 px-3 py-2 align-middle text-sm', className)}
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
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(value || 0))
}

function formatNumberOrDash(value: number | null | undefined) {
    const numeric = Number(value || 0)
    return numeric === 0 ? '-' : formatNumber(numeric)
}

function formatDisplayDate(value?: string | null) {
    if (!value) return ''
    const [date] = value.split('T')
    const parts = date.split('-')
    if (parts.length !== 3) return value
    return `${parts[2]}/${parts[1]}/${parts[0]}`
}
