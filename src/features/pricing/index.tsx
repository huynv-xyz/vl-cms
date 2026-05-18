import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Calculator, Edit, Eye, Plus, RefreshCw, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { listProducts } from "@/api/product"
import { listProductGroups } from "@/api/product-group"
import { listRegions } from "@/api/region"
import {
    calculatePricing,
    listPricingSnapshotItemSources,
    listPricingSnapshotItems,
    pricingMarginRulesApi,
    pricingSnapshotsApi,
    pricingTransportRulesApi,
} from "@/api/pricing"
import { Main } from "@/components/layout/main"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type {
    CalculatePricingRequest,
    PricingMarginRule,
    PricingMarginType,
    PricingPriceMethod,
    PricingSnapshot,
    PricingSnapshotItem,
    PricingSnapshotItemSource,
    PricingTransportMatchType,
    PricingTransportRule,
} from "./data/schema"

type Option = { id: number; label: string; sub?: string }

const today = new Date().toISOString().slice(0, 10)
const currentMonth = today.slice(0, 7)

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
                    Luồng dùng: <span className="font-semibold text-foreground">Hợp đồng mua</span> → Cấu hình giá → Tính bảng giá
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
        pricing_date: today,
        price_method: "WAVG",
    })
    const [selectedSnapshot, setSelectedSnapshot] = useState<PricingSnapshot | null>(null)

    const snapshotsQuery = useQuery({
        queryKey: ["pricing-snapshots", form.pricing_month],
        queryFn: () => pricingSnapshotsApi.list({ page: 1, size: 20, pricing_month: form.pricing_month }),
    })

    const calculateMutation = useMutation({
        mutationFn: calculatePricing,
        onSuccess: async (snapshot) => {
            toast.success("Đã tính bảng giá")
            setSelectedSnapshot(snapshot)
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

    const totals = useMemo(() => {
        return items.reduce(
            (acc, item) => {
                acc.purchase += item.purchase_price_vnd ?? 0
                acc.warehouse += item.warehouse_price_vnd ?? 0
                acc.cash += item.cash_price_vnd ?? 0
                acc.warning += item.warning_text ? 1 : 0
                return acc
            },
            { purchase: 0, warehouse: 0, cash: 0, warning: 0 }
        )
    }, [items])

    const submit = () => {
        if (!form.pricing_month) return toast.error("Chọn tháng áp dụng")
        if (!form.pricing_date) return toast.error("Chọn ngày tính")
        calculateMutation.mutate({
            ...form,
            code: form.code?.trim() || undefined,
            note: form.note?.trim() || undefined,
        })
    }

    return (
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-md border bg-background p-5">
                <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Tính bảng giá mới</h2>
                        <p className="text-sm text-muted-foreground">Không nhập giá mua ở đây. Giá mua lấy từ hợp đồng mua hàng.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Field label="Tháng áp dụng">
                        <Input type="month" value={form.pricing_month ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, pricing_month: event.target.value }))} />
                    </Field>
                    <Field label="Ngày tính">
                        <Input type="date" value={form.pricing_date ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, pricing_date: event.target.value }))} />
                    </Field>
                    <Field label="Vùng bán">
                        <OptionSelect
                            value={form.region_id}
                            options={lookups.regions}
                            placeholder="Tất cả vùng"
                            onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))}
                        />
                    </Field>
                    <Field label="Nhóm sản phẩm">
                        <OptionSelect
                            value={form.group_id}
                            options={lookups.groups}
                            placeholder="Tất cả nhóm"
                            onChange={(value) => setForm((prev) => ({ ...prev, group_id: value }))}
                        />
                    </Field>
                    <Field label="Cách lấy giá mua">
                        <Select value={form.price_method ?? "WAVG"} onValueChange={(value) => setForm((prev) => ({ ...prev, price_method: value as PricingPriceMethod }))}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WAVG">Bình quân trong tháng</SelectItem>
                                <SelectItem value="LATEST">Giá gần nhất</SelectItem>
                                <SelectItem value="FIFO">Nhập trước xuất trước</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Mã bảng giá">
                        <Input value={form.code ?? ""} placeholder="Để trống hệ thống tự tạo" onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
                    </Field>
                    <Field label="Ghi chú">
                        <Textarea value={form.note ?? ""} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} />
                    </Field>

                    <Button className="h-11 w-full text-base" onClick={submit} disabled={calculateMutation.isPending}>
                        {calculateMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                        Tính bảng giá
                    </Button>
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
                    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Bảng giá đã tính</h2>
                            <p className="text-sm text-muted-foreground">Chọn một lần tính để xem kết quả chi tiết.</p>
                        </div>
                        <Select value={selectedSnapshot?.id ? String(selectedSnapshot.id) : ""} onValueChange={(value) => {
                            const snapshot = latestSnapshots.find((item) => String(item.id) === value)
                            setSelectedSnapshot(snapshot ?? null)
                        }}>
                            <SelectTrigger className="w-full lg:w-[360px]">
                                <SelectValue placeholder="Chọn bảng giá" />
                            </SelectTrigger>
                            <SelectContent>
                                {latestSnapshots.map((snapshot) => (
                                    <SelectItem key={snapshot.id} value={String(snapshot.id)}>
                                        {snapshot.code} - {snapshot.pricing_month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedSnapshot ? (
                        <SnapshotItemsTable
                            snapshot={selectedSnapshot}
                            items={items}
                            isLoading={itemsQuery.isLoading}
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
        <div className="grid gap-5 xl:grid-cols-2">
            <MarginRulesPanel lookups={lookups} />
            <TransportRulesPanel lookups={lookups} />
        </div>
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
                title="Lợi nhuận"
                description="Cộng lợi nhuận theo nhóm sản phẩm và vùng. Vùng bỏ trống là mặc định."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nhóm</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>LN</TableHead>
                            <TableHead>Tiền mặt</TableHead>
                            <TableHead>30 ngày</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{labelOf(lookups.groups, row.group_id)}</TableCell>
                                <TableCell>{row.region_id ? labelOf(lookups.regions, row.region_id) : "Mặc định"}</TableCell>
                                <TableCell>{row.margin_type === "AMOUNT" ? formatCurrency(row.margin_value) : `${formatNumber(row.margin_value ?? 0)}%`}</TableCell>
                                <TableCell>{formatCurrency(row.cash_adjustment_vnd)}</TableCell>
                                <TableCell>{formatCurrency(row.term_30_adjustment_vnd)}</TableCell>
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
                title="Vận chuyển"
                description="Ưu tiên theo sản phẩm, sau đó nhóm sản phẩm, cuối cùng là mặc định."
                action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Thêm</Button>}
            />
            <TableWrap>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Áp dụng</TableHead>
                            <TableHead>Vùng</TableHead>
                            <TableHead>VC chung</TableHead>
                            <TableHead>Tiền mặt</TableHead>
                            <TableHead>30 ngày</TableHead>
                            <TableHead className="w-24 text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{transportTarget(row, lookups)}</TableCell>
                                <TableCell>{row.region_id ? labelOf(lookups.regions, row.region_id) : "Mặc định"}</TableCell>
                                <TableCell>{formatCurrency(row.transport_cost_vnd)}</TableCell>
                                <TableCell>{formatCurrency(row.cash_transport_cost_vnd)}</TableCell>
                                <TableCell>{formatCurrency(row.term_30_transport_cost_vnd)}</TableCell>
                                <TableCell>
                                    <RowActions onEdit={() => setEditing(row)} onDelete={() => remove.mutate(row.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {!rows.length && <EmptyRow colSpan={6} text={query.isLoading ? "Đang tải..." : "Chưa có cấu hình vận chuyển"} />}
                    </TableBody>
                </Table>
            </TableWrap>
            <TransportRuleDialog open={open} onOpenChange={setOpen} lookups={lookups} />
            {editing && <TransportRuleDialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)} rule={editing} lookups={lookups} />}
        </section>
    )
}

function SnapshotItemsTable({ snapshot, items, isLoading }: { snapshot: PricingSnapshot; items: PricingSnapshotItem[]; isLoading: boolean }) {
    const [sourceItem, setSourceItem] = useState<PricingSnapshotItem | null>(null)

    return (
        <>
            <div className="border-b bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                {snapshot.code} · {snapshot.pricing_month} · {priceMethodLabel(snapshot.price_method)}
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[260px]">Sản phẩm</TableHead>
                            <TableHead className="text-right">Giá mua</TableHead>
                            <TableHead className="text-right">LN</TableHead>
                            <TableHead className="text-right">Tại kho</TableHead>
                            <TableHead className="text-right">Tiền mặt</TableHead>
                            <TableHead className="text-right">8-10 ngày</TableHead>
                            <TableHead className="text-right">30 ngày</TableHead>
                            <TableHead>Nguồn</TableHead>
                            <TableHead>Cảnh báo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-semibold">{item.product_code}</div>
                                    <div className="text-sm text-muted-foreground">{item.product_name}</div>
                                    <div className="text-xs text-muted-foreground">ĐVT: {item.sale_unit_name || item.sale_unit_code || item.base_unit_code || "-"}</div>
                                </TableCell>
                                <MoneyCell value={item.purchase_price_vnd} />
                                <MoneyCell value={item.margin_amount_vnd} />
                                <MoneyCell value={item.warehouse_price_vnd} strong />
                                <MoneyCell value={item.cash_price_vnd} strong className="text-primary" />
                                <MoneyCell value={item.term_8_10_price_vnd} strong />
                                <MoneyCell value={item.term_30_price_vnd} strong />
                                <TableCell>
                                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setSourceItem(item)}>
                                        <Eye className="mr-1 h-4 w-4" />
                                        Xem
                                    </Button>
                                    <div className="max-w-[220px] truncate text-xs text-muted-foreground">{item.source_summary}</div>
                                </TableCell>
                                <TableCell>{item.warning_text ? <Badge variant="destructive">{item.warning_text}</Badge> : <Badge variant="outline">OK</Badge>}</TableCell>
                            </TableRow>
                        ))}
                        {!items.length && <EmptyRow colSpan={9} text={isLoading ? "Đang tải..." : "Bảng giá này chưa có dòng"} />}
                    </TableBody>
                </Table>
            </div>
            {sourceItem && <SourcesDialog item={sourceItem} open={!!sourceItem} onOpenChange={(value) => !value && setSourceItem(null)} />}
        </>
    )
}

function MarginRuleDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingMarginRule; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingMarginRule>>(() => ({
        region_id: rule?.region_id,
        group_id: rule?.group_id,
        margin_type: rule?.margin_type ?? "PERCENT",
        margin_value: rule?.margin_value ?? 0,
        warehouse_adjustment_vnd: rule?.warehouse_adjustment_vnd ?? 0,
        cash_adjustment_vnd: rule?.cash_adjustment_vnd ?? 0,
        term_8_10_adjustment_vnd: rule?.term_8_10_adjustment_vnd ?? 0,
        term_30_adjustment_vnd: rule?.term_30_adjustment_vnd ?? 0,
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
        if (!form.group_id) return toast.error("Chọn nhóm sản phẩm")
        mutation.mutate({
            ...form,
            margin_value: Number(form.margin_value ?? 0),
            warehouse_adjustment_vnd: Number(form.warehouse_adjustment_vnd ?? 0),
            cash_adjustment_vnd: Number(form.cash_adjustment_vnd ?? 0),
            term_8_10_adjustment_vnd: Number(form.term_8_10_adjustment_vnd ?? 0),
            term_30_adjustment_vnd: Number(form.term_30_adjustment_vnd ?? 0),
            priority: Number(form.priority ?? 100),
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa lợi nhuận" : "Thêm lợi nhuận"} open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Nhóm sản phẩm">
                <OptionSelect value={form.group_id} options={lookups.groups} required placeholder="Chọn nhóm" onChange={(value) => setForm((prev) => ({ ...prev, group_id: value }))} />
            </Field>
            <Field label="Vùng">
                <OptionSelect value={form.region_id} options={lookups.regions} placeholder="Mặc định tất cả vùng" onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))} />
            </Field>
            <Field label="Kiểu lợi nhuận">
                <Select value={form.margin_type ?? "PERCENT"} onValueChange={(value) => setForm((prev) => ({ ...prev, margin_type: value as PricingMarginType }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PERCENT">Theo % giá mua</SelectItem>
                        <SelectItem value="AMOUNT">Cộng số tiền</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            <Field label="Giá trị lợi nhuận">
                <NumberInput value={form.margin_value} onChange={(value) => setForm((prev) => ({ ...prev, margin_value: value }))} />
            </Field>
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="Điều chỉnh tại kho"><NumberInput value={form.warehouse_adjustment_vnd} onChange={(value) => setForm((prev) => ({ ...prev, warehouse_adjustment_vnd: value }))} /></Field>
                <Field label="Điều chỉnh tiền mặt"><NumberInput value={form.cash_adjustment_vnd} onChange={(value) => setForm((prev) => ({ ...prev, cash_adjustment_vnd: value }))} /></Field>
                <Field label="Điều chỉnh 8-10 ngày"><NumberInput value={form.term_8_10_adjustment_vnd} onChange={(value) => setForm((prev) => ({ ...prev, term_8_10_adjustment_vnd: value }))} /></Field>
                <Field label="Điều chỉnh 30 ngày"><NumberInput value={form.term_30_adjustment_vnd} onChange={(value) => setForm((prev) => ({ ...prev, term_30_adjustment_vnd: value }))} /></Field>
            </div>
        </RuleDialog>
    )
}

function TransportRuleDialog({ open, onOpenChange, rule, lookups }: { open: boolean; onOpenChange: (open: boolean) => void; rule?: PricingTransportRule; lookups: ReturnType<typeof usePricingLookups> }) {
    const queryClient = useQueryClient()
    const [form, setForm] = useState<Partial<PricingTransportRule>>(() => ({
        region_id: rule?.region_id,
        match_type: rule?.match_type ?? "GROUP",
        product_id: rule?.product_id,
        group_id: rule?.group_id,
        transport_cost_vnd: rule?.transport_cost_vnd ?? 0,
        cash_transport_cost_vnd: rule?.cash_transport_cost_vnd ?? 0,
        term_8_10_transport_cost_vnd: rule?.term_8_10_transport_cost_vnd ?? 0,
        term_30_transport_cost_vnd: rule?.term_30_transport_cost_vnd ?? 0,
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
        if (form.match_type === "GROUP" && !form.group_id) return toast.error("Chọn nhóm sản phẩm")
        mutation.mutate({
            ...form,
            product_id: form.match_type === "PRODUCT" ? form.product_id : undefined,
            group_id: form.match_type === "GROUP" ? form.group_id : undefined,
            transport_cost_vnd: Number(form.transport_cost_vnd ?? 0),
            cash_transport_cost_vnd: Number(form.cash_transport_cost_vnd ?? 0),
            term_8_10_transport_cost_vnd: Number(form.term_8_10_transport_cost_vnd ?? 0),
            term_30_transport_cost_vnd: Number(form.term_30_transport_cost_vnd ?? 0),
            priority: Number(form.priority ?? 100),
            active: form.active !== false,
        })
    }

    return (
        <RuleDialog title={rule ? "Sửa vận chuyển" : "Thêm vận chuyển"} open={open} onOpenChange={onOpenChange} onSubmit={submit} loading={mutation.isPending}>
            <Field label="Vùng">
                <OptionSelect value={form.region_id} options={lookups.regions} placeholder="Mặc định tất cả vùng" onChange={(value) => setForm((prev) => ({ ...prev, region_id: value }))} />
            </Field>
            <Field label="Áp dụng cho">
                <Select value={form.match_type ?? "GROUP"} onValueChange={(value) => setForm((prev) => ({ ...prev, match_type: value as PricingTransportMatchType, product_id: undefined, group_id: undefined }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GROUP">Nhóm sản phẩm</SelectItem>
                        <SelectItem value="PRODUCT">Sản phẩm cụ thể</SelectItem>
                        <SelectItem value="DEFAULT">Mặc định</SelectItem>
                    </SelectContent>
                </Select>
            </Field>
            {form.match_type === "GROUP" && (
                <Field label="Nhóm sản phẩm">
                    <OptionSelect value={form.group_id} options={lookups.groups} required placeholder="Chọn nhóm" onChange={(value) => setForm((prev) => ({ ...prev, group_id: value }))} />
                </Field>
            )}
            {form.match_type === "PRODUCT" && (
                <Field label="Sản phẩm">
                    <OptionSelect value={form.product_id} options={lookups.products} required placeholder="Chọn sản phẩm" onChange={(value) => setForm((prev) => ({ ...prev, product_id: value }))} />
                </Field>
            )}
            <div className="grid gap-3 md:grid-cols-2">
                <Field label="VC chung"><NumberInput value={form.transport_cost_vnd} onChange={(value) => setForm((prev) => ({ ...prev, transport_cost_vnd: value }))} /></Field>
                <Field label="VC tiền mặt"><NumberInput value={form.cash_transport_cost_vnd} onChange={(value) => setForm((prev) => ({ ...prev, cash_transport_cost_vnd: value }))} /></Field>
                <Field label="VC 8-10 ngày"><NumberInput value={form.term_8_10_transport_cost_vnd} onChange={(value) => setForm((prev) => ({ ...prev, term_8_10_transport_cost_vnd: value }))} /></Field>
                <Field label="VC 30 ngày"><NumberInput value={form.term_30_transport_cost_vnd} onChange={(value) => setForm((prev) => ({ ...prev, term_30_transport_cost_vnd: value }))} /></Field>
            </div>
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
                    <DialogTitle>Nguồn giá mua</DialogTitle>
                    <DialogDescription>{item.product_code} - {item.product_name}</DialogDescription>
                </DialogHeader>
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

function RuleDialog({ title, open, onOpenChange, onSubmit, loading, children }: { title: string; open: boolean; onOpenChange: (open: boolean) => void; onSubmit: () => void; loading?: boolean; children: React.ReactNode }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Nhập cấu hình để hệ thống cộng vào giá mua khi tính bảng giá.</DialogDescription>
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
    const groupsQuery = useQuery({
        queryKey: ["lookup-product-groups"],
        queryFn: () => listProductGroups({ page: 1, size: 200, active: true }),
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
        groups: (groupsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        regions: (regionsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        products: (productsQuery.data?.items ?? []).map((item: any) => ({ id: item.id, label: item.name, sub: item.code })),
        isLoading: groupsQuery.isLoading || regionsQuery.isLoading || productsQuery.isLoading,
    }
}

function OptionSelect({ value, options, placeholder, required, onChange }: { value?: number; options: Option[]; placeholder: string; required?: boolean; onChange: (value: number | undefined) => void }) {
    return (
        <Select value={value ? String(value) : ""} onValueChange={(next) => onChange(next === "__empty" ? undefined : Number(next))}>
            <SelectTrigger className="w-full">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-2">
            <Label className="text-base font-semibold">{label}</Label>
            {children}
        </div>
    )
}

function NumberInput({ value, onChange }: { value?: number; onChange: (value: number) => void }) {
    return <Input type="number" value={value ?? 0} onChange={(event) => onChange(Number(event.target.value || 0))} />
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

function labelOf(options: Option[], id?: number) {
    return options.find((item) => item.id === id)?.label ?? (id ? `#${id}` : "-")
}

function transportTarget(row: PricingTransportRule, lookups: ReturnType<typeof usePricingLookups>) {
    if (row.match_type === "PRODUCT") return `SP: ${labelOf(lookups.products, row.product_id)}`
    if (row.match_type === "GROUP") return `Nhóm: ${labelOf(lookups.groups, row.group_id)}`
    return "Mặc định"
}

function priceMethodLabel(method?: string) {
    if (method === "LATEST") return "Giá gần nhất"
    if (method === "FIFO") return "FIFO"
    return "Bình quân tháng"
}

function showError(fallback: string) {
    return (error: unknown) => toast.error(error instanceof Error ? error.message : fallback)
}
