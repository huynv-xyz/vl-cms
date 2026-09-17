import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PageSection } from "@/components/page-section"
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
import { createCustomerVipPlan, getCustomerVipPlan, listCustomerVips, listPlannedVipCustomers, makeCustomerVipPlanPrimary, saveCustomerVipPlan, type PlannedVipCustomer } from "@/api/customer-vip"
import { listVipTiers } from "@/api/vip-tier"
import type { CustomerVip, CustomerVipPlan, CustomerVipPlanItem, CustomerVipPlanOption } from "@/features/vip/customer/data/schema"
import type { VipTier } from "@/features/vip/tier/data/schema"
import { Route } from "@/routes/_authenticated/vip/customer-plan"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, Loader2, Pin, Plus, Save, Search, Users, Wand2 } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

type AllocationStrategy = "PRO_RATA" | "FACTOR_HIGH" | "EQUAL" | "PRIORITY"

const ALLOCATION_STRATEGIES: Array<{
    value: AllocationStrategy
    label: string
    hint: string
}> = [
    {
        value: "PRO_RATA",
        label: "Theo tỷ lệ hệ số",
        hint: "Chia theo hệ số trên các mã chung đã có bán hàng.",
    },
    {
        value: "FACTOR_HIGH",
        label: "Ưu tiên hệ số cao",
        hint: "Trong nhóm đã có bán hàng, ưu tiên hệ số điểm cao.",
    },
    {
        value: "EQUAL",
        label: "Chia đều các nhóm",
        hint: "Chia đều điểm cần đạt cho các nhóm đã có bán hàng.",
    },
    {
        value: "PRIORITY",
        label: "Theo priority KT",
        hint: "Chỉ phân bổ vào nhóm đã có bán hàng và được đánh ưu tiên.",
    },
]

