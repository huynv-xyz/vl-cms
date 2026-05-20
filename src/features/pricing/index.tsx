import { useMemo, useState } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    AlertTriangle,
    Bell,
    Calculator,
    CalendarIcon,
    CheckCircle2,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Coins,
    Database,
    Edit,
    Eye,
    FileSpreadsheet,
    Filter,
    Inbox,
    Layers,
    Package,
    PackageOpen,
    Plus,
    RefreshCw,
    Save,
    Settings2,
    Sparkles,
    Tag,
    TrendingUp,
    Trash2,
    Truck,
    Warehouse,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { listProducts } from "@/api/product"
import { listProductGroups } from "@/api/product-group"
import { listRegions } from "@/api/region"
import {
    calculatePricing,
    listPricingSnapshotItemSources,
    listPricingSnapshotItems,
    pricingAlertConfigsApi,
    pricingGroupsApi,
    pricingMarginRulesApi,
    pricingPackagingCostsApi,
    pricingPromotionsApi,
    pricingSnapshotsApi,
    pricingTransportRulesApi,
} from "@/api/pricing"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type {
    CalculatePricingRequest,
    PricingAlertConfig,
    PricingGroup,
    PricingMarginRule,
    PricingMarginType,
    PricingPackagingCost,
    PricingPriceMethod,
    PricingPromotion,
    PricingSnapshot,
    PricingSnapshotItem,
    PricingSnapshotItemSource,
    PricingTransportMatchType,
    PricingTransportRule,
} from "./data/schema"

type Option = { id: number; label: string; sub?: string }
type SnapshotTableItem = PricingSnapshotItem & { snapshot?: PricingSnapshot }

const today = new Date().toISOString().slice(0, 10)
const currentMonth = today.slice(0, 7)
const controlClass = "!h-11 !min-h-11 !max-h-11 box-border text-base leading-none"

export default function PricingPage() {
    const [tab, setTab] = useState("calculate")
    const lookups = usePricingLookups()

    return (
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-6">
            <PageHeader />

            <Tabs value={tab} onValueChange={setTab} className="gap-6">
                <TabsList className="bg-muted/60 h-12 w-full justify-start rounded-lg p-1 lg:w-fit">
                    <TabsTrigger
                        value="calculate"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 gap-2 rounded-md px-5 text-sm font-medium"
                    >
                        <Calculator className="h-4 w-4" />
                        Tính bảng giá
                    </TabsTrigger>
                    <TabsTrigger
                        value="config"
                        className="data-[state=active]:bg-background data-[state=active]:shadow-sm h-10 gap-2 rounded-md px-5 text-sm font-medium"
                    >
                        <Settings2 className="h-4 w-4" />
                        Cấu hình giá
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calculate" className="mt-0">
                    <CalculatePanel lookups={lookups} />
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                    <ConfigPanel lookups={lookups} />
                </TabsContent>
            </Tabs>
        </Main>
    )
}

function PageHeader() {
    const monthLabel = `${currentMonth.slice(5, 7)}/${currentMonth.slice(0, 4)}`
    return (
        <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <Coins className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        Quản lý giá thành
                    </div>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight lg:text-3xl">
                        Bảng giá bán
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                        Lấy giá mua từ hợp đồng, cộng phí bán hàng và lợi nhuận để xuất bảng giá bán theo vùng, theo kỳ.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
                <WorkflowStep number={1} label="Hợp đồng mua" />
                <WorkflowArrow />
                <WorkflowStep number={2} label="Cấu hình giá" />
                <WorkflowArrow />
                <WorkflowStep number={3} label="Tính bảng giá" active />
                <Separator orientation="vertical" className="hidden h-10 lg:block" />
                <div className="bg-muted/60 hidden flex-col rounded-md px-3 py-1.5 lg:flex">
                    <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                        Kỳ hiện tại
                    </span>
                    <span className="text-sm font-bold tabular-nums">{monthLabel}</span>
                </div>
            </div>
        </div>
    )
}

function WorkflowStep({ number, label, active }: { number: number; label: string; active?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                )}
            >
                {number}
            </div>
            <span
                className={cn(
                    "hidden text-xs font-medium md:inline",
                    active ? "text-foreground" : "text-muted-foreground"
                )}
            >
                {label}
            </span>
        </div>
    )
}

function WorkflowArrow() {
    return <ChevronRight className="text-muted-foreground/40 h-4 w-4 shrink-0" />
}

function CalculatePanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<CalculatePricingRequest>({
        pricing_month: currentMonth,
        price_method: "WAVG",
    })
    const [selectedSnapshot, setSelectedSnapshot] = useState<PricingSnapshot | null>(null)
    const [itemProductId, setItemProductId] = useState<number | undefined>()
    const [itemPricingGroupId, setItemPricingGroupId] = useState<number | undefined>()

    const snapshotsQuery = useQuery({
        queryKey: ["pricing-snapshots", form.pricing_month, form.region_id],
        queryFn: () => pricingSnapshotsApi.list({ page: 1, size: 20, pricing_month: form.pricing_month, region_id: form.region_id }),
    })

    const calculateMutation = useMutation({
        mutationFn: calculatePricing,
        onSuccess: async (snapshots) => {
            toast.success(snapshots.length > 1 ? `Đã tính ${snapshots.length} bảng giá theo vùng` : "Đã tính bảng giá")
            setSelectedSnapshot(snapshots[0] ?? null)
            await queryClient.invalidateQueries({ queryKey: ["pricing-snapshots"] })
        },
        onError: showError("Tính bảng giá thất bại"),
    })

    const latestSnapshots = snapshotsQuery.data?.items ?? []
    const isAllRegionView = !form.region_id
    const viewSnapshots = useMemo(() => {
        if (!selectedSnapshot) return []
        if (!isAllRegionView) return [selectedSnapshot]
        return latestSnapshots.filter((snapshot) =>
            snapshot.pricing_month === selectedSnapshot.pricing_month &&
            snapshot.price_method === selectedSnapshot.price_method
        )
    }, [isAllRegionView, latestSnapshots, selectedSnapshot])
    const viewItemQueries = useQueries({
        queries: viewSnapshots.map((snapshot) => ({
            queryKey: ["pricing-snapshot-items", snapshot.id],
            queryFn: () => listPricingSnapshotItems(snapshot.id),
            enabled: !!snapshot.id,
        })),
    })
    const currentSnapshotItems = useMemo<SnapshotTableItem[]>(() => {
        return viewItemQueries.flatMap((query, index) => {
            const snapshot = viewSnapshots[index]
            return (query.data ?? []).map((item) => ({ ...item, snapshot }))
        })
    }, [viewItemQueries, viewSnapshots])
    const baseItems = currentSnapshotItems
    const productFilterOptions = useMemo(() => {
        const map = new Map<number, Option>()
        lookups.products.forEach((option) => map.set(option.id, option))
        currentSnapshotItems.forEach((item) => {
            if (!item.product_id) return
            map.set(item.product_id, {
                id: item.product_id,
                label: item.product_name || `Sản phẩm #${item.product_id}`,
                sub: item.product_code,
            })
        })
        return Array.from(map.values()).sort((a, b) => formatOptionLabel(a).localeCompare(formatOptionLabel(b), "vi"))
    }, [currentSnapshotItems, lookups.products])
    const filteredItems = useMemo(() => {
        return baseItems.filter((item) => {
            if (itemProductId && item.product_id !== itemProductId) return false
            if (itemPricingGroupId && item.pricing_group_id !== itemPricingGroupId) return false
            return true
        })
    }, [baseItems, itemProductId, itemPricingGroupId])
    const tableLoading = viewItemQueries.some((query) => query.isLoading)
    const allRegionSnapshotValue = selectedSnapshot ? "__all_regions" : ""

    const totals = useMemo(() => {
        return filteredItems.reduce(
            (acc, item) => {
                acc.purchase += item.purchase_price_vnd ?? 0
                acc.warehouse += item.warehouse_price_vnd ?? 0
                acc.cash += item.cash_price_vnd ?? 0
                acc.warning += item.warning_text ? 1 : 0
                return acc
            },
            { purchase: 0, warehouse: 0, cash: 0, warning: 0 }
        )
    }, [filteredItems])

    const submit = () => {
        if (!form.pricing_month) return toast.error("Chọn tháng áp dụng")
        calculateMutation.mutate({
            ...form,
            pricing_date: today,
            code: form.code?.trim() || undefined,
            note: form.note?.trim() || undefined,
        })
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="bg-muted/30 border-b py-5">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">Chạy tính bảng giá</CardTitle>
                            <CardDescription className="mt-1">
                                Chọn tháng, vùng và phương pháp lấy giá mua. Hệ thống sẽ tự cộng phí, lợi nhuận, vận chuyển và xuất bảng giá.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
                        <Field label="Tháng áp dụng" required>
                            <MonthPicker
                                value={form.pricing_month}
                                placeholder="Chọn tháng áp dụng"
                                onChange={(value) => setForm((prev) => ({ ...prev, pricing_month: value }))}
                            />
                        </Field>
                        <Field label="Vùng áp dụng">
                            <OptionSelect
                                value={form.region_id}
                                options={lookups.regions}
                                placeholder="Tất cả vùng"
                                onChange={(value) => {
                                    setSelectedSnapshot(null)
                                    setItemProductId(undefined)
                                    setItemPricingGroupId(undefined)
                                    setForm((prev) => ({ ...prev, region_id: value }))
                                }}
                            />
                        </Field>
                        <Field label="Phương pháp lấy giá mua">
                            <Select
                                value={form.price_method ?? "WAVG"}
                                onValueChange={(value) =>
                                    setForm((prev) => ({ ...prev, price_method: value as PricingPriceMethod }))
                                }
                            >
                                <SelectTrigger className={cn(controlClass, "w-full !py-0")}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WAVG">Bình quân trong tháng</SelectItem>
                                    <SelectItem value="LATEST">Giá gần nhất</SelectItem>
                                    <SelectItem value="FIFO">Nhập trước xuất trước</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Button
                            size="lg"
                            className={cn(controlClass, "min-w-[160px] shadow-sm")}
                            onClick={submit}
                            disabled={calculateMutation.isPending}
                        >
                            {calculateMutation.isPending ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Calculator className="mr-2 h-4 w-4" />
                            )}
                            Tính bảng giá
                        </Button>
                    </div>
                    <div className="mt-4">
                        <Field label="Ghi chú nội bộ (không bắt buộc)">
                            <Textarea
                                className="min-h-[44px] resize-none py-2"
                                placeholder="VD: Áp dụng cho khu vực Tây Nguyên, có khuyến mãi tháng 5..."
                                value={form.note ?? ""}
                                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                            />
                        </Field>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric
                    icon={FileSpreadsheet}
                    label="Số dòng bảng giá"
                    value={formatNumber(filteredItems.length)}
                    tone="info"
                />
                <Metric
                    icon={Coins}
                    label="Tổng giá mua"
                    value={formatCurrency(totals.purchase)}
                    tone="default"
                />
                <Metric
                    icon={Warehouse}
                    label="Tổng giá tại kho"
                    value={formatCurrency(totals.warehouse)}
                    tone="primary"
                />
                <Metric
                    icon={AlertTriangle}
                    label="Dòng cần kiểm tra"
                    value={formatNumber(totals.warning)}
                    tone={totals.warning ? "warning" : "success"}
                />
            </div>

            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="space-y-4 border-b py-5">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] xl:items-end">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Bảng giá đã tính</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {latestSnapshots.length} kỳ
                                </Badge>
                            </div>
                            <CardDescription className="mt-1">
                                Chọn một lần tính để xem chi tiết theo nhóm sản phẩm và truy ngược nguồn giá.
                            </CardDescription>
                        </div>
                        <Field label="Chọn bảng giá để xem" className="min-w-0">
                            <Select
                                value={isAllRegionView ? allRegionSnapshotValue : (selectedSnapshot?.id ? String(selectedSnapshot.id) : "")}
                                onValueChange={(value) => {
                                    if (value === "__all_regions") return
                                    const snapshot = latestSnapshots.find((item) => String(item.id) === value)
                                    setSelectedSnapshot(snapshot ?? null)
                                }}
                            >
                                <SelectTrigger
                                    className={cn(
                                        controlClass,
                                        "w-full min-w-0 overflow-hidden !py-0 [&>span]:block [&>span]:min-w-0 [&>span]:truncate"
                                    )}
                                >
                                    <SelectValue placeholder="Chọn bảng giá" />
                                </SelectTrigger>
                                <SelectContent className="max-w-[min(720px,calc(100vw-32px))]">
                                    {isAllRegionView ? (
                                        <SelectItem value="__all_regions" textValue={selectedSnapshot ? allRegionSnapshotLabel(viewSnapshots, selectedSnapshot) : "Tất cả vùng"}>
                                            <div className="min-w-0 pr-4">
                                                <div className="truncate font-medium">{selectedSnapshot ? allRegionSnapshotLabel(viewSnapshots, selectedSnapshot) : "Tất cả vùng"}</div>
                                                <div className="text-muted-foreground truncate font-mono text-xs">
                                                    {viewSnapshots.map((snapshot) => snapshot.code).join(", ")}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ) : (
                                        latestSnapshots.map((snapshot) => (
                                            <SelectItem
                                                key={snapshot.id}
                                                value={String(snapshot.id)}
                                                textValue={snapshotShortLabel(snapshot, lookups.regions)}
                                            >
                                                <div className="min-w-0 pr-4">
                                                    <div className="truncate font-medium">
                                                        {snapshotShortLabel(snapshot, lookups.regions)}
                                                    </div>
                                                    <div className="text-muted-foreground truncate font-mono text-xs">
                                                        {snapshot.code}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                    <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5" />
                            Bộ lọc bảng giá
                        </div>
                        <div className="grid min-w-0 gap-3 md:grid-cols-2">
                            <Field label="Sản phẩm" className="min-w-0">
                                <OptionCombobox
                                    value={itemProductId}
                                    options={productFilterOptions}
                                    placeholder="Tất cả sản phẩm"
                                    searchPlaceholder="Tìm mã hoặc tên sản phẩm..."
                                    emptyText="Không tìm thấy sản phẩm"
                                    onChange={setItemProductId}
                                />
                            </Field>
                            <Field label="Mã nhóm báo giá" className="min-w-0">
                                <OptionCombobox
                                    value={itemPricingGroupId}
                                    options={lookups.pricingGroups}
                                    placeholder="Tất cả mã nhóm"
                                    searchPlaceholder="Tìm mã hoặc tên nhóm báo giá..."
                                    emptyText="Không tìm thấy mã nhóm báo giá"
                                    onChange={setItemPricingGroupId}
                                />
                            </Field>
                        </div>
                    </div>
                </CardHeader>

                {selectedSnapshot ? (
                    <SnapshotItemsTable
                        snapshot={selectedSnapshot}
                        snapshots={viewSnapshots}
                        items={filteredItems}
                        isLoading={tableLoading}
                        isAllRegionView={isAllRegionView}
                        lookups={lookups}
                    />
                ) : (
                    <EmptyState
                        icon={FileSpreadsheet}
                        title="Chưa chọn bảng giá"
                        description="Hãy chạy tính giá ở trên, hoặc chọn một bảng giá đã có để xem chi tiết."
                    />
                )}
            </Card>
        </div>
    )
}

type ConfigSectionKey =
    | "pricing-groups"
    | "packaging"
    | "margin"
    | "transport"
    | "promotion"
    | "alert"

type ConfigGroup = {
    title: string
    items: {
        key: ConfigSectionKey
        label: string
        description: string
        icon: React.ComponentType<{ className?: string }>
        tone: keyof typeof PANEL_TONES
    }[]
}

const CONFIG_GROUPS: ConfigGroup[] = [
    {
        title: "Danh mục cơ bản",
        items: [
            { key: "pricing-groups", label: "Mã nhóm báo giá", description: "Gom SKU cùng logic giá", icon: Tag, tone: "blue" },
            { key: "packaging", label: "Chi phí bao bì", description: "Cộng vào giá nguyên liệu", icon: Package, tone: "amber" },
        ],
    },
    {
        title: "Quy tắc tính giá",
        items: [
            { key: "margin", label: "Lợi nhuận & Phí BH", description: "Biên LN + 6 cấu phần phí", icon: TrendingUp, tone: "emerald" },
            { key: "transport", label: "Vận chuyển", description: "VC + phụ phí công nợ", icon: Truck, tone: "violet" },
        ],
    },
    {
        title: "Khuyến mãi & Cảnh báo",
        items: [
            { key: "promotion", label: "Khuyến mãi tháng", description: "Giảm giá theo nhóm/vùng", icon: Sparkles, tone: "pink" },
            { key: "alert", label: "Cảnh báo", description: "Ngưỡng giá NL & lợi nhuận", icon: Bell, tone: "rose" },
        ],
    },
]

function ConfigPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const [active, setActive] = useState<ConfigSectionKey>("pricing-groups")

    return (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <ConfigSidebar active={active} onChange={setActive} />
            <div className="min-w-0">
                {active === "pricing-groups" && <PricingGroupsPanel lookups={lookups} />}
                {active === "packaging" && <PackagingCostsPanel lookups={lookups} />}
                {active === "margin" && <MarginRulesPanel lookups={lookups} />}
                {active === "transport" && <TransportRulesPanel lookups={lookups} />}
                {active === "promotion" && <PromotionsPanel lookups={lookups} />}
                {active === "alert" && <AlertConfigsPanel lookups={lookups} />}
            </div>
        </div>
    )
}

function ConfigSidebar({
    active,
    onChange,
}: {
    active: ConfigSectionKey
    onChange: (key: ConfigSectionKey) => void
}) {
    return (
        <Card className="h-fit gap-0 py-0 shadow-sm lg:sticky lg:top-4">
            <div className="border-b px-4 py-3">
                <div className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <Settings2 className="h-3 w-3" />
                    Cấu hình giá
                </div>
            </div>
            <nav className="space-y-4 p-3">
                {CONFIG_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1">
                        <div className="text-muted-foreground/80 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider">
                            {group.title}
                        </div>
                        {group.items.map((item) => {
                            const isActive = active === item.key
                            const Icon = item.icon
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => onChange(item.key)}
                                    className={cn(
                                        "group flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                                        isActive
                                            ? "bg-primary/5 text-foreground"
                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
                                            isActive ? PANEL_TONES[item.tone] : "bg-muted/60 text-muted-foreground group-hover:bg-background"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className={cn("truncate text-sm font-medium", isActive && "font-semibold")}>
                                            {item.label}
                                        </div>
                                        <div className="text-muted-foreground truncate text-xs">
                                            {item.description}
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight className="text-primary mt-2 h-4 w-4 shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                ))}
            </nav>
        </Card>
    )
}

function PricingGroupsPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<PricingGroup | null>(null)
    const query = useQuery({
        queryKey: ["pricing-groups"],
        queryFn: () => pricingGroupsApi.list({ page: 1, size: 100, active: true }),
    })
    const remove = useMutation({
        mutationFn: pricingGroupsApi.delete,
        onSuccess: () => {
            toast.success("Đã xoá mã nhóm báo giá")
            queryClient.invalidateQueries({ queryKey: ["pricing-groups"] })
            queryClient.invalidateQueries({ queryKey: ["lookup-pricing-groups"] })
        },
        onError: showError("Xoá thất bại"),
    })
    const rows = query.data?.items ?? []

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <PanelHeader
                icon={Tag}
                tone="blue"
                title="Mã nhóm báo giá"
                description="Mã dùng để gom sản phẩm cùng logic giá, phí, lợi nhuận, vận chuyển và khuyến mãi."
                count={rows.length}
                action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Mã</TableHead>
                            <TableHead>Tên</TableHead>
                            <TableHead>Nhóm sản phẩm</TableHead>
                            <TableHead>ĐVT</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {query.isLoading && <SkeletonRows cols={5} rows={3} />}
                        {!query.isLoading && rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableCell className="font-mono font-semibold text-primary">{row.code}</TableCell>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell className="text-muted-foreground">{labelOf(lookups.productGroups, row.parent_product_group_id)}</TableCell>
                                <TableCell><Badge variant="outline" className="font-mono">{row.base_unit_code || "-"}</Badge></TableCell>
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!query.isLoading && !rows.length && <EmptyRow colSpan={5} icon={Tag} text="Chưa có mã nhóm báo giá" />}
                    </TableBody>
                </Table>
            </TableWrap>
            <PricingGroupDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <PricingGroupDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </Card>
    )
}

function PackagingCostsPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<PricingPackagingCost | null>(null)
    const query = useQuery({
        queryKey: ["pricing-packaging-costs"],
        queryFn: () => pricingPackagingCostsApi.list({ page: 1, size: 100, active: true }),
    })
    const remove = useMutation({
        mutationFn: pricingPackagingCostsApi.delete,
        onSuccess: () => {
            toast.success("Đã xoá chi phí bao bì")
            queryClient.invalidateQueries({ queryKey: ["pricing-packaging-costs"] })
        },
        onError: showError("Xoá thất bại"),
    })
    const rows = query.data?.items ?? []

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <PanelHeader
                icon={Package}
                tone="amber"
                title="Chi phí bao bì"
                description="Cộng vào giá nguyên liệu theo mã nhóm báo giá."
                count={rows.length}
                action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Mã nhóm báo giá</TableHead>
                            <TableHead>Tên cấu hình</TableHead>
                            <TableHead className="text-right">Chi phí/đv</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {query.isLoading && <SkeletonRows cols={4} rows={3} />}
                        {!query.isLoading && rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell className="text-muted-foreground">{row.name}</TableCell>
                                <MoneyCell value={row.cost_per_unit_vnd} strong />
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!query.isLoading && !rows.length && <EmptyRow colSpan={4} icon={Package} text="Chưa có chi phí bao bì" />}
                    </TableBody>
                </Table>
            </TableWrap>
            <PackagingCostDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <PackagingCostDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </Card>
    )
}

function MarginRulesPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<PricingMarginRule | null>(null)
    const query = useQuery({
        queryKey: ["pricing-margin-rules"],
        queryFn: () => pricingMarginRulesApi.list({ page: 1, size: 100 }),
    })
    const remove = useMutation({
        mutationFn: pricingMarginRulesApi.delete,
        onSuccess: () => {
            toast.success("Đã xoá cấu hình lợi nhuận")
            queryClient.invalidateQueries({ queryKey: ["pricing-margin-rules"] })
        },
        onError: showError("Xoá thất bại"),
    })

    const rows = query.data?.items ?? []

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <PanelHeader
                icon={TrendingUp}
                tone="emerald"
                title="Biên lợi nhuận & Phí bán hàng"
                description="Cấu hình %/số tiền lợi nhuận và 6 cấu phần phí bán hàng theo nhóm báo giá, vùng."
                count={rows.length}
                action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Mã nhóm báo giá</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>Lợi nhuận</TableHead>
                            <TableHead className="text-right">Phí bán hàng</TableHead>
                            <TableHead>An toàn</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {query.isLoading && <SkeletonRows cols={6} rows={3} />}
                        {!query.isLoading && rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {row.region_id ? labelOf(lookups.regions, row.region_id) : <Badge variant="outline">Mặc định</Badge>}
                                </TableCell>
                                <TableCell><Badge variant="secondary" className="font-mono">{marginLabel(row)}</Badge></TableCell>
                                <MoneyCell value={salesExpenseTotal(row)} strong />
                                <TableCell>
                                    {row.min_margin_safety_percent
                                        ? <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{`${formatNumber(row.min_margin_safety_percent)}%`}</span>
                                        : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell>
                                    <RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!query.isLoading && !rows.length && <EmptyRow colSpan={6} icon={TrendingUp} text="Chưa có cấu hình lợi nhuận" />}
                    </TableBody>
                </Table>
            </TableWrap>
            <MarginRuleDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <MarginRuleDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </Card>
    )
}

function TransportRulesPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<PricingTransportRule | null>(null)
    const query = useQuery({
        queryKey: ["pricing-transport-rules"],
        queryFn: () => pricingTransportRulesApi.list({ page: 1, size: 100 }),
    })
    const remove = useMutation({
        mutationFn: pricingTransportRulesApi.delete,
        onSuccess: () => {
            toast.success("Đã xoá cấu hình vận chuyển")
            queryClient.invalidateQueries({ queryKey: ["pricing-transport-rules"] })
        },
        onError: showError("Xoá thất bại"),
    })

    const rows = query.data?.items ?? []

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <PanelHeader
                icon={Truck}
                tone="violet"
                title="Vận chuyển & phụ phí"
                description="VC giao kho là phí vận chuyển; 7-10 / 30 ngày là phụ phí công nợ; giá nông dân cộng hoặc giảm riêng."
                count={rows.length}
                action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Áp dụng</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead className="text-right">VC giao kho</TableHead>
                            <TableHead className="text-right">PP 7-10 ngày</TableHead>
                            <TableHead className="text-right">PP 30 ngày</TableHead>
                            <TableHead className="text-right">Giá nông dân</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {query.isLoading && <SkeletonRows cols={7} rows={3} />}
                        {!query.isLoading && rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{transportTarget(row, lookups)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {row.region_id ? labelOf(lookups.regions, row.region_id) : <Badge variant="outline">Mặc định</Badge>}
                                </TableCell>
                                <MoneyCell value={row.transport_cost_vnd} />
                                <MoneyCell value={row.debt_7_10_surcharge_vnd ?? row.term_8_10_transport_cost_vnd} />
                                <MoneyCell value={row.debt_30_surcharge_vnd ?? row.term_30_transport_cost_vnd} />
                                <MoneyCell value={row.farmer_price_surcharge_vnd} />
                                <TableCell>
                                    <RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!query.isLoading && !rows.length && <EmptyRow colSpan={7} icon={Truck} text="Chưa có cấu hình vận chuyển" />}
                    </TableBody>
                </Table>
            </TableWrap>
            <TransportRuleDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <TransportRuleDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </Card>
    )
}

function PromotionsPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<PricingPromotion | null>(null)
    const query = useQuery({
        queryKey: ["pricing-promotions"],
        queryFn: () => pricingPromotionsApi.list({ page: 1, size: 100, active: true }),
    })
    const remove = useMutation({
        mutationFn: pricingPromotionsApi.delete,
        onSuccess: () => {
            toast.success("Đã xoá khuyến mãi")
            queryClient.invalidateQueries({ queryKey: ["pricing-promotions"] })
        },
        onError: showError("Xoá thất bại"),
    })
    const rows = query.data?.items ?? []

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <PanelHeader
                icon={Sparkles}
                tone="pink"
                title="Khuyến mãi tháng"
                description="Giảm giá theo nhóm báo giá, vùng và thời gian áp dụng."
                count={rows.length}
                action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>CTKM</TableHead>
                            <TableHead>Nhóm báo giá</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>Thời gian</TableHead>
                            <TableHead className="text-right">Giảm</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {query.isLoading && <SkeletonRows cols={6} rows={3} />}
                        {!query.isLoading && rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableCell>
                                    <div className="font-mono font-semibold text-pink-700 dark:text-pink-400">{row.code}</div>
                                    <div className="text-muted-foreground mt-0.5 text-xs">{row.name}</div>
                                </TableCell>
                                <TableCell className="font-medium">{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {row.region_id ? labelOf(lookups.regions, row.region_id) : <Badge variant="outline">Tất cả</Badge>}
                                </TableCell>
                                <TableCell className="text-xs tabular-nums whitespace-nowrap">
                                    {row.from_date} <ChevronRight className="inline h-3 w-3" /> {row.to_date}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary" className="font-mono">
                                        {row.discount_percent ? `${formatNumber(row.discount_percent)}%` : formatCurrency(row.discount_amount_vnd)}
                                    </Badge>
                                </TableCell>
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!query.isLoading && !rows.length && <EmptyRow colSpan={6} icon={Sparkles} text="Chưa có khuyến mãi" />}
                    </TableBody>
                </Table>
            </TableWrap>
            <PromotionDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <PromotionDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </Card>
    )
}

function AlertConfigsPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<PricingAlertConfig | null>(null)
    const query = useQuery({
        queryKey: ["pricing-alert-configs"],
        queryFn: () => pricingAlertConfigsApi.list({ page: 1, size: 100, active: true }),
    })
    const remove = useMutation({
        mutationFn: pricingAlertConfigsApi.delete,
        onSuccess: () => {
            toast.success("Đã xoá cấu hình cảnh báo")
            queryClient.invalidateQueries({ queryKey: ["pricing-alert-configs"] })
        },
        onError: showError("Xoá thất bại"),
    })
    const rows = query.data?.items ?? []

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <PanelHeader
                icon={Bell}
                tone="rose"
                title="Cảnh báo"
                description="Cảnh báo khi giá nguyên liệu tăng mạnh hoặc biên lợi nhuận thấp hơn ngưỡng."
                count={rows.length}
                action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader className="bg-muted/40">
                        <TableRow>
                            <TableHead>Nhóm báo giá</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead className="text-right">Ngưỡng tăng giá</TableHead>
                            <TableHead className="text-right">LN tối thiểu</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {query.isLoading && <SkeletonRows cols={5} rows={3} />}
                        {!query.isLoading && rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {row.region_id ? labelOf(lookups.regions, row.region_id) : <Badge variant="outline">Tất cả</Badge>}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    <Badge variant="secondary" className="font-mono">{formatNumber(row.price_change_threshold_percent)}%</Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {row.min_margin_percent ? <Badge variant="secondary" className="font-mono">{`${formatNumber(row.min_margin_percent)}%`}</Badge> : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!query.isLoading && !rows.length && <EmptyRow colSpan={5} icon={Bell} text="Chưa có cấu hình cảnh báo" />}
                    </TableBody>
                </Table>
            </TableWrap>
            <AlertConfigDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <AlertConfigDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </Card>
    )
}

function SnapshotItemsTable({
    snapshot,
    snapshots,
    items,
    isLoading,
    isAllRegionView,
    lookups,
}: {
    snapshot: PricingSnapshot
    snapshots: PricingSnapshot[]
    items: SnapshotTableItem[]
    isLoading: boolean
    isAllRegionView?: boolean
    lookups: ReturnType<typeof usePricingLookups>
}) {
    const [sourceItem, setSourceItem] = useState<PricingSnapshotItem | null>(null)
    const groupedItems = useMemo(() => {
        const groups = new Map<string, { key: string; label: string; items: SnapshotTableItem[] }>()
        items.forEach((item) => {
            const key = item.pricing_group_id ? String(item.pricing_group_id) : "none"
            const label = labelOf(lookups.pricingGroups, item.pricing_group_id)
            if (!groups.has(key)) groups.set(key, { key, label, items: [] })
            groups.get(key)!.items.push(item)
        })
        return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "vi"))
    }, [items, lookups.pricingGroups])

    return (
        <>
            <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-6 py-3 text-sm">
                <Badge variant="secondary" className="font-mono">
                    {isAllRegionView ? `${snapshots.length} vùng` : snapshot.code}
                </Badge>
                <span className="text-muted-foreground">·</span>
                <Badge variant="secondary" className="font-mono">{snapshot.pricing_month}</Badge>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium">{isAllRegionView ? "Tất cả vùng" : snapshotRegionLabel(snapshot)}</span>
                <span className="text-muted-foreground">·</span>
                <Badge variant="outline">{priceMethodLabel(snapshot.price_method)}</Badge>
            </div>
            <div className="space-y-6 p-6">
                {isLoading && !items.length && (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full" />)}
                    </div>
                )}
                {groupedItems.map((group) => (
                    <section key={group.key} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                                    <Layers className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold leading-tight">{group.label}</h3>
                                    <p className="text-muted-foreground text-xs">{group.items.length} dòng bảng giá</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {group.items.map((item, index) => {
                                const rowSnapshot = item.snapshot ?? snapshot
                                return (
                                    <PriceItemCard
                                        key={`${rowSnapshot.id}-${item.id}`}
                                        index={index + 1}
                                        item={item}
                                        regionLabel={snapshotRegionLabel(rowSnapshot)}
                                        onInspect={() => setSourceItem(item)}
                                    />
                                )
                            })}
                        </div>
                    </section>
                ))}
                {!isLoading && !items.length && (
                    <EmptyState
                        icon={Inbox}
                        title="Bảng giá này chưa có dòng"
                        description="Có thể chưa có hợp đồng mua hoặc cấu hình giá cho kỳ này. Hãy kiểm tra cấu hình."
                    />
                )}
            </div>
            {sourceItem && <SourcesDialog item={sourceItem} open={!!sourceItem} onOpenChange={(value) => !value && setSourceItem(null)} />}
        </>
    )
}

function PriceItemCard({ index, item, regionLabel, onInspect }: { index: number; item: SnapshotTableItem; regionLabel: string; onInspect: () => void }) {
    const hasWarning = !!item.warning_text
    return (
        <div
            className={cn(
                "group bg-card overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md",
                hasWarning && "border-destructive/30"
            )}
        >
            {/* Card header */}
            <div className="bg-muted/30 grid gap-0 border-b lg:grid-cols-[56px_minmax(280px,1.4fr)_minmax(180px,1fr)_auto]">
                <div className="bg-muted/50 text-muted-foreground flex items-center justify-center border-b font-mono text-sm font-semibold tabular-nums lg:border-b-0 lg:border-r">
                    #{index}
                </div>
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {item.product_code}
                        </span>
                        {hasWarning ? (
                            <Badge variant="destructive" className="gap-1 text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                Cần kiểm tra
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="gap-1 border-emerald-300 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                            >
                                <CheckCircle2 className="h-3 w-3" />
                                Hợp lệ
                            </Badge>
                        )}
                    </div>
                    <div className="mt-2 text-base font-bold leading-snug">{item.product_name}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        ĐVT: <span className="font-medium">{item.sale_unit_name || item.sale_unit_code || item.base_unit_code || "-"}</span>
                    </div>
                </div>
                <div className="border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Vùng áp dụng</div>
                    <div className="mt-1 text-sm font-semibold">{regionLabel}</div>
                    <div className="text-muted-foreground mt-2 text-xs">
                        {item.source_summary || <span className="italic">Không có nguồn</span>}
                    </div>
                </div>
                <div className="flex items-center justify-end p-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={onInspect}>
                                <Eye className="mr-2 h-4 w-4" />
                                Kiểm tra
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Xem nguồn giá mua & cấu hình áp dụng</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Price blocks */}
            <div className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                <PriceBlock title="Cấu thành giá" icon={Database}>
                    <PriceLine label="Giá mua" value={item.purchase_price_vnd} />
                    <PriceLine label="Bao bì" value={item.packaging_cost_vnd} />
                    <PriceLine label="Phí bán hàng" value={item.sales_expense_vnd} />
                    <Separator className="my-1" />
                    <PriceLine label="Giá thành" value={item.cogs_vnd ?? item.base_price_vnd} strong />
                </PriceBlock>
                <PriceBlock title="Giá nền" icon={TrendingUp}>
                    <PriceLine label="Lợi nhuận" value={item.margin_amount_vnd} tone="success" />
                    <PriceLine label="Trước VAT" value={item.base_sale_price_vnd ?? item.base_price_vnd} strong />
                    <Separator className="my-1" />
                    <PriceLine label="Khách lẻ tại kho" value={item.warehouse_retail_vat_vnd ?? item.warehouse_price_vnd} tone="primary" />
                </PriceBlock>
                <PriceBlock title="Khách lẻ công nợ" icon={Coins}>
                    <PriceLine label="7-10 ngày" value={item.debt_7_10_retail_vat_vnd} />
                    <PriceLine label="30 ngày" value={item.debt_30_retail_vat_vnd} />
                </PriceBlock>
                <PriceBlock title="Đại lý & nông dân" icon={Warehouse}>
                    <PriceLine label="Đại lý tại kho" value={item.warehouse_dealer_vat_vnd ?? item.cash_price_vnd} tone="primary" />
                    <PriceLine label="Đại lý 7-10 ngày" value={item.debt_7_10_dealer_vat_vnd ?? item.term_8_10_price_vnd} />
                    <PriceLine label="Đại lý 30 ngày" value={item.debt_30_dealer_vat_vnd ?? item.term_30_price_vnd} />
                    <PriceLine label="Giá nông dân" value={item.farmer_price_vnd} tone="warning" />
                </PriceBlock>
            </div>

            {hasWarning && (
                <div className="border-destructive/20 bg-destructive/5 flex items-start gap-2 border-t px-4 py-3">
                    <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                    <div className="text-destructive text-sm font-medium">{item.warning_text}</div>
                </div>
            )}
        </div>
    )
}

