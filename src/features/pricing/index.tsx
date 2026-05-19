import { useMemo, useState } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { Calculator, CalendarIcon, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Edit, Eye, Plus, RefreshCw, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { listProducts } from "@/api/product"
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
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
        <Main className="flex w-full min-w-0 max-w-full flex-1 flex-col gap-5">
            <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Giá thành</h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        Lấy giá mua từ hợp đồng, cộng lợi nhuận và vận chuyển để ra bảng giá bán.
                    </p>
                </div>
                <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Hợp đồng mua</span> → Cấu hình giá → Tính bảng giá
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="gap-5">
                <TabsList className="h-12 w-full justify-start rounded-md p-1 lg:w-fit">
                    <TabsTrigger value="calculate" className="h-10 px-5 text-base">Tính bảng giá</TabsTrigger>
                    <TabsTrigger value="config" className="h-10 px-5 text-base">Cấu hình giá</TabsTrigger>
                </TabsList>

                <TabsContent value="calculate">
                    <CalculatePanel lookups={lookups} />
                </TabsContent>

                <TabsContent value="config">
                    <ConfigPanel lookups={lookups} />
                </TabsContent>
            </Tabs>
        </Main>
    )
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
        queryKey: ["pricing-snapshots", form.pricing_month],
        queryFn: () => pricingSnapshotsApi.list({ page: 1, size: 20, pricing_month: form.pricing_month }),
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

    const itemsQuery = useQuery({
        queryKey: ["pricing-snapshot-items", selectedSnapshot?.id],
        queryFn: () => listPricingSnapshotItems(selectedSnapshot!.id),
        enabled: !!selectedSnapshot?.id,
    })

    const latestSnapshots = snapshotsQuery.data?.items ?? []
    const items = itemsQuery.data ?? []
    const allItemsQueries = useQueries({
        queries: latestSnapshots.map((snapshot) => ({
            queryKey: ["pricing-snapshot-items", snapshot.id],
            queryFn: () => listPricingSnapshotItems(snapshot.id),
            enabled: !!snapshot.id,
        })),
    })
    const allSnapshotItems = useMemo<SnapshotTableItem[]>(() => {
        return allItemsQueries.flatMap((query, index) => {
            const snapshot = latestSnapshots[index]
            return (query.data ?? []).map((item) => ({ ...item, snapshot }))
        })
    }, [allItemsQueries, latestSnapshots])
    const currentSnapshotItems = useMemo<SnapshotTableItem[]>(() => {
        return items.map((item) => ({ ...item, snapshot: selectedSnapshot ?? undefined }))
    }, [items, selectedSnapshot])
    const isCrossRegionFilter = Boolean(itemProductId || itemPricingGroupId)
    const baseItems = isCrossRegionFilter ? allSnapshotItems : currentSnapshotItems
    const productFilterOptions = useMemo(() => {
        const map = new Map<number, Option>()
        lookups.products.forEach((option) => map.set(option.id, option))
        allSnapshotItems.forEach((item) => {
            if (!item.product_id) return
            map.set(item.product_id, {
                id: item.product_id,
                label: item.product_name || `Sản phẩm #${item.product_id}`,
                sub: item.product_code,
            })
        })
        return Array.from(map.values()).sort((a, b) => formatOptionLabel(a).localeCompare(formatOptionLabel(b), "vi"))
    }, [allSnapshotItems, lookups.products])
    const filteredItems = useMemo(() => {
        return baseItems.filter((item) => {
            if (itemProductId && item.product_id !== itemProductId) return false
            if (itemPricingGroupId && item.pricing_group_id !== itemPricingGroupId) return false
            return true
        })
    }, [baseItems, itemProductId, itemPricingGroupId])
    const tableLoading = isCrossRegionFilter
        ? allItemsQueries.some((query) => query.isLoading)
        : itemsQuery.isLoading

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
        <div className="space-y-5">
            <section className="rounded-md border bg-background p-5">
                <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Tính bảng giá</h2>
                        <p className="text-sm text-muted-foreground">Giá mua lấy từ hợp đồng mua hàng.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Tháng áp dụng">
                        <MonthPicker
                            value={form.pricing_month}
                            placeholder="Chọn tháng áp dụng"
                            onChange={(value) => setForm((prev) => ({ ...prev, pricing_month: value }))}
                        />
                    </Field>
                    <Field label="Vùng">
                        <OptionSelect
                            value={form.region_id}
                            options={lookups.regions}
                            placeholder="Tất cả vùng"
                            onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))}
                        />
                    </Field>
                    <Field label="Cách lấy giá mua">
                        <Select value={form.price_method ?? "WAVG"} onValueChange={(value) => setForm((prev) => ({ ...prev, price_method: value as PricingPriceMethod }))}>
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
                    <Field label="Ghi chú" className="md:col-span-2">
                        <Textarea className={cn(controlClass, "resize-none py-2")} value={form.note ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
                    </Field>
                    <div className="flex items-end">
                        <Button className={cn(controlClass, "w-full")} onClick={submit} disabled={calculateMutation.isPending}>
                            {calculateMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                            Tính bảng giá
                        </Button>
                    </div>
                </div>
            </section>

            <section className="min-w-0 space-y-5">
                <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Số dòng" value={formatNumber(items.length)} />
                    <Metric label="Giá mua" value={formatCurrency(totals.purchase)} />
                    <Metric label="Giá tại kho" value={formatCurrency(totals.warehouse)} />
                    <Metric label="Cảnh báo" value={formatNumber(totals.warning)} tone={totals.warning ? "warning" : "normal"} />
                </div>

                <div className="rounded-md border bg-background">
                    <div className="space-y-4 border-b p-4">
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(260px,420px)] xl:items-end">
                            <div className="min-w-0">
                                <h2 className="text-xl font-semibold">Bảng giá đã tính</h2>
                                <p className="text-sm text-muted-foreground">Chọn một lần tính để xem kết quả chi tiết.</p>
                            </div>
                            <Field label="Bảng giá" className="min-w-0">
                                <Select value={selectedSnapshot?.id ? String(selectedSnapshot.id) : ""} onValueChange={(value) => {
                                    const snapshot = latestSnapshots.find((item) => String(item.id) === value)
                                    setSelectedSnapshot(snapshot ?? null)
                                }}>
                                    <SelectTrigger className={cn(controlClass, "w-full min-w-0 overflow-hidden !py-0 [&>span]:block [&>span]:min-w-0 [&>span]:truncate")}>
                                        <SelectValue placeholder="Chọn bảng giá" />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[min(720px,calc(100vw-32px))]">
                                        {latestSnapshots.map((snapshot) => (
                                            <SelectItem
                                                key={snapshot.id}
                                                value={String(snapshot.id)}
                                                textValue={snapshotShortLabel(snapshot, lookups.regions)}
                                            >
                                                <div className="min-w-0 pr-4">
                                                    <div className="truncate font-medium">
                                                        {snapshotShortLabel(snapshot, lookups.regions)}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {snapshot.code}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                        <div className="grid min-w-0 gap-3 md:grid-cols-2">
                            <Field label="Lọc sản phẩm" className="min-w-0">
                                <OptionCombobox
                                    value={itemProductId}
                                    options={productFilterOptions}
                                    placeholder="Tất cả sản phẩm"
                                    searchPlaceholder="Tìm mã hoặc tên sản phẩm..."
                                    emptyText="Không tìm thấy sản phẩm"
                                    onChange={setItemProductId}
                                />
                            </Field>
                            <Field label="Lọc mã nhóm báo giá" className="min-w-0">
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

                    {selectedSnapshot ? (
                        <SnapshotItemsTable
                            snapshot={selectedSnapshot}
                            items={filteredItems}
                            isLoading={tableLoading}
                            isCrossRegionFilter={isCrossRegionFilter}
                            lookups={lookups}
                        />
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">Chưa chọn bảng giá để xem.</div>
                    )}
                </div>
            </section>
        </div>
    )
}

function ConfigPanel({ lookups }: { lookups: ReturnType<typeof usePricingLookups> }) {
    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-2">
                <PricingGroupsPanel lookups={lookups} />
                <PackagingCostsPanel lookups={lookups} />
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
                <MarginRulesPanel lookups={lookups} />
                <TransportRulesPanel lookups={lookups} />
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
                <PromotionsPanel lookups={lookups} />
                <AlertConfigsPanel lookups={lookups} />
            </div>
        </div>
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
        <section className="rounded-md border bg-background">
            <PanelHeader
                title="Mã nhóm báo giá"
                description="Mã dùng để gom sản phẩm cùng logic giá, phí bán hàng, lợi nhuận, vận chuyển, khuyến mãi."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã</TableHead>
                            <TableHead>Tên</TableHead>
                            <TableHead>ĐVT chuẩn</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-semibold">{row.code}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.base_unit_code || "-"}</TableCell>
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={4} text={query.isLoading ? "Đang tải..." : "Chưa có mã nhóm báo giá"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <PricingGroupDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <PricingGroupDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
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
        <section className="rounded-md border bg-background">
            <PanelHeader
                title="Chi phí bao bì"
                description="Cộng vào giá nguyên liệu theo mã nhóm báo giá."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã nhóm báo giá</TableHead>
                            <TableHead>Tên cấu hình</TableHead>
                            <TableHead className="text-right">Chi phí/đv</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-semibold">{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <MoneyCell value={row.cost_per_unit_vnd} />
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={4} text={query.isLoading ? "Đang tải..." : "Chưa có chi phí bao bì"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <PackagingCostDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <PackagingCostDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
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
        <section className="rounded-md border bg-background">
            <PanelHeader
                title="Biên lợi nhuận & Phí bán hàng"
                description="Cấu hình %/số tiền lợi nhuận và 6 cấu phần phí bán hàng theo mã nhóm báo giá, vùng."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã nhóm báo giá</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>Lợi nhuận</TableHead>
                            <TableHead>Phí bán hàng</TableHead>
                            <TableHead>An toàn</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell>{row.region_id ? labelOf(lookups.regions, row.region_id) : "Mặc định"}</TableCell>
                                <TableCell>{marginLabel(row)}</TableCell>
                                <TableCell>{formatCurrency(salesExpenseTotal(row))}</TableCell>
                                <TableCell>{row.min_margin_safety_percent ? `${formatNumber(row.min_margin_safety_percent)}%` : "-"}</TableCell>
                                <TableCell>
                                    <RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={6} text={query.isLoading ? "Đang tải..." : "Chưa có cấu hình lợi nhuận"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <MarginRuleDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <MarginRuleDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
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
        <section className="rounded-md border bg-background">
            <PanelHeader
                title="Vận chuyển & phụ phí"
                description="VC giao kho là phí vận chuyển; 7-10 ngày/30 ngày là phụ phí công nợ; giá nông dân là cộng hoặc giảm riêng."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Áp dụng</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>VC giao kho</TableHead>
                            <TableHead>Phụ phí 7-10 ngày</TableHead>
                            <TableHead>Phụ phí 30 ngày</TableHead>
                            <TableHead>Giá nông dân</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{transportTarget(row, lookups)}</TableCell>
                                <TableCell>{row.region_id ? labelOf(lookups.regions, row.region_id) : "Mặc định"}</TableCell>
                                <TableCell>{formatCurrency(row.transport_cost_vnd)}</TableCell>
                                <TableCell>{formatCurrency(row.debt_7_10_surcharge_vnd ?? row.term_8_10_transport_cost_vnd)}</TableCell>
                                <TableCell>{formatCurrency(row.debt_30_surcharge_vnd ?? row.term_30_transport_cost_vnd)}</TableCell>
                                <TableCell>{formatCurrency(row.farmer_price_surcharge_vnd)}</TableCell>
                                <TableCell>
                                    <RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={7} text={query.isLoading ? "Đang tải..." : "Chưa có cấu hình vận chuyển"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <TransportRuleDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <TransportRuleDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
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
        <section className="rounded-md border bg-background">
            <PanelHeader
                title="Khuyến mãi tháng"
                description="Giảm giá theo nhóm báo giá, vùng và thời gian áp dụng."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>CTKM</TableHead>
                            <TableHead>Nhóm báo giá</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Giảm</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-semibold">{row.code}<div className="text-xs font-normal text-muted-foreground">{row.name}</div></TableCell>
                                <TableCell>{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell>{row.region_id ? labelOf(lookups.regions, row.region_id) : "Tất cả vùng"}</TableCell>
                                <TableCell>{row.from_date} → {row.to_date}</TableCell>
                                <TableCell>{row.discount_percent ? `${formatNumber(row.discount_percent)}%` : formatCurrency(row.discount_amount_vnd)}</TableCell>
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={6} text={query.isLoading ? "Đang tải..." : "Chưa có khuyến mãi"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <PromotionDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <PromotionDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
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
        <section className="rounded-md border bg-background">
            <PanelHeader
                title="Cảnh báo"
                description="Cảnh báo khi giá nguyên liệu tăng mạnh hoặc biên lợi nhuận thấp."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nhóm báo giá</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>Ngưỡng tăng giá</TableHead>
                            <TableHead>Lợi nhuận tối thiểu</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>{labelOf(lookups.pricingGroups, row.pricing_group_id)}</TableCell>
                                <TableCell>{row.region_id ? labelOf(lookups.regions, row.region_id) : "Tất cả vùng"}</TableCell>
                                <TableCell>{formatNumber(row.price_change_threshold_percent)}%</TableCell>
                                <TableCell>{row.min_margin_percent ? `${formatNumber(row.min_margin_percent)}%` : "-"}</TableCell>
                                <TableCell><RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={5} text={query.isLoading ? "Đang tải..." : "Chưa có cấu hình cảnh báo"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <AlertConfigDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <AlertConfigDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
    )
}

function SnapshotItemsTable({
    snapshot,
    items,
    isLoading,
    isCrossRegionFilter,
    lookups,
}: {
    snapshot: PricingSnapshot
    items: SnapshotTableItem[]
    isLoading: boolean
    isCrossRegionFilter?: boolean
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
            <div className="border-b bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                {isCrossRegionFilter
                    ? `${snapshot.pricing_month} · Đang xem gộp các vùng theo bộ lọc · ${priceMethodLabel(snapshot.price_method)}`
                    : `${snapshot.code} · ${snapshot.pricing_month} · ${snapshotRegionLabel(snapshot)} · ${priceMethodLabel(snapshot.price_method)}`}
            </div>
            <div className="space-y-5 p-4">
                {groupedItems.map((group) => (
                    <section key={group.key} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                            <div>
                                <h3 className="text-lg font-semibold">{group.label}</h3>
                                <p className="text-sm text-muted-foreground">{group.items.length} dòng bảng giá</p>
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
                {!items.length && (
                    <div className="rounded-md border bg-background p-10 text-center text-muted-foreground">
                        {isLoading ? "Đang tải..." : "Bảng giá này chưa có dòng"}
                    </div>
                )}
            </div>
            {sourceItem && <SourcesDialog item={sourceItem} open={!!sourceItem} onOpenChange={(value) => !value && setSourceItem(null)} />}
        </>
    )
}

function PriceItemCard({ index, item, regionLabel, onInspect }: { index: number; item: SnapshotTableItem; regionLabel: string; onInspect: () => void }) {
    return (
        <div className="overflow-hidden rounded-md border bg-background">
            <div className="grid gap-0 border-b bg-muted/10 lg:grid-cols-[64px_220px_minmax(280px,1fr)_110px]">
                <div className="flex items-center justify-center border-b p-4 text-sm font-semibold text-muted-foreground lg:border-b-0 lg:border-r">
                    {index}
                </div>
                <div className="border-b p-4 lg:border-b-0 lg:border-r">
                    <Badge variant={item.warning_text ? "destructive" : "outline"}>{item.warning_text ? "Cần kiểm tra" : "OK"}</Badge>
                    <div className="mt-3 text-sm font-semibold">{regionLabel}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.source_summary || "Không có nguồn"}</div>
                </div>
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="truncate text-base font-semibold text-primary">{item.product_code}</div>
                    <div className="mt-1 text-lg font-bold leading-snug">{item.product_name}</div>
                    <div className="mt-2 text-sm text-muted-foreground">ĐVT: {item.sale_unit_name || item.sale_unit_code || item.base_unit_code || "-"}</div>
                </div>
                <div className="flex items-center justify-end p-4">
                    <Button variant="ghost" size="sm" onClick={onInspect}>
                        <Eye className="mr-2 h-4 w-4" />
                        Kiểm
                    </Button>
                </div>
            </div>
            <div className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                <PriceBlock title="Cấu thành giá">
                    <PriceLine label="Giá mua" value={item.purchase_price_vnd} />
                    <PriceLine label="Bao bì" value={item.packaging_cost_vnd} />
                    <PriceLine label="Phí bán hàng" value={item.sales_expense_vnd} />
                    <PriceLine label="Giá thành" value={item.cogs_vnd ?? item.base_price_vnd} strong />
                </PriceBlock>
                <PriceBlock title="Giá nền">
                    <PriceLine label="Lợi nhuận" value={item.margin_amount_vnd} />
                    <PriceLine label="Trước VAT" value={item.base_sale_price_vnd ?? item.base_price_vnd} strong />
                    <PriceLine label="Khách lẻ tại kho" value={item.warehouse_retail_vat_vnd ?? item.warehouse_price_vnd} tone="primary" />
                </PriceBlock>
                <PriceBlock title="Khách lẻ công nợ">
                    <PriceLine label="7-10 ngày" value={item.debt_7_10_retail_vat_vnd} />
                    <PriceLine label="30 ngày" value={item.debt_30_retail_vat_vnd} />
                </PriceBlock>
                <PriceBlock title="Đại lý & nông dân">
                    <PriceLine label="Đại lý tại kho" value={item.warehouse_dealer_vat_vnd ?? item.cash_price_vnd} tone="primary" />
                    <PriceLine label="Đại lý 7-10 ngày" value={item.debt_7_10_dealer_vat_vnd ?? item.term_8_10_price_vnd} />
                    <PriceLine label="Đại lý 30 ngày" value={item.debt_30_dealer_vat_vnd ?? item.term_30_price_vnd} />
                    <PriceLine label="Giá nông dân" value={item.farmer_price_vnd} tone="warning" />
                </PriceBlock>
            </div>
            {item.warning_text && (
                <div className="border-t bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                    {item.warning_text}
                </div>
            )}
        </div>
    )
}

function PriceBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="p-4">
            <div className="mb-3 text-sm font-bold uppercase text-muted-foreground">{title}</div>
            <div className="space-y-2">{children}</div>
        </div>
    )
}

function PriceLine({ label, value, strong, tone }: { label: string; value?: number; strong?: boolean; tone?: "primary" | "warning" }) {
    return (
        <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn("text-right tabular-nums", strong && "font-bold", tone === "primary" && "font-bold text-primary", tone === "warning" && "font-bold text-amber-700")}>
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
                    <DialogTitle>Nguồn giá mua & cấu hình áp dụng</DialogTitle>
                    <DialogDescription>{item.product_code} - {item.product_name}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 rounded-md border bg-muted/20 p-4 text-sm md:grid-cols-2">
                    <AuditLine label="Giá mua" value={formatCurrency(item.purchase_price_vnd)} />
                    <AuditLine label="Bao bì" value={formatCurrency(item.packaging_cost_vnd)} />
                    <AuditLine label="Phí bán hàng" value={formatCurrency(item.sales_expense_vnd)} />
                    <AuditLine label="Chi tiết phí BH" value={item.sales_expense_breakdown_text || "-"} wide />
                    <AuditLine label="Lợi nhuận" value={formatCurrency(item.margin_amount_vnd)} />
                    <AuditLine label="Khuyến mãi" value={formatCurrency(item.promo_amount_vnd)} />
                    <AuditLine label="Vận chuyển đại lý" value={formatCurrency(item.transport_cost_vnd)} />
                    <AuditLine label="Trace config" value={item.config_trace_text || "-"} wide />
                </div>
                <TableWrap>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hợp đồng</TableHead>
                                <TableHead>Ngày</TableHead>
                                <TableHead className="text-right">Số lượng</TableHead>
                                <TableHead className="text-right">Giá nguồn</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row: PricingSnapshotItemSource) => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.contract_code || `#${row.contract_id}`}</TableCell>
                                    <TableCell>{row.source_date || "-"}</TableCell>
                                    <TableCell className="text-right">{formatNumber(row.source_quantity)}</TableCell>
                                    <MoneyCell value={row.source_price_vnd} />
                                </TableRow>
                            ))}
                            {!rows.length && <EmptyRow colSpan={4} text={query.isLoading ? "Đang tải..." : "Không có nguồn chi tiết"} />}
                        </TableBody>
                    </Table>
                </TableWrap>
            </DialogContent>
        </Dialog>
    )
}

function AuditLine({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
    return (
        <div className={cn("min-w-0", wide && "md:col-span-2")}>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 break-words font-medium">{value}</div>
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
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">{children}</div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
                    <Button onClick={onSubmit} disabled={loading}>
                        {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Lưu
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
    const productsQuery = useQuery({
        queryKey: ["lookup-products"],
        queryFn: () => listProducts({ page: 1, size: 200, status: "1" }),
    })

    return {
        pricingGroups: (pricingGroupsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        regions: (regionsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        products: (productsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        isLoading: pricingGroupsQuery.isLoading || regionsQuery.isLoading || productsQuery.isLoading,
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

function snapshotLabel(snapshot: PricingSnapshot, regions: Option[]) {
    return `${snapshot.code} - ${snapshot.pricing_month} - ${snapshotRegionLabel(snapshot, regions)}`
}

function snapshotShortLabel(snapshot: PricingSnapshot, regions: Option[]) {
    return `${snapshot.pricing_month} · ${snapshotRegionLabel(snapshot, regions)} · ${priceMethodLabel(snapshot.price_method)}`
}

function snapshotRegionLabel(snapshot: PricingSnapshot, regions?: Option[]) {
    if (snapshot.region?.name) {
        return snapshot.region.code ? `${snapshot.region.code} - ${snapshot.region.name}` : snapshot.region.name
    }
    if (snapshot.region_id && regions) return labelOf(regions, snapshot.region_id)
    return "Tất cả vùng"
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Label className="text-base font-semibold">{label}</Label>
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

function PanelHeader({ title, description, action }: { title: string; description: string; action: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {action}
        </div>
    )
}

function TableWrap({ children }: { children: React.ReactNode }) {
    return <div className="overflow-x-auto">{children}</div>
}

function Metric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warning" }) {
    return (
        <div className="rounded-md border bg-background p-4">
            <div className="text-sm font-semibold text-muted-foreground">{label}</div>
            <div className={cn("mt-2 text-2xl font-bold", tone === "warning" && "text-amber-700")}>{value}</div>
        </div>
    )
}

function MoneyCell({ value, strong, className }: { value?: number; strong?: boolean; className?: string }) {
    return <TableCell className={cn("text-right tabular-nums", strong && "font-semibold", className)}>{formatCurrency(value)}</TableCell>
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    return (
        <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-28 text-center text-muted-foreground">{text}</TableCell>
        </TableRow>
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