export default function VipCustomerPlanPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()
    const currentYear = new Date().getFullYear()
    const rawSelectedYear = Number(search.calc_year || currentYear)
    const selectedYear = Number.isFinite(rawSelectedYear) ? rawSelectedYear : currentYear
    const yearOptions = React.useMemo(() => [currentYear - 1, currentYear, currentYear + 1], [currentYear])
    const customerListYear = selectedYear > currentYear ? currentYear : selectedYear
    const customerId = cleanId(search.customer_id)
    const selectedPlanId = Number(search.plan_id || 0) || undefined
    const dateRange = React.useMemo(() => ({ calc_year: selectedYear, plan_id: selectedPlanId }), [selectedYear, selectedPlanId])

    const planQuery = useQuery({
        queryKey: ["customer-vip-plan-page", selectedYear, customerId, selectedPlanId],
        queryFn: () => getCustomerVipPlan(customerId!, dateRange),
        enabled: !!customerId,
    })
    const planData = planQuery.data && Number(planQuery.data.calc_year) === selectedYear ? planQuery.data : undefined

    const [targetTierCode, setTargetTierCode] = React.useState("")
    const [items, setItems] = React.useState<CustomerVipPlanItem[]>([])
    const [plannedQtyInputs, setPlannedQtyInputs] = React.useState<Record<string, string>>({})
    const [strategy, setStrategy] = React.useState<AllocationStrategy>("PRO_RATA")
    const [createOpen, setCreateOpen] = React.useState(false)
    const [newCustomerOpen, setNewCustomerOpen] = React.useState(false)
    const [newCustomerId, setNewCustomerId] = React.useState<string>()
    const [plannedKeyword, setPlannedKeyword] = React.useState("")
    const [newPlanName, setNewPlanName] = React.useState("")
    const [baselineMode, setBaselineMode] = React.useState<"COPY_PRIMARY" | "CURRENT">("COPY_PRIMARY")

    const plannedCustomersQuery = useQuery({
        queryKey: ["planned-vip-customers", selectedYear],
        queryFn: () => listPlannedVipCustomers(selectedYear),
    })
    const plannedCustomers = React.useMemo(() => {
        const keyword = plannedKeyword.trim().toLocaleLowerCase("vi")
        const rows = plannedCustomersQuery.data?.items ?? []
        if (!keyword) return rows
        return rows.filter((row) => `${row.customer_code} ${row.customer_name} ${row.primary_plan_name ?? ""}`.toLocaleLowerCase("vi").includes(keyword))
    }, [plannedCustomersQuery.data?.items, plannedKeyword])

    React.useEffect(() => {
        if (search.customer_id && customerId && search.customer_id !== customerId) {
            updateSearch({ customer_id: customerId })
        }
    }, [customerId, search.customer_id])

    React.useEffect(() => {
        if (planQuery.data && Number(planQuery.data.calc_year) !== selectedYear) {
            updateSearch({ customer_id: undefined })
            setTargetTierCode("")
            setItems([])
            return
        }
        if (!planData) {
            setTargetTierCode("")
            setItems([])
            return
        }
        setTargetTierCode(planData.target_tier_code ?? "")
        setItems(planData.items ?? [])
        setPlannedQtyInputs({})
    }, [planData, planQuery.data, selectedYear])

    const data = planData
    const selectedTier = data?.available_tiers?.find((tier) => tier.code === targetTierCode)
    const targetPoint = Number(selectedTier?.point ?? data?.target_point ?? 0)
    const currentPoint = Number(data?.total_vip_point ?? 0)
    const plannedPoint = sum(items.map((item) => item.projected_point))
    const remainingPlannedPoint = sum(items.map((item) => item.has_plan
        ? Math.max(0, Number(item.projected_point || 0) - Number(item.actual_added_point || 0))
        : Number(item.projected_point || 0)))
    const projectedTotalPoint = currentPoint + remainingPlannedPoint
    const missingToTarget = Math.max(0, targetPoint - projectedTotalPoint)

    const saveMutation = useMutation({
        mutationFn: () => {
            if (!customerId || !targetTierCode) throw new Error("Vui lòng chọn khách hàng và hạng mục tiêu")
            return saveCustomerVipPlan(customerId, {
                plan_id: data?.target_id ?? undefined,
                plan_name: data?.plan_name ?? undefined,
                calc_year: selectedYear,
                target_tier_code: targetTierCode,
                target_tier_name: selectedTier?.name,
                from_date: undefined,
                to_date: undefined,
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
            queryClient.invalidateQueries({ queryKey: ["planned-vip-customers"] })
            toast.success("Đã lưu kế hoạch VIP")
        },
        onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Lưu kế hoạch VIP thất bại")
        },
    })

    const createMutation = useMutation({
        mutationFn: () => {
            if (!customerId || !newPlanName.trim()) throw new Error("Vui lòng nhập tên kế hoạch")
            return createCustomerVipPlan(customerId, {
                calc_year: selectedYear,
                plan_name: newPlanName.trim(),
                baseline_mode: baselineMode,
            })
        },
        onSuccess: (next) => {
            setCreateOpen(false)
            setNewPlanName("")
            updateSearch({ plan_id: next.target_id ?? undefined })
            queryClient.invalidateQueries({ queryKey: ["customer-vip-plan-page"] })
            queryClient.invalidateQueries({ queryKey: ["customer-vip-plan"] })
            queryClient.invalidateQueries({ queryKey: ["planned-vip-customers"] })
            toast.success("Đã tạo phương án kế hoạch")
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Tạo kế hoạch thất bại"),
    })

    const primaryMutation = useMutation({
        mutationFn: () => {
            if (!customerId || !data?.target_id) throw new Error("Chưa chọn kế hoạch")
            return makeCustomerVipPlanPrimary(customerId, data.target_id, selectedYear)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-vip-plan-page"] })
            queryClient.invalidateQueries({ queryKey: ["customer-vip-plan"] })
            queryClient.invalidateQueries({ queryKey: ["planned-vip-customers"] })
            toast.success("Đã chọn làm kế hoạch chính")
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Không thể đổi kế hoạch chính"),
    })

    const updateSearch = (next: Partial<{ customer_id?: string; plan_id?: number; calc_year: number; from_date?: string; to_date?: string }>) => {
        navigate({
            search: (prev) => {
                const merged = { ...prev, ...next }
                return {
                    customer_id: merged.customer_id || undefined,
                    plan_id: merged.plan_id || undefined,
                    calc_year: merged.calc_year,
                    from_date: merged.from_date || undefined,
                    to_date: merged.to_date || undefined,
                }
            },
            replace: true,
        })
    }

    const updatePlannedQty = (index: number, value: string) => {
        setPlannedQtyInputs((prev) => ({
            ...prev,
            [String(index)]: value,
        }))
        const qty = parseDecimalInput(value)
        setItems((prev) => prev.map((item, i) => {
            if (i !== index) return item
            const projectedPoint = qty * Number(item.point_factor || 0)
            return {
                ...item,
                planned_qty: qty,
                projected_point: round2(projectedPoint),
                remaining_planned_qty: item.has_plan ? Math.max(0, round2(qty - Number(item.actual_added_qty || 0))) : undefined,
                remaining_planned_point: item.has_plan ? Math.max(0, round2(projectedPoint - Number(item.actual_added_point || 0))) : undefined,
                total_point_after_plan: round2(Number(item.achieved_point || 0) + projectedPoint),
            }
        }))
    }

    const commitPlannedQtyInput = (index: number) => {
        setPlannedQtyInputs((prev) => {
            if (!(String(index) in prev)) return prev
            const next = { ...prev }
            delete next[String(index)]
            return next
        })
    }

    const autoAllocate = () => {
        if (!targetPoint || targetPoint <= currentPoint) {
            toast.info("Khách hàng đã đủ điểm mục tiêu")
            return
        }
        const totalRemainingPoint = targetPoint - currentPoint
        const eligible = items
            .map((item, index) => ({ item, index, factor: Number(item.point_factor || 0) }))
            .filter(({ item, factor }) => factor > 0 && hasSalesData(item))

        if (!eligible.length) {
            toast.warning("Chưa có nhóm hàng vừa có dữ liệu bán hàng vừa có hệ số để tự phân bổ")
            return
        }

        const next = items.map((item) => ({ ...item, planned_qty: 0, projected_point: 0, total_point_after_plan: Number(item.achieved_point || 0) }))

        const applyToRow = (index: number, qty: number) => {
            const item = next[index]
            const factor = Number(item.point_factor || 0)
            const totalQty = round2(qty + Number(item.actual_added_qty || 0))
            const projectedPoint = round2(totalQty * factor)
            next[index] = {
                ...item,
                planned_qty: totalQty,
                projected_point: projectedPoint,
                remaining_planned_qty: round2(qty),
                remaining_planned_point: round2(qty * factor),
                total_point_after_plan: round2(Number(item.achieved_point || 0) + projectedPoint),
            }
        }

        const strategyMeta = ALLOCATION_STRATEGIES.find((item) => item.value === strategy)
        const label = strategyMeta?.label ?? strategy

        if (strategy === "FACTOR_HIGH") {
            const sorted = [...eligible].sort((a, b) => b.factor - a.factor)
            let remainingPoint = totalRemainingPoint
            for (const { index, factor } of sorted) {
                if (remainingPoint <= 0) break
                const qty = remainingPoint / factor
                applyToRow(index, qty)
                remainingPoint -= qty * factor
            }
        } else if (strategy === "EQUAL") {
            const pointPerGroup = totalRemainingPoint / eligible.length
            for (const { index, factor } of eligible) {
                applyToRow(index, pointPerGroup / factor)
            }
        } else if (strategy === "PRIORITY") {
            const prioritized = eligible.filter(
                ({ item }) => item.priority && String(item.priority).trim() !== "",
            )
            if (!prioritized.length) {
                toast.warning("Chưa có nhóm nào được đánh priority. Hãy chọn chiến lược khác hoặc cấu hình priority.")
                return
            }
            const pointPerGroup = totalRemainingPoint / prioritized.length
            for (const { index, factor } of prioritized) {
                applyToRow(index, pointPerGroup / factor)
            }
        } else {
            const weights = eligible.map(({ item }) => {
                return Number(item.point_factor || 0)
            })
            const totalWeight = weights.reduce((total, weight) => total + weight, 0)
            if (totalWeight === 0) {
                const pointPerGroup = totalRemainingPoint / eligible.length
                for (const { index, factor } of eligible) {
                    applyToRow(index, pointPerGroup / factor)
                }
            } else {
                eligible.forEach(({ index, factor }, itemIndex) => {
                    const sharePoint = (weights[itemIndex] / totalWeight) * totalRemainingPoint
                    applyToRow(index, sharePoint / factor)
                })
            }
        }

        setItems(next)
        toast.success(`Đã tự phân bổ: ${label}`)
    }

    return (
        <>
        <PageSection
            title="Kế hoạch điểm"
            description="Xem điểm/hạng hiện tại và lập kế hoạch số lượng dự kiến để đạt hạng mục tiêu năm nay."
            actions={
                <ExportCustomerPlanButton
                    selectedYear={selectedYear}
                    customerListYear={customerListYear}
                    customerId={customerId}
                    currentPlan={data}
                    currentItems={items}
                />
            }
            isLoading={false}
            error={null}
            data
        >
            {() => (
                <div className="space-y-4">
                    <div className="rounded-md border bg-background p-3 shadow-sm">
                        <div className={cn("grid gap-3", customerId ? "md:grid-cols-[auto_160px_minmax(280px,1fr)_minmax(240px,360px)_auto]" : "md:grid-cols-[180px_minmax(280px,1fr)_auto]") }>
                            {customerId ? (
                                <Button type="button" variant="outline" onClick={() => updateSearch({ customer_id: undefined, plan_id: undefined })}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />Danh sách
                                </Button>
                            ) : null}
                            <Select
                                value={String(selectedYear)}
                                onValueChange={(value) => updateSearch({ calc_year: Number(value), customer_id: undefined, plan_id: undefined })}
                            >
                                <SelectTrigger className="h-10 bg-background">
                                    <SelectValue placeholder="Chọn năm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {yearOptions.map((year) => (
                                        <SelectItem key={year} value={String(year)}>
                                            Năm {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {customerId ? (
                                <>
                                    <div className="flex h-10 min-w-0 items-center rounded-md border bg-muted/20 px-3 text-sm font-medium">
                                        <span className="truncate">{data ? `${data.customer_code} - ${data.customer_name}` : "Đang tải khách hàng..."}</span>
                                    </div>
                                    <Select
                                        value={String(selectedPlanId ?? data?.target_id ?? "")}
                                        onValueChange={(value) => updateSearch({ plan_id: Number(value) })}
                                        disabled={!(data?.plans?.length)}
                                    >
                                        <SelectTrigger className="h-10 bg-background">
                                            <SelectValue placeholder="Chưa có kế hoạch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(data?.plans ?? []).map((plan) => (
                                                <SelectItem key={plan.id} value={String(plan.id)}>
                                                    {plan.plan_name}{plan.is_primary ? " (Kế hoạch chính)" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />Tạo phương án
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input value={plannedKeyword} onChange={(event) => setPlannedKeyword(event.target.value)} className="h-10 pl-9" placeholder="Tìm mã, tên khách hàng hoặc kế hoạch chính..." />
                                    </div>
                                    <Button type="button" onClick={() => setNewCustomerOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />Lập kế hoạch cho khách mới
                                    </Button>
                                </>
                            )}
                            {customerId && customerListYear !== selectedYear ? (
                                <div className="text-xs text-muted-foreground md:col-start-3 md:col-span-3">
                                    Thông tin khách lấy từ năm {customerListYear}; kế hoạch được tính và lưu cho năm {selectedYear}.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {!customerId ? (
                        <PlannedCustomerList
                            year={selectedYear}
                            rows={plannedCustomers}
                            total={plannedCustomersQuery.data?.total ?? 0}
                            isLoading={plannedCustomersQuery.isLoading}
                            error={plannedCustomersQuery.error}
                            onSelect={(row) => updateSearch({ customer_id: String(row.customer_id), plan_id: row.primary_plan_id ?? undefined })}
                        />
                    ) : planQuery.isLoading ? (
                        <div className="flex h-56 items-center justify-center rounded-md border text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải kế hoạch VIP...
                        </div>
                    ) : planQuery.error ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                            {planQuery.error instanceof Error ? planQuery.error.message : "Không tải được kế hoạch VIP"}
                        </div>
                    ) : planQuery.data && Number(planQuery.data.calc_year) !== selectedYear ? (
                        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                            Khách hàng đang chọn thuộc năm {planQuery.data.calc_year}. Vui lòng chọn lại khách hàng trong năm {selectedYear}.
                        </div>
                    ) : data ? (
                        <>
                        {(data.plans?.length ?? 0) > 1 ? (
                            <PlanComparison plans={data.plans ?? []} selectedPlanId={data.target_id ?? undefined} onSelect={(planId) => updateSearch({ plan_id: planId })} />
                        ) : null}
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
                            commitPlannedQtyInput={commitPlannedQtyInput}
                            plannedQtyInputs={plannedQtyInputs}
                            onSave={() => saveMutation.mutate()}
                            canSave={!!data && !!targetTierCode && !saveMutation.isPending}
                            isSaving={saveMutation.isPending}
                            autoAllocate={autoAllocate}
                            strategy={strategy}
                            setStrategy={setStrategy}
                            onMakePrimary={() => primaryMutation.mutate()}
                            isMakingPrimary={primaryMutation.isPending}
                        />
                        </>
                    ) : null}
                </div>
            )}
        </PageSection>
            <Dialog open={newCustomerOpen} onOpenChange={(open) => { setNewCustomerOpen(open); if (!open) setNewCustomerId(undefined) }}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>Lập kế hoạch cho khách hàng</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Khách hàng</label>
                        <AsyncSelect
                            key={`new-customer-${selectedYear}`}
                            value={newCustomerId}
                            onChange={(value: string | undefined) => setNewCustomerId(value)}
                            dataSource={{
                                getList: (params: any) => listCustomerVips({ page: 1, size: 30, keyword: params.keyword, calc_year: customerListYear }),
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
                        />
                        {customerListYear !== selectedYear ? (
                            <p className="text-xs text-muted-foreground">Khách hàng được lấy từ năm {customerListYear}; kế hoạch mới sẽ thuộc năm {selectedYear}.</p>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewCustomerOpen(false)}>Hủy</Button>
                        <Button disabled={!newCustomerId} onClick={() => {
                            if (!newCustomerId) return
                            updateSearch({ customer_id: newCustomerId, plan_id: undefined })
                            setNewCustomerOpen(false)
                            setNewCustomerId(undefined)
                        }}>Tiếp tục</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Tạo phương án kế hoạch</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Tên kế hoạch</label>
                            <Input value={newPlanName} onChange={(event) => setNewPlanName(event.target.value)} placeholder="Ví dụ: Phương án tăng trưởng" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Mốc so sánh</label>
                            <Select value={baselineMode} onValueChange={(value) => setBaselineMode(value as "COPY_PRIMARY" | "CURRENT")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COPY_PRIMARY">Sao chép mốc dữ liệu của kế hoạch chính</SelectItem>
                                    <SelectItem value="CURRENT">Tạo mốc theo dữ liệu hiện tại</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Dùng mốc của kế hoạch chính để các phương án có cùng cơ sở so sánh.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
                        <Button onClick={() => createMutation.mutate()} disabled={!newPlanName.trim() || createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Tạo kế hoạch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function PlannedCustomerList({
    year,
    rows,
    total,
    isLoading,
    error,
    onSelect,
}: {
    year: number
    rows: PlannedVipCustomer[]
    total: number
    isLoading: boolean
    error: unknown
    onSelect: (row: PlannedVipCustomer) => void
}) {
    return (
        <div className="overflow-hidden rounded-md border bg-background">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                <div>
                    <div className="font-semibold">Khách hàng đã lập kế hoạch năm {year}</div>
                    <div className="text-xs text-muted-foreground">{total} khách hàng có ít nhất một kế hoạch</div>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tải danh sách...</div>
            ) : error ? (
                <div className="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error instanceof Error ? error.message : "Không tải được danh sách kế hoạch"}</div>
            ) : rows.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Không có khách hàng phù hợp trong năm {year}.</div>
            ) : (
                <div className="overflow-x-auto">
                    <Table className="min-w-[900px]">
                        <TableHeader><TableRow><TableHead className="w-16 text-center">STT</TableHead><TableHead className="min-w-[160px]">Mã khách hàng</TableHead><TableHead className="min-w-[260px]">Tên khách hàng</TableHead><TableHead className="w-32 text-center">Số kế hoạch</TableHead><TableHead className="min-w-[240px]">Kế hoạch chính</TableHead><TableHead className="min-w-[160px]">Hạng mục tiêu</TableHead><TableHead className="min-w-[160px]">Cập nhật gần nhất</TableHead></TableRow></TableHeader>
                        <TableBody>{rows.map((row, index) => (
                            <TableRow key={`${row.customer_code}-${row.calc_year}`} className="cursor-pointer hover:bg-muted/40" onClick={() => onSelect(row)}>
                                <TableCell className="text-center tabular-nums">{index + 1}</TableCell>
                                <TableCell className="font-mono font-semibold">{row.customer_code}</TableCell>
                                <TableCell><div className="max-w-[360px] truncate font-medium" title={row.customer_name}>{row.customer_name}</div></TableCell>
                                <TableCell className="text-center tabular-nums">{row.plan_count}</TableCell>
                                <TableCell><div className="max-w-[300px] truncate" title={row.primary_plan_name ?? ""}>{row.primary_plan_name || "-"}</div></TableCell>
                                <TableCell>{row.target_tier_name || "-"}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDateTime(row.latest_updated_at)}</TableCell>
                            </TableRow>
                        ))}</TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

function PlanComparison({ plans, selectedPlanId, onSelect }: { plans: CustomerVipPlanOption[]; selectedPlanId?: number; onSelect: (planId: number) => void }) {
    return (
        <div className="overflow-hidden rounded-md border bg-background">
            <div className="border-b bg-muted/30 px-4 py-2 text-sm font-semibold">So sánh phương án</div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                    <thead><tr className="border-b text-muted-foreground"><th className="px-3 py-2 text-left">Kế hoạch</th><th className="px-3 py-2 text-left">Mục tiêu</th><th className="px-3 py-2 text-right">Điểm kế hoạch</th><th className="px-3 py-2 text-right">Đã thực hiện thêm</th><th className="px-3 py-2 text-right">Còn lại</th><th className="px-3 py-2 text-right">Tổng dự kiến</th><th className="px-3 py-2 text-right">Thiếu mục tiêu</th></tr></thead>
                    <tbody>{plans.map((plan) => (
                        <tr key={plan.id} className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/40", plan.id === selectedPlanId && "bg-primary/5")} onClick={() => onSelect(plan.id)}>
                            <td className="px-3 py-2"><div className="font-medium">{plan.plan_name}</div><div className="text-xs text-muted-foreground">Mốc dữ liệu {formatDisplayDate(plan.baseline_date)} {plan.is_primary ? "· Kế hoạch chính" : ""}</div></td>
                            <td className="px-3 py-2">{plan.target_tier_name || "-"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumberOrDash(plan.planned_point)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumberOrDash(plan.actual_added_point)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatNumberOrDash(plan.remaining_planned_point)}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatNumberOrDash(plan.projected_total_point)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{Number(plan.missing_point || 0) > 0 ? formatNumber(plan.missing_point) : "Đạt"}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
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
    commitPlannedQtyInput,
    plannedQtyInputs,
    onSave,
    canSave,
    isSaving,
    autoAllocate,
    strategy,
    setStrategy,
    onMakePrimary,
    isMakingPrimary,
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
    commitPlannedQtyInput: (index: number) => void
    plannedQtyInputs: Record<string, string>
    onSave: () => void
    canSave: boolean
    isSaving: boolean
    autoAllocate: () => void
    strategy: AllocationStrategy
    setStrategy: (value: AllocationStrategy) => void
    onMakePrimary: () => void
    isMakingPrimary: boolean
}) {
    const progressPct = targetPoint > 0 ? Math.min(100, Math.round((projectedTotalPoint / targetPoint) * 100)) : 0
    const currentPct = targetPoint > 0 ? Math.min(100, Math.round((currentPoint / targetPoint) * 100)) : 0
    const plannedPct = Math.max(0, progressPct - currentPct)
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
                                {data.plan_name && <Badge variant="outline">{data.plan_name}</Badge>}
                                {data.is_primary && <Badge>Kế hoạch chính</Badge>}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                Dữ liệu tính đến {formatDisplayDate(data.to_date || data.as_of_date)} · Năm {data.calc_year}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                                {data.has_plan
                                    ? `Mốc dữ liệu ${formatDisplayDate(data.baseline_date)} · lập lúc ${formatDateTime(data.plan_created_at)}${data.plan_updated_at ? ` · cập nhật ${formatDateTime(data.plan_updated_at)}` : ""}`
                                    : "Chưa có kế hoạch đã lưu. Các cột thực hiện thêm sẽ có ý nghĩa sau khi lưu kế hoạch."}
                            </div>
                        </div>

                        <div className="flex min-w-[420px] items-end gap-2">
                            <div className="min-w-0 flex-1">
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
                            {data.has_plan && !data.is_primary ? (
                                <Button type="button" variant="outline" className="h-10 shrink-0" onClick={onMakePrimary} disabled={isMakingPrimary}>
                                    <Pin className="mr-2 h-4 w-4" />Chọn làm chính
                                </Button>
                            ) : null}
                            <Button type="button" className="h-10 shrink-0" onClick={onSave} disabled={!canSave}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Lưu
                            </Button>
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
                        <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="absolute inset-y-0 left-0 bg-slate-600" style={{ width: `${currentPct}%` }} />
                            <div className="absolute inset-y-0 bg-orange-500" style={{ left: `${currentPct}%`, width: `${plannedPct}%` }} />
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
                        <div className="text-xs text-muted-foreground">Mỗi dòng là một mã chung. Tự phân bổ chỉ dùng các mã chung đã có dữ liệu bán hàng.</div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[260px]">
                            <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Chiến lược</div>
                            <Select value={strategy} onValueChange={(value) => setStrategy(value as AllocationStrategy)}>
                                <SelectTrigger className="h-9 w-full bg-background">
                                    <span className="min-w-0 truncate">{allocationStrategyLabel(strategy)}</span>
                                </SelectTrigger>
                                <SelectContent>
                                    {ALLOCATION_STRATEGIES.map((option) => (
                                        <SelectItem key={option.value} value={option.value} textValue={option.label}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{option.label}</span>
                                                <span className="text-xs text-muted-foreground">{option.hint}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="button" variant="outline" onClick={autoAllocate}>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Tự phân bổ
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <Table className="min-w-[1480px]">
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <PlanHead className="w-14 text-center">STT</PlanHead>
                            <PlanHead className="min-w-[150px]">Mã chung</PlanHead>
                            <PlanHead className="min-w-[280px]">Tên mã chung / nhóm hàng</PlanHead>
                            <PlanHead className="w-20 text-center">ĐVT</PlanHead>
                            <PlanHead className="w-[150px] text-right">SL đạt</PlanHead>
                            <PlanHead className="w-24 text-right">Hệ số</PlanHead>
                            <PlanHead className="w-[150px] text-right">Điểm đạt</PlanHead>
                            <PlanHead className="w-[160px] text-right">SL dự kiến thêm</PlanHead>
                            <PlanHead className="w-[150px] text-right">Đã thực hiện thêm</PlanHead>
                            <PlanHead className="w-[140px] text-right">Còn thiếu dự kiến</PlanHead>
                            <PlanHead className="w-[120px] text-right">Tiến độ</PlanHead>
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
                                        type="text"
                                        inputMode="decimal"
                                        value={plannedQtyInputs[String(index)] ?? formatInputNumber(item.planned_qty)}
                                        onChange={(event) => updatePlannedQty(index, event.target.value)}
                                        onBlur={() => commitPlannedQtyInput(index)}
                                        className="h-8 bg-background text-right font-semibold tabular-nums"
                                    />
                                </PlanCell>
                                <PlanCell className="text-right tabular-nums">
                                    {item.has_plan ? formatNumberOrDash(item.actual_added_qty) : "-"}
                                </PlanCell>
                                <PlanCell className="text-right tabular-nums">
                                    {item.has_plan ? formatNumberOrDash(item.remaining_planned_qty) : "-"}
                                </PlanCell>
                                <PlanCell className="text-right tabular-nums">
                                    {item.has_plan && Number(item.planned_qty || 0) > 0 ? `${formatNumber(item.plan_progress_qty)}%` : "-"}
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
                            <PlanCell className="text-right font-bold">{formatNumberOrDash(sum(items.map((item) => item.actual_added_qty)))}</PlanCell>
                            <PlanCell className="text-right font-bold">{formatNumberOrDash(sum(items.map((item) => item.remaining_planned_qty)))}</PlanCell>
                            <PlanCell />
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
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value || 0))
}

function formatNumberOrDash(value: number | null | undefined) {
    const numeric = Number(value || 0)
    return numeric === 0 ? "-" : formatNumber(numeric)
}

function formatInputNumber(value: number | null | undefined) {
    const numeric = Number(value || 0)
    return numeric === 0 ? "0" : formatNumber(numeric)
}

function parseDecimalInput(value: string) {
    const normalized = value.replace(/,/g, "").trim()
    if (!normalized || normalized === "." || normalized === "-") return 0
    const numeric = Number(normalized)
    return Number.isFinite(numeric) ? numeric : 0
}

function formatDisplayDate(value?: string | null) {
    if (!value) return ""
    const [date] = value.split("T")
    const parts = date.split("-")
    if (parts.length !== 3) return value
    return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function formatDateTime(value?: string | null) {
    if (!value) return "-"
    const normalized = value.includes("T") ? value : value.replace(" ", "T")
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

function hasSalesData(item: CustomerVipPlanItem) {
    return Number(item.achieved_qty || 0) > 0 || Number(item.achieved_point || 0) > 0
}

function allocationStrategyLabel(value: AllocationStrategy) {
    return ALLOCATION_STRATEGIES.find((option) => option.value === value)?.label ?? "Chọn chiến lược"
}

function cleanId(value?: string) {
    return value?.replace(/^"+|"+$/g, "")
}

type PlanExportColumn = {
    label: string
    width: number
    type?: "number" | "text"
    value: (row: PlanExportRow, index: number) => string | number | null | undefined
}

type PlanExportRow = {
    customer_code: string
    customer_name: string
    customer_type?: string | null
    current_point: number
    tier_name: string
    projected_tier_name: string
    projected_total_point: number
    groups: Record<string, PlanExportGroupValue>
}

type PlanExportGroupValue = {
    achieved_qty: number
    achieved_point: number
    planned_qty: number
    projected_point: number
}

const PLAN_EXPORT_PAGE_SIZE = 200

const PLAN_EXPORT_COLUMNS: PlanExportColumn[] = [
    { label: "STT", width: 8, type: "number", value: (_row, index) => index + 1 },
    { label: "Mã khách hàng", width: 20, value: (row) => row.customer_code },
    { label: "Tên khách hàng", width: 36, value: (row) => row.customer_name },
    { label: "Điểm hiện tại", width: 18, type: "number", value: (row) => numberOrBlank(row.current_point) },
    { label: "Bậc hiện tại", width: 18, value: (row) => row.tier_name },
    { label: "Hạng dự kiến", width: 18, value: (row) => row.projected_tier_name },
    { label: "Tổng điểm dự kiến", width: 20, type: "number", value: (row) => numberOrBlank(row.projected_total_point) },
]

function ExportCustomerPlanButton({
    selectedYear,
    customerListYear,
    customerId,
    currentPlan,
    currentItems,
}: {
    selectedYear: number
    customerListYear: number
    customerId?: string
    currentPlan?: CustomerVipPlan
    currentItems: CustomerVipPlanItem[]
}) {
    const [isExporting, setIsExporting] = React.useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const rows = customerId
                ? await buildSelectedCustomerPlanRows(customerId, selectedYear, currentPlan, currentItems)
                : await fetchAllCustomerPlanRows(selectedYear, customerListYear)

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            const tiers = await fetchActiveVipTiersForPlan()
            await exportCustomerPlanXlsx(rows, tiers, selectedYear, customerId ? "Một khách hàng" : "Toàn bộ khách hàng theo bộ lọc")
            toast.success(`Đã xuất ${rows.length} dòng kế hoạch điểm`)
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
        </Button>
    )
}

async function buildSelectedCustomerPlanRows(
    customerId: string,
    selectedYear: number,
    currentPlan?: CustomerVipPlan,
    currentItems?: CustomerVipPlanItem[],
): Promise<PlanExportRow[]> {
    const plan = currentPlan ?? await getCustomerVipPlan(customerId, { calc_year: selectedYear })
    const items = currentPlan ? currentItems ?? [] : plan.items ?? []
    return buildPlanExportRows(plan, items)
}

async function fetchAllCustomerPlanRows(selectedYear: number, customerListYear: number): Promise<PlanExportRow[]> {
    const customers = await fetchAllCustomerVipsForPlan(customerListYear)
    const rows: PlanExportRow[] = []

    for (const customer of customers) {
        const plan = await getCustomerVipPlan(customer.id, { calc_year: selectedYear })
        rows.push(...buildPlanExportRows(plan, plan.items ?? []))
    }

    return rows
}

async function fetchAllCustomerVipsForPlan(calcYear: number): Promise<CustomerVip[]> {
    const rows: CustomerVip[] = []
    let page = 1

    for (let guard = 0; guard < 300; guard += 1) {
        const res = await listCustomerVips({
            page,
            size: PLAN_EXPORT_PAGE_SIZE,
            calc_year: calcYear,
        })
        const items = res.items ?? []
        rows.push(...items)
        if (page >= (res.total_page || 1) || items.length === 0) break
        page += 1
    }

    return rows
}

async function fetchActiveVipTiersForPlan(): Promise<VipTier[]> {
    const res = await listVipTiers({ page: 1, size: 200 })
    return (res.items ?? [])
        .filter((tier) => Number(tier.status ?? 1) === 1)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
}

function buildPlanExportRows(plan: CustomerVipPlan, items: CustomerVipPlanItem[]): PlanExportRow[] {
    const tierName = plan.tier_name || "Chưa đủ VIP"
    const plannedPoint = sum(items.map((item) => item.projected_point))
    const projectedTotalPoint = round2(Number(plan.total_vip_point || 0) + plannedPoint)

    return [{
        customer_code: plan.customer_code || "",
        customer_name: plan.customer_name || "",
        customer_type: plan.customer_type,
        current_point: Number(plan.total_vip_point || 0),
        tier_name: tierName,
        projected_tier_name: "",
        projected_total_point: projectedTotalPoint,
        groups: buildPlanExportGroups(items),
    }]
}

async function exportCustomerPlanXlsx(rows: PlanExportRow[], tiers: VipTier[], selectedYear: number, scopeLabel: string) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()
    const exportRows = rows.map((row) => ({
        ...row,
        projected_tier_name: resolveProjectedTierName(row, tiers),
    }))

    const sheet = workbook.addWorksheet("Kế hoạch điểm", {
        views: [{ state: "frozen", ySplit: 5 }],
    })
    const groupCodes = collectPlanExportGroupCodes(exportRows)
    const totalColumns = PLAN_EXPORT_COLUMNS.length + groupCodes.length * 4

    sheet.mergeCells(1, 1, 1, totalColumns)
    sheet.getCell(1, 1).value = "KẾ HOẠCH ĐIỂM VIP"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    sheet.mergeCells(2, 1, 2, totalColumns)
    sheet.getCell(2, 1).value = `Năm: ${selectedYear} · Phạm vi: ${scopeLabel} · Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).alignment = { horizontal: "right", vertical: "middle" }
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }

    sheet.addRow([])
    writePlanExportHeaders(sheet, groupCodes)
    exportRows.forEach((row, index) => {
        sheet.addRow(buildPlanExportSheetRow(row, index, groupCodes))
    })

    sheet.columns = [
        ...PLAN_EXPORT_COLUMNS.map((column) => ({ width: column.width })),
        ...groupCodes.flatMap(() => [
            { width: 16 },
            { width: 16 },
            { width: 16 },
            { width: 16 },
        ]),
    ]

    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }

    for (const rowIndex of [4, 5]) {
        const header = sheet.getRow(rowIndex)
        header.height = rowIndex === 4 ? 30 : 26
        header.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF0F766E" },
            }
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            cell.border = border
        })
    }

    for (let rowIndex = 6; rowIndex <= sheet.rowCount; rowIndex += 1) {
        const row = sheet.getRow(rowIndex)
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const isNumberColumn = isPlanExportNumberColumn(colNumber)
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: isNumberColumn ? "right" : "left",
                wrapText: true,
            }
            if (isNumberColumn && typeof cell.value === "number") {
                cell.numFmt = hasFraction(cell.value) ? "#,##0.##" : "#,##0"
            }
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadPlanExcelBuffer(buffer, `ke-hoach-diem-vip-${selectedYear}-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function normalizePlanExportValue(value: string | number | null | undefined, column: PlanExportColumn) {
    if (value == null || value === "") return ""
    if (column.type === "number") {
        const numeric = Number(value)
        return Number.isFinite(numeric) ? numeric : ""
    }
    return value
}

function numberOrBlank(value: number | null | undefined) {
    const numeric = Number(value || 0)
    return numeric === 0 ? "" : numeric
}

function hasFraction(value: number) {
    return Math.abs(value - Math.trunc(value)) > 0.0000001
}

function buildPlanExportGroups(items: CustomerVipPlanItem[]): Record<string, PlanExportGroupValue> {
    const groups: Record<string, PlanExportGroupValue> = {}
    for (const item of items) {
        const groupCode = String(item.group_code || "").trim()
        if (!groupCode) continue
        const current = groups[groupCode] ?? {
            achieved_qty: 0,
            achieved_point: 0,
            planned_qty: 0,
            projected_point: 0,
        }
        current.achieved_qty = round2(current.achieved_qty + Number(item.achieved_qty || 0))
        current.achieved_point = round2(current.achieved_point + Number(item.achieved_point || 0))
        current.planned_qty = round2(current.planned_qty + Number(item.planned_qty || 0))
        current.projected_point = round2(current.projected_point + Number(item.projected_point || 0))
        groups[groupCode] = current
    }
    return groups
}

function collectPlanExportGroupCodes(rows: PlanExportRow[]) {
    const seen = new Set<string>()
    const groupCodes: string[] = []
    for (const row of rows) {
        for (const groupCode of Object.keys(row.groups)) {
            if (!seen.has(groupCode)) {
                seen.add(groupCode)
                groupCodes.push(groupCode)
            }
        }
    }
    return groupCodes
}

function resolveProjectedTierName(row: PlanExportRow, tiers: VipTier[]) {
    const point = Number(row.projected_total_point || 0)
    const matched = tiers
        .filter((tier) => point >= getPlanTierPoint(tier, row.customer_type))
        .sort((a, b) => getPlanTierPoint(b, row.customer_type) - getPlanTierPoint(a, row.customer_type))[0]
    return matched?.name || "Chưa đủ VIP"
}

function getPlanTierPoint(tier: VipTier, customerType?: string | null) {
    const type = String(customerType || "").trim().toUpperCase()
    if (type === "B2C") return Number(tier.b2c_point || 0)
    if (type === "B2B") return Number(tier.b2b_point || 0)
    return Number(tier.mb_b2b_point || 0)
}

function writePlanExportHeaders(sheet: import("exceljs").Worksheet, groupCodes: string[]) {
    const topHeader = sheet.getRow(4)
    const subHeader = sheet.getRow(5)

    PLAN_EXPORT_COLUMNS.forEach((column, index) => {
        const col = index + 1
        sheet.mergeCells(4, col, 5, col)
        topHeader.getCell(col).value = column.label
    })

    let col = PLAN_EXPORT_COLUMNS.length + 1
    for (const groupCode of groupCodes) {
        sheet.mergeCells(4, col, 4, col + 3)
        topHeader.getCell(col).value = groupCode
        subHeader.getCell(col).value = "Thực đạt (SL)"
        subHeader.getCell(col + 1).value = "Thực đạt (Điểm)"
        subHeader.getCell(col + 2).value = "Dự kiến (SL)"
        subHeader.getCell(col + 3).value = "Dự kiến (Điểm)"
        col += 4
    }
}

function buildPlanExportSheetRow(row: PlanExportRow, index: number, groupCodes: string[]) {
    const base = PLAN_EXPORT_COLUMNS.map((column) => normalizePlanExportValue(column.value(row, index), column))
    const groupValues = groupCodes.flatMap((groupCode) => {
        const group = row.groups[groupCode]
        return [
            numberOrBlank(group?.achieved_qty),
            numberOrBlank(group?.achieved_point),
            numberOrBlank(group?.planned_qty),
            numberOrBlank(group?.projected_point),
        ]
    })
    return [...base, ...groupValues]
}

function isPlanExportNumberColumn(colNumber: number) {
    if (colNumber <= PLAN_EXPORT_COLUMNS.length) {
        return PLAN_EXPORT_COLUMNS[colNumber - 1]?.type === "number"
    }
    return true
}

function downloadPlanExcelBuffer(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}