function PriceBlock({ title, icon: Icon, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
    return (
        <div className="p-4">
            <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                {Icon && <Icon className="h-3 w-3" />}
                {title}
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    )
}

function PriceLine({ label, value, strong, tone }: { label: string; value?: number; strong?: boolean; tone?: "primary" | "warning" | "success" }) {
    return (
        <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span
                className={cn(
                    "text-right tabular-nums",
                    strong && "text-foreground font-bold",
                    !strong && !tone && "text-foreground",
                    tone === "primary" && "text-primary font-bold",
                    tone === "warning" && "font-bold text-amber-700 dark:text-amber-500",
                    tone === "success" && "font-semibold text-emerald-700 dark:text-emerald-400"
                )}
            >
                {formatCurrency(value)}
            </span>
        </div>
    )
}

function MarginRuleDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingMarginRule; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingMarginRule>>(() => ({
        region_id: rule?.region_id,
        group_id: rule?.group_id,
        pricing_group_id: rule?.pricing_group_id,
        margin_type: rule?.margin_type ?? "PERCENT",
        margin_value: rule?.margin_value ?? 0,
        warehouse_adjustment_vnd: rule?.warehouse_adjustment_vnd ?? 0,
        cash_adjustment_vnd: rule?.cash_adjustment_vnd ?? 0,
        term_8_10_adjustment_vnd: rule?.term_8_10_adjustment_vnd ?? 0,
        term_30_adjustment_vnd: rule?.term_30_adjustment_vnd ?? 0,
        hd_nam_vip_vnd_per_unit: rule?.hd_nam_vip_vnd_per_unit ?? 0,
        qua_nd_vnd_per_unit: rule?.qua_nd_vnd_per_unit ?? 0,
        ck_quy_vnd_per_unit: rule?.ck_quy_vnd_per_unit ?? 0,
        dlsk_vnd_per_unit: rule?.dlsk_vnd_per_unit ?? 0,
        quy_mkt_kd_vnd_per_unit: rule?.quy_mkt_kd_vnd_per_unit ?? 0,
        thuong_sale_vnd_per_unit: rule?.thuong_sale_vnd_per_unit ?? 0,
        min_margin_safety_percent: rule?.min_margin_safety_percent,
        priority: rule?.priority ?? 100,
        active: rule?.active ?? true,
    }))
    const mutation = useMutation({
        mutationFn: (body: Partial<PricingMarginRule>) => rule ? pricingMarginRulesApi.update({ ...body, id: rule.id }) : pricingMarginRulesApi.create(body),
        onSuccess: async () => {
            toast.success("Đã lưu cấu hình lợi nhuận")
            await queryClient.invalidateQueries({ queryKey: ["pricing-margin-rules"] })
            onOpenChange(false)
        },
        onError: showError("Lưu thất bại"),
    })

    const submit = () => {
        if (!form.pricing_group_id) return toast.error("Chọn mã nhóm báo giá")
        mutation.mutate({
            ...form,
            group_id: undefined,
            margin_value: Number(form.margin_value ?? 0),
            warehouse_adjustment_vnd: Number(form.warehouse_adjustment_vnd ?? 0),
            cash_adjustment_vnd: Number(form.cash_adjustment_vnd ?? 0),
            term_8_10_adjustment_vnd: Number(form.term_8_10_adjustment_vnd ?? 0),
            term_30_adjustment_vnd: Number(form.term_30_adjustment_vnd ?? 0),
            hd_nam_vip_vnd_per_unit: Number(form.hd_nam_vip_vnd_per_unit ?? 0),
            qua_nd_vnd_per_unit: Number(form.qua_nd_vnd_per_unit ?? 0),
            ck_quy_vnd_per_unit: Number(form.ck_quy_vnd_per_unit ?? 0),
            dlsk_vnd_per_unit: Number(form.dlsk_vnd_per_unit ?? 0),
            quy_mkt_kd_vnd_per_unit: Number(form.quy_mkt_kd_vnd_per_unit ?? 0),
            thuong_sale_vnd_per_unit: Number(form.thuong_sale_vnd_per_unit ?? 0),
            min_margin_safety_percent: form.min_margin_safety_percent === undefined ? undefined : Number(form.min_margin_safety_percent),
            priority: Number(form.priority ?? 100),
            active: form.active !== false,
        })
    }

    const totalSalesExpense = salesExpenseTotal(form)

    return (
        <RuleDialog title={rule ? "Sửa lợi nhuận & phí bán hàng" : "Thêm lợi nhuận & phí bán hàng"} description="Áp dụng theo mã nhóm báo giá và vùng. Phí bán hàng là 6 cấu phần cộng vào giá mua trước khi tính lợi nhuận." open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Mã nhóm báo giá">
                <OptionSelect value={form.pricing_group_id} options={lookups.pricingGroups} required placeholder="Chọn mã nhóm báo giá" onChange={(value) => setForm((prev) => ({ ...prev, pricing_group_id: value }))} />
            </Field>
            <Field label="Vùng">
                <OptionSelect value={form.region_id} options={lookups.regions} placeholder="Mặc định tất cả vùng" onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))} />
            </Field>
            <Tabs defaultValue="margin" className="gap-4">
                <TabsList className="grid w-full grid-cols-2 rounded-md">
                    <TabsTrigger value="margin">Lợi nhuận</TabsTrigger>
                    <TabsTrigger value="expense">Phí bán hàng</TabsTrigger>
                </TabsList>
                <TabsContent value="margin" className="space-y-4">
                    <Field label="Kiểu lợi nhuận">
                        <Select value={form.margin_type ?? "PERCENT"} onValueChange={(value) => setForm((prev) => ({ ...prev, margin_type: value as PricingMarginType }))}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PERCENT">Theo % giá thành</SelectItem>
                                <SelectItem value="AMOUNT">Theo VND/đơn vị</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label={form.margin_type === "AMOUNT" ? "Lợi nhuận VND/đơn vị" : "Lợi nhuận (%)"}>
                        <NumberInput value={form.margin_value} onChange={(value) => setForm((prev) => ({ ...prev, margin_value: value }))} />
                    </Field>
                    <Field label="Lợi nhuận tối thiểu an toàn (%)">
                        <NumberInput value={form.min_margin_safety_percent} onChange={(value) => setForm((prev) => ({ ...prev, min_margin_safety_percent: value }))} />
                    </Field>
                    <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                        Công thức: Giá thành = Giá mua + Phí bán hàng. Giá nền trước VAT = Giá thành + Lợi nhuận, sau đó làm tròn.
                    </p>
                </TabsContent>
                <TabsContent value="expense" className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="HD năm VIP"><NumberInput value={form.hd_nam_vip_vnd_per_unit} onChange={(value) => setForm((prev) => ({ ...prev, hd_nam_vip_vnd_per_unit: value }))} /></Field>
                        <Field label="Quà nông dân"><NumberInput value={form.qua_nd_vnd_per_unit} onChange={(value) => setForm((prev) => ({ ...prev, qua_nd_vnd_per_unit: value }))} /></Field>
                        <Field label="Chiết khấu quý"><NumberInput value={form.ck_quy_vnd_per_unit} onChange={(value) => setForm((prev) => ({ ...prev, ck_quy_vnd_per_unit: value }))} /></Field>
                        <Field label="Du lịch sự kiện"><NumberInput value={form.dlsk_vnd_per_unit} onChange={(value) => setForm((prev) => ({ ...prev, dlsk_vnd_per_unit: value }))} /></Field>
                        <Field label="Quỹ MKT-KD"><NumberInput value={form.quy_mkt_kd_vnd_per_unit} onChange={(value) => setForm((prev) => ({ ...prev, quy_mkt_kd_vnd_per_unit: value }))} /></Field>
                        <Field label="Thưởng sale"><NumberInput value={form.thuong_sale_vnd_per_unit} onChange={(value) => setForm((prev) => ({ ...prev, thuong_sale_vnd_per_unit: value }))} /></Field>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        <span className="text-muted-foreground">Tổng phí bán hàng: </span>
                        <span className="font-semibold">{formatCurrency(totalSalesExpense)}</span>
                    </div>
                </TabsContent>
            </Tabs>
        </RuleDialog>
    )
}

function TransportRuleDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingTransportRule; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingTransportRule>>(() => ({
        region_id: rule?.region_id,
        match_type: rule?.match_type === "GROUP" ? "PRICING_GROUP" : rule?.match_type ?? "PRICING_GROUP",
        product_id: rule?.product_id,
        group_id: rule?.group_id,
        pricing_group_id: rule?.pricing_group_id,
        transport_cost_vnd: rule?.transport_cost_vnd ?? 0,
        cash_transport_cost_vnd: rule?.cash_transport_cost_vnd ?? 0,
        term_8_10_transport_cost_vnd: rule?.term_8_10_transport_cost_vnd ?? 0,
        term_30_transport_cost_vnd: rule?.term_30_transport_cost_vnd ?? 0,
        debt_7_10_surcharge_vnd: rule?.debt_7_10_surcharge_vnd ?? rule?.term_8_10_transport_cost_vnd ?? 0,
        debt_30_surcharge_vnd: rule?.debt_30_surcharge_vnd ?? rule?.term_30_transport_cost_vnd ?? 0,
        farmer_price_surcharge_vnd: rule?.farmer_price_surcharge_vnd ?? 0,
        priority: rule?.priority ?? 100,
        active: rule?.active ?? true,
    }))
    const mutation = useMutation({
        mutationFn: (body: Partial<PricingTransportRule>) => rule ? pricingTransportRulesApi.update({ ...body, id: rule.id }) : pricingTransportRulesApi.create(body),
        onSuccess: async () => {
            toast.success("Đã lưu cấu hình vận chuyển")
            await queryClient.invalidateQueries({ queryKey: ["pricing-transport-rules"] })
            onOpenChange(false)
        },
        onError: showError("Lưu thất bại"),
    })

    const submit = () => {
        if (form.match_type === "PRODUCT" && !form.product_id) return toast.error("Chọn sản phẩm")
        if (form.match_type === "PRICING_GROUP" && !form.pricing_group_id) return toast.error("Chọn mã nhóm báo giá")
        mutation.mutate({
            ...form,
            product_id: form.match_type === "PRODUCT" ? form.product_id : undefined,
            pricing_group_id: form.match_type === "PRICING_GROUP" ? form.pricing_group_id : undefined,
            group_id: undefined,
            transport_cost_vnd: Number(form.transport_cost_vnd ?? 0),
            cash_transport_cost_vnd: 0,
            term_8_10_transport_cost_vnd: Number(form.debt_7_10_surcharge_vnd ?? 0),
            term_30_transport_cost_vnd: Number(form.debt_30_surcharge_vnd ?? 0),
            debt_7_10_surcharge_vnd: Number(form.debt_7_10_surcharge_vnd ?? 0),
            debt_30_surcharge_vnd: Number(form.debt_30_surcharge_vnd ?? 0),
            farmer_price_surcharge_vnd: Number(form.farmer_price_surcharge_vnd ?? 0),
            priority: form.match_type === "PRODUCT" ? 10 : form.match_type === "PRICING_GROUP" ? 20 : 40,
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa vận chuyển & phụ phí" : "Thêm vận chuyển & phụ phí"} description="VC giao kho dùng cho giá đại lý. Phụ phí công nợ là khoản cộng riêng cho giá nợ 7-10 ngày và 30 ngày. Giá nông dân có thể cộng hoặc giảm." open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Vùng">
                <OptionSelect value={form.region_id} options={lookups.regions} placeholder="Mặc định tất cả vùng" onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))} />
            </Field>
            <Field label="Áp dụng cho">
                <Select value={form.match_type ?? "PRICING_GROUP"} onValueChange={(value) => setForm((prev) => ({ ...prev, match_type: value as PricingTransportMatchType, product_id: undefined, group_id: undefined, pricing_group_id: undefined }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PRICING_GROUP">Mã nhóm báo giá</SelectItem>
                        <SelectItem value="PRODUCT">Sản phẩm cụ thể</SelectItem>
                        <SelectItem value="DEFAULT">Mặc định</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            {form.match_type === "PRICING_GROUP" && (
                <Field label="Mã nhóm báo giá">
                    <OptionSelect value={form.pricing_group_id} options={lookups.pricingGroups} required placeholder="Chọn mã nhóm báo giá" onChange={(value) => setForm((prev) => ({ ...prev, pricing_group_id: value }))} />
                </Field>
            )}
            {form.match_type === "PRODUCT" && (
                <Field label="Sản phẩm">
                    <OptionSelect value={form.product_id} options={lookups.products} required placeholder="Chọn sản phẩm" onChange={(value) => setForm((prev) => ({ ...prev, product_id: value }))} />
                </Field>
            )}
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="VC giao kho đại lý"><NumberInput value={form.transport_cost_vnd} onChange={(value) => setForm((prev) => ({ ...prev, transport_cost_vnd: value }))} /></Field>
                <Field label="Cộng/giảm giá nông dân"><NumberInput value={form.farmer_price_surcharge_vnd} onChange={(value) => setForm((prev) => ({ ...prev, farmer_price_surcharge_vnd: value }))} /></Field>
                <Field label="Phụ phí nợ 7-10 ngày"><NumberInput value={form.debt_7_10_surcharge_vnd} onChange={(value) => setForm((prev) => ({ ...prev, debt_7_10_surcharge_vnd: value }))} /></Field>
                <Field label="Phụ phí nợ 30 ngày"><NumberInput value={form.debt_30_surcharge_vnd} onChange={(value) => setForm((prev) => ({ ...prev, debt_30_surcharge_vnd: value }))} /></Field>
            </div>
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                Thứ tự ưu tiên khi tính: sản phẩm cụ thể → mã nhóm báo giá → mặc định vùng → mặc định toàn hệ thống.
            </p>
        </RuleDialog>
    )
}

function PricingGroupDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingGroup; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingGroup>>(() => ({
        code: rule?.code ?? "",
        name: rule?.name ?? "",
        parent_product_group_id: rule?.parent_product_group_id,
        base_unit_code: rule?.base_unit_code ?? "KG",
        description: rule?.description ?? "",
        sort_order: rule?.sort_order ?? 100,
        active: rule?.active ?? true,
    }))
    const mutation = useMutation({
        mutationFn: (body: Partial<PricingGroup>) => rule ? pricingGroupsApi.update({ ...body, id: rule.id }) : pricingGroupsApi.create(body),
        onSuccess: async () => {
            toast.success("Đã lưu mã nhóm báo giá")
            await queryClient.invalidateQueries({ queryKey: ["pricing-groups"] })
            await queryClient.invalidateQueries({ queryKey: ["lookup-pricing-groups"] })
            onOpenChange(false)
        },
        onError: showError("Lưu thất bại"),
    })
    const submit = () => {
        if (!form.code?.trim()) return toast.error("Nhập mã nhóm báo giá")
        if (!form.name?.trim()) return toast.error("Nhập tên nhóm báo giá")
        mutation.mutate({
            ...form,
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            sort_order: Number(form.sort_order ?? 100),
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa mã nhóm báo giá" : "Thêm mã nhóm báo giá"} description="Mã nhóm báo giá là nhóm chi tiết từ file BA, dùng để gom SKU cùng logic giá." open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Nhóm sản phẩm">
                <OptionSelect
                    value={form.parent_product_group_id}
                    options={lookups.productGroups}
                    placeholder="Chọn nhóm sản phẩm cha"
                    onChange={(value) => setForm((prev) => ({ ...prev, parent_product_group_id: value }))}
                />
            </Field>
            <Field label="Mã">
                <Input value={form.code ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="VD: BLL-25" />
            </Field>
            <Field label="Tên">
                <Input value={form.name ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="VD: Bón lá lỏng size 25" />
            </Field>
            <Field label="Đơn vị chuẩn">
                <Input value={form.base_unit_code ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, base_unit_code: event.target.value.toUpperCase() }))} placeholder="KG, LIT..." />
            </Field>
            <Field label="Ghi chú">
                <Textarea value={form.description ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </Field>
        </RuleDialog>
    )
}

function PackagingCostDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingPackagingCost; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingPackagingCost>>(() => ({
        pricing_group_id: rule?.pricing_group_id,
        name: rule?.name ?? "",
        cost_per_unit_vnd: rule?.cost_per_unit_vnd ?? 0,
        note: rule?.note ?? "",
        active: rule?.active ?? true,
    }))
    const mutation = useMutation({
        mutationFn: (body: Partial<PricingPackagingCost>) => rule ? pricingPackagingCostsApi.update({ ...body, id: rule.id }) : pricingPackagingCostsApi.create(body),
        onSuccess: async () => {
            toast.success("Đã lưu chi phí bao bì")
            await queryClient.invalidateQueries({ queryKey: ["pricing-packaging-costs"] })
            onOpenChange(false)
        },
        onError: showError("Lưu thất bại"),
    })
    const submit = () => {
        if (!form.pricing_group_id) return toast.error("Chọn mã nhóm báo giá")
        if (!form.name?.trim()) return toast.error("Nhập tên bao bì")
        mutation.mutate({
            ...form,
            name: form.name.trim(),
            cost_per_unit_vnd: Number(form.cost_per_unit_vnd ?? 0),
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa chi phí bao bì" : "Thêm chi phí bao bì"} description="Bao bì được cộng vào giá nguyên liệu theo mã nhóm báo giá." open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Mã nhóm báo giá">
                <OptionSelect value={form.pricing_group_id} options={lookups.pricingGroups} required placeholder="Chọn mã nhóm báo giá" onChange={(value) => setForm((prev) => ({ ...prev, pricing_group_id: value }))} />
            </Field>
            <Field label="Tên cấu hình"><Input value={form.name ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></Field>
            <Field label="Chi phí/đơn vị"><NumberInput value={form.cost_per_unit_vnd} onChange={(value) => setForm((prev) => ({ ...prev, cost_per_unit_vnd: value }))} /></Field>
            <Field label="Ghi chú"><Textarea value={form.note ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} /></Field>
        </RuleDialog>
    )
}

function PromotionDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingPromotion; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingPromotion>>(() => ({
        code: rule?.code ?? "",
        name: rule?.name ?? "",
        pricing_group_id: rule?.pricing_group_id,
        region_id: rule?.region_id,
        from_date: rule?.from_date ?? today,
        to_date: rule?.to_date ?? today,
        discount_percent: rule?.discount_percent ?? 0,
        discount_amount_vnd: rule?.discount_amount_vnd ?? 0,
        note: rule?.note ?? "",
        active: rule?.active ?? true,
    }))
    const mutation = useMutation({
        mutationFn: (body: Partial<PricingPromotion>) => rule ? pricingPromotionsApi.update({ ...body, id: rule.id }) : pricingPromotionsApi.create(body),
        onSuccess: async () => {
            toast.success("Đã lưu khuyến mãi")
            await queryClient.invalidateQueries({ queryKey: ["pricing-promotions"] })
            onOpenChange(false)
        },
        onError: showError("Lưu thất bại"),
    })
    const submit = () => {
        if (!form.code?.trim()) return toast.error("Nhập mã CTKM")
        if (!form.name?.trim()) return toast.error("Nhập tên CTKM")
        if (!form.pricing_group_id) return toast.error("Chọn mã nhóm báo giá")
        mutation.mutate({
            ...form,
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            discount_percent: Number(form.discount_percent ?? 0),
            discount_amount_vnd: Number(form.discount_amount_vnd ?? 0),
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa khuyến mãi" : "Thêm khuyến mãi"} description="Khuyến mãi làm giảm giá nền trước VAT trước khi ra các cột giá bán." open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Mã CTKM"><Input value={form.code ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></Field>
            <Field label="Tên CTKM"><Input value={form.name ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></Field>
            <Field label="Mã nhóm báo giá"><OptionSelect value={form.pricing_group_id} options={lookups.pricingGroups} required placeholder="Chọn mã nhóm báo giá" onChange={(value) => setForm((prev) => ({ ...prev, pricing_group_id: value }))} /></Field>
            <Field label="Vùng"><OptionSelect value={form.region_id} options={lookups.regions} placeholder="Tất cả vùng" onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))} /></Field>
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="Từ ngày"><Input type="date" value={form.from_date ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, from_date: event.target.value }))} /></Field>
                <Field label="Đến ngày"><Input type="date" value={form.to_date ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, to_date: event.target.value }))} /></Field>
                <Field label="Giảm %"><NumberInput value={form.discount_percent} onChange={(value) => setForm((prev) => ({ ...prev, discount_percent: value }))} /></Field>
                <Field label="Giảm VND"><NumberInput value={form.discount_amount_vnd} onChange={(value) => setForm((prev) => ({ ...prev, discount_amount_vnd: value }))} /></Field>
            </div>
            <Field label="Ghi chú"><Textarea value={form.note ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} /></Field>
        </RuleDialog>
    )
}

function AlertConfigDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingAlertConfig; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingAlertConfig>>(() => ({
        pricing_group_id: rule?.pricing_group_id,
        region_id: rule?.region_id,
        price_change_threshold_percent: rule?.price_change_threshold_percent ?? 5,
        min_margin_percent: rule?.min_margin_percent ?? 0,
        active: rule?.active ?? true,
    }))
    const mutation = useMutation({
        mutationFn: (body: Partial<PricingAlertConfig>) => rule ? pricingAlertConfigsApi.update({ ...body, id: rule.id }) : pricingAlertConfigsApi.create(body),
        onSuccess: async () => {
            toast.success("Đã lưu cấu hình cảnh báo")
            await queryClient.invalidateQueries({ queryKey: ["pricing-alert-configs"] })
            onOpenChange(false)
        },
        onError: showError("Lưu thất bại"),
    })
    const submit = () => {
        if (!form.pricing_group_id) return toast.error("Chọn mã nhóm báo giá")
        mutation.mutate({
            ...form,
            price_change_threshold_percent: Number(form.price_change_threshold_percent ?? 0),
            min_margin_percent: Number(form.min_margin_percent ?? 0),
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa cảnh báo" : "Thêm cảnh báo"} description="Dùng để báo khi giá nguyên liệu tăng quá ngưỡng hoặc biên lợi nhuận thấp." open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Mã nhóm báo giá"><OptionSelect value={form.pricing_group_id} options={lookups.pricingGroups} required placeholder="Chọn mã nhóm báo giá" onChange={(value) => setForm((prev) => ({ ...prev, pricing_group_id: value }))} /></Field>
            <Field label="Vùng"><OptionSelect value={form.region_id} options={lookups.regions} placeholder="Tất cả vùng" onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))} /></Field>
            <Field label="Cảnh báo tăng giá NL (%)"><NumberInput value={form.price_change_threshold_percent} onChange={(value) => setForm((prev) => ({ ...prev, price_change_threshold_percent: value }))} /></Field>
            <Field label="Lợi nhuận tối thiểu (%)"><NumberInput value={form.min_margin_percent} onChange={(value) => setForm((prev) => ({ ...prev, min_margin_percent: value }))} /></Field>
        </RuleDialog>
    )
}

function SourcesDialog({ item, open, onOpenChange }: { item: PricingSnapshotItem; open: boolean; onOpenChange: (open: boolean) => void }) {
    const query = useQuery({
        queryKey: ["pricing-snapshot-item-sources", item.id],
        queryFn: () => listPricingSnapshotItemSources(item.id),
        enabled: open,
    })
    const rows = query.data ?? []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                            <Eye className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Nguồn giá mua & cấu hình áp dụng</DialogTitle>
                            <DialogDescription className="mt-1">
                                <span className="bg-primary/10 text-primary mr-2 rounded-md px-1.5 py-0.5 font-mono text-xs font-bold">{item.product_code}</span>
                                {item.product_name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="bg-muted/30 grid gap-4 rounded-lg border p-4 text-sm md:grid-cols-2">
                    <AuditLine label="Giá mua" value={formatCurrency(item.purchase_price_vnd)} />
                    <AuditLine label="Bao bì" value={formatCurrency(item.packaging_cost_vnd)} />
                    <AuditLine label="Phí bán hàng" value={formatCurrency(item.sales_expense_vnd)} />
                    <AuditLine label="Chi tiết phí BH" value={item.sales_expense_breakdown_text || "-"} wide />
                    <AuditLine label="Lợi nhuận" value={formatCurrency(item.margin_amount_vnd)} />
                    <AuditLine label="Khuyến mãi" value={formatCurrency(item.promo_amount_vnd)} />
                    <AuditLine label="Vận chuyển đại lý" value={formatCurrency(item.transport_cost_vnd)} />
                    <AuditLine label="Trace config" value={item.config_trace_text || "-"} wide />
                </div>
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow>
                                <TableHead>Hợp đồng</TableHead>
                                <TableHead>Ngày</TableHead>
                                <TableHead className="text-right">Số lượng</TableHead>
                                <TableHead className="text-right">Giá nguồn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {query.isLoading && <SkeletonRows cols={4} rows={2} />}
                            {!query.isLoading && rows.map((row: PricingSnapshotItemSource) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableCell className="font-mono font-semibold">{row.contract_code || `#${row.contract_id}`}</TableCell>
                                    <TableCell className="text-muted-foreground tabular-nums">{row.source_date || "-"}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatNumber(row.source_quantity)}</TableCell>
                                    <MoneyCell value={row.source_price_vnd} strong />
                                </TableRow>
                            ))}
                            {!query.isLoading && !rows.length && <EmptyRow colSpan={4} icon={Inbox} text="Không có nguồn chi tiết" />}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function AuditLine({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
    return (
        <div className={cn("min-w-0", wide && "md:col-span-2")}>
            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{label}</div>
            <div className="mt-1 break-words text-sm font-semibold tabular-nums">{value}</div>
        </div>
    )
}

function RuleDialog({
    title,
    description = "Nhập cấu hình để hệ thống cộng vào giá mua khi tính bảng giá.",
    open,
    onOpenChange,
    onSubmit,
    loading,
    children,
}: {
    title: string
    description?: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    loading?: boolean
    children: React.ReactNode
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg">{title}</DialogTitle>
                            <DialogDescription className="mt-1">{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="grid gap-4">{children}</div>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Đóng
                    </Button>
                    <Button onClick={onSubmit} disabled={loading}>
                        {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Lưu cấu hình
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function usePricingLookups() {
    const pricingGroupsQuery = useQuery({
        queryKey: ["lookup-pricing-groups"],
        queryFn: () => pricingGroupsApi.list({ page: 1, size: 200, active: true }),
    })
    const regionsQuery = useQuery({
        queryKey: ["lookup-regions"],
        queryFn: () => listRegions({ page: 1, size: 200 }),
    })
    const productGroupsQuery = useQuery({
        queryKey: ["lookup-product-groups"],
        queryFn: () => listProductGroups({ page: 1, size: 200, active: true }),
    })
    const productsQuery = useQuery({
        queryKey: ["lookup-products"],
        queryFn: () => listProducts({ page: 1, size: 200, status: "1" }),
    })

    return {
        pricingGroups: (pricingGroupsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        productGroups: (productGroupsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        regions: (regionsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        products: (productsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        isLoading: pricingGroupsQuery.isLoading || productGroupsQuery.isLoading || regionsQuery.isLoading || productsQuery.isLoading,
    }
}

function OptionSelect({ value, options, placeholder, required, onChange }: { value?: number; options: Option[]; placeholder: string; required?: boolean; onChange: (value: number | undefined) => void }) {
    return (
        <Select value={value ? String(value) : ""} onValueChange={(next) => onChange(next === "__empty" ? undefined : Number(next))}>
            <SelectTrigger className={cn(controlClass, "w-full !py-0")}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {!required && <SelectItem value="__empty">{placeholder}</SelectItem>}
                {options.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                        {option.sub ? `${option.sub} - ${option.label}` : option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

function OptionCombobox({
    value,
    options,
    placeholder,
    searchPlaceholder,
    emptyText,
    onChange,
}: {
    value?: number
    options: Option[]
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    onChange: (value: number | undefined) => void
}) {
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState("")
    const selected = options.find((option) => option.id === value)
    const filteredOptions = useMemo(() => {
        const q = normalizeKeyword(keyword)
        if (!q) return options.slice(0, 80)
        return options
            .filter((option) => normalizeKeyword([option.sub, option.label].filter(Boolean).join(" ")).includes(q))
            .slice(0, 80)
    }, [keyword, options])
    const selectedLabel = selected ? formatOptionLabel(selected) : placeholder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        controlClass,
                        "min-w-0 w-full justify-between px-3 text-left font-normal",
                        !selected && "text-muted-foreground"
                    )}
                >
                    <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder={searchPlaceholder} value={keyword} onValueChange={setKeyword} />
                    <CommandList className="max-h-80 overflow-y-auto">
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandItem
                            onSelect={() => {
                                onChange(undefined)
                                setKeyword("")
                                setOpen(false)
                            }}
                        >
                            <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                            <span className="truncate text-muted-foreground">{placeholder}</span>
                        </CommandItem>
                        {filteredOptions.map((option) => (
                            <CommandItem
                                key={option.id}
                                value={formatOptionLabel(option)}
                                className="min-w-0"
                                onSelect={() => {
                                    onChange(option.id)
                                    setKeyword("")
                                    setOpen(false)
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4 shrink-0", value === option.id ? "opacity-100" : "opacity-0")} />
                                <span className="min-w-0 truncate">
                                    {option.sub && <span className="font-medium">{option.sub}</span>}
                                    {option.sub ? " - " : ""}
                                    {option.label}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function formatOptionLabel(option: Option) {
    return option.sub ? `${option.sub} - ${option.label}` : option.label
}

function snapshotShortLabel(snapshot: PricingSnapshot, regions: Option[]) {
    return `${snapshot.pricing_month} · ${snapshotRegionLabel(snapshot, regions)} · ${priceMethodLabel(snapshot.price_method)}`
}

function allRegionSnapshotLabel(snapshots: PricingSnapshot[], fallback: PricingSnapshot) {
    const count = snapshots.length || 1
    return `${fallback.pricing_month} · Tất cả vùng (${count}) · ${priceMethodLabel(fallback.price_method)}`
}

function snapshotRegionLabel(snapshot: PricingSnapshot, regions?: Option[]) {
    if (snapshot.region?.name) {
        return snapshot.region.code ? `${snapshot.region.code} - ${snapshot.region.name}` : snapshot.region.name
    }
    if (snapshot.region_id && regions) return labelOf(regions, snapshot.region_id)
    return "Tất cả vùng"
}

function Field({
    label,
    children,
    className,
    required,
}: {
    label: string
    children: React.ReactNode
    className?: string
    required?: boolean
}) {
    return (
        <div className={cn("grid gap-1.5", className)}>
            <Label className="text-xs font-semibold uppercase tracking-wider">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {children}
        </div>
    )
}

function NumberInput({ value, onChange }: { value?: number; onChange: (value: number) => void }) {
    return <Input type="number" value={value ?? 0} onChange={(event) => onChange(Number(event.target.value || 0))} />
}

function MonthPicker({
    value,
    onChange,
    placeholder = "Chọn tháng",
}: {
    value?: string
    onChange: (value?: string) => void
    placeholder?: string
}) {
    const parsedYear = value?.match(/^(\d{4})-\d{2}$/)?.[1]
    const [open, setOpen] = useState(false)
    const [year, setYear] = useState(Number(parsedYear || new Date().getFullYear()))
    const selectedMonth = value?.match(/^\d{4}-(\d{2})$/)?.[1]
    const label = value ? `${value.slice(5, 7)}/${value.slice(0, 4)}` : placeholder
    const months = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
    ]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="relative">
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            controlClass,
                            "border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 pr-9 text-left whitespace-nowrap shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            <CalendarIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{label}</span>
                        </span>
                    </button>
                </PopoverTrigger>
                {value && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                            event.stopPropagation()
                            onChange(undefined)
                        }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            <PopoverContent className="w-[320px] p-3" align="start">
                <div className="mb-3 flex items-center justify-between">
                    <Button type="button" variant="ghost" size="icon" onClick={() => setYear((prev) => prev - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-base font-semibold">{year}</div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setYear((prev) => prev + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                        const monthValue = String(index + 1).padStart(2, "0")
                        const optionValue = `${year}-${monthValue}`
                        const selected = value === optionValue || (String(year) === parsedYear && selectedMonth === monthValue)
                        return (
                            <Button
                                key={month}
                                type="button"
                                variant={selected ? "default" : "outline"}
                                className="h-10"
                                onClick={() => {
                                    onChange(optionValue)
                                    setOpen(false)
                                }}
                            >
                                {month}
                            </Button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}

const PANEL_TONES: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
}

function PanelHeader({
    icon: Icon,
    tone = "blue",
    title,
    description,
    count,
    action,
}: {
    icon?: React.ComponentType<{ className?: string }>
    tone?: keyof typeof PANEL_TONES
    title: string
    description: string
    count?: number
    action: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", PANEL_TONES[tone])}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold">{title}</h2>
                        {typeof count === "number" && (
                            <Badge variant="secondary" className="font-mono text-xs">
                                {count}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
                </div>
            </div>
            {action}
        </div>
    )
}

function TableWrap({ children }: { children: React.ReactNode }) {
    return <div className="overflow-x-auto">{children}</div>
}

const METRIC_TONES = {
    default: { wrap: "border-border/60", iconBg: "bg-muted text-muted-foreground", value: "" },
    primary: { wrap: "border-primary/20 bg-primary/[0.02]", iconBg: "bg-primary/10 text-primary", value: "text-primary" },
    info: { wrap: "border-blue-200/50 dark:border-blue-900/40", iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400", value: "" },
    success: { wrap: "border-emerald-200/50 dark:border-emerald-900/40", iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", value: "" },
    warning: { wrap: "border-amber-300/60 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20", iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", value: "text-amber-700 dark:text-amber-400" },
} as const

function Metric({
    icon: Icon,
    label,
    value,
    tone = "default",
}: {
    icon?: React.ComponentType<{ className?: string }>
    label: string
    value: string
    tone?: keyof typeof METRIC_TONES
}) {
    const styles = METRIC_TONES[tone]
    return (
        <Card className={cn("gap-0 py-4 shadow-sm transition-shadow hover:shadow-md", styles.wrap)}>
            <CardContent className="flex items-center gap-3 px-4">
                {Icon && (
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", styles.iconBg)}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate text-[11px] font-semibold uppercase tracking-wider">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-xl font-bold tabular-nums", styles.value)}>{value}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function MoneyCell({ value, strong, className }: { value?: number; strong?: boolean; className?: string }) {
    return (
        <TableCell className={cn("text-right tabular-nums", strong && "text-foreground font-semibold", className)}>
            {formatCurrency(value)}
        </TableCell>
    )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    return (
        <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Sửa</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10 hover:text-destructive text-destructive/80 h-8 w-8"
                        onClick={onDelete}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Xoá</TooltipContent>
            </Tooltip>
        </div>
    )
}

function EmptyRow({ colSpan, text, icon: Icon }: { colSpan: number; text: string; icon?: React.ComponentType<{ className?: string }> }) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="h-32">
                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 text-center text-sm">
                    {Icon ? (
                        <div className="bg-muted text-muted-foreground/60 flex h-10 w-10 items-center justify-center rounded-full">
                            <Icon className="h-5 w-5" />
                        </div>
                    ) : (
                        <PackageOpen className="text-muted-foreground/40 h-8 w-8" />
                    )}
                    {text}
                </div>
            </TableCell>
        </TableRow>
    )
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description?: string
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full">
                <Icon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
                <h3 className="text-base font-semibold">{title}</h3>
                {description && <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>}
            </div>
        </div>
    )
}

function SkeletonRows({ cols, rows = 3 }: { cols: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`} className="hover:bg-transparent">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <TableCell key={colIdx}>
                            <Skeleton className="h-4 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    )
}

function normalizeKeyword(value?: string) {
    return (value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}

function labelOf(options: Option[], id?: number) {
    return options.find((item) => item.id === id)?.label ?? (id ? `#${id}` : "-")
}

function marginLabel(row: Partial<PricingMarginRule>) {
    if (row.margin_type === "AMOUNT") return formatCurrency(row.margin_value)
    return `${formatNumber(row.margin_value ?? 0)}%`
}

function salesExpenseTotal(row: Partial<PricingMarginRule>) {
    return (
        Number(row.hd_nam_vip_vnd_per_unit ?? 0) +
        Number(row.qua_nd_vnd_per_unit ?? 0) +
        Number(row.ck_quy_vnd_per_unit ?? 0) +
        Number(row.dlsk_vnd_per_unit ?? 0) +
        Number(row.quy_mkt_kd_vnd_per_unit ?? 0) +
        Number(row.thuong_sale_vnd_per_unit ?? 0)
    )
}

function transportTarget(row: PricingTransportRule, lookups: ReturnType<typeof usePricingLookups>) {
    if (row.match_type === "PRODUCT") return `SP: ${labelOf(lookups.products, row.product_id)}`
    if (row.match_type === "PRICING_GROUP") return `Mã giá: ${labelOf(lookups.pricingGroups, row.pricing_group_id)}`
    return "Mặc định"
}

function priceMethodLabel(method?: string) {
    if (method === "LATEST") return "Giá gần nhất"
    if (method === "FIFO") return "FIFO"
    if (method === "MANUAL") return "Giá nhập tay"
    return "Bình quân tháng"
}

function showError(fallback: string) {
    return (error: unknown) => toast.error(error instanceof Error ? error.message : fallback)
}
