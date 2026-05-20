import { useState } from "react"
import type React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    AlertTriangle,
    Boxes,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    CircleDollarSign,
    Download,
    Factory,
    FileText,
    Layers3,
    PackageCheck,
    Plus,
    Printer,
    Replace,
    Route,
    Save,
    Settings2,
    Wand2,
    Warehouse,
} from "lucide-react"

import { AsyncSelect } from "@/components/rjsf/async-select"
import { DatePicker } from "@/components/date-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import {
    addProductionExtraMaterial,
    addProductionSubstitution,
    allocateProductionFifo,
    confirmProduction,
    generateProductionMaterials,
    setProductionPreferredLot,
} from "@/api/production/order"
import type {
    Production,
    ProductionItem,
    ProductionMaterial,
} from "../data/schema"
import {
    getProductionSubStatusLabel,
    getProductionSubStatusVariant,
} from "./production-status"

type Props = {
    production: Production
}

export function ProductionDetailPanel({ production }: Props) {
    const items = production.items ?? []
    const warnings = production.warnings ?? []
    const actionLogs = production.action_logs ?? []
    const fifoRuns = production.fifo_runs ?? []
    const openWarnings = warnings.filter((x) => !x.resolved_at)
    const shortageCount = countShortage(items)

    return (
        <div className="space-y-5">
            <ProductionHeader production={production} />
            <ProductionActionBar production={production} />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <DetailMetric
                    icon={Factory}
                    label="Thành phẩm"
                    value={formatNumber(items.length)}
                    hint="Số dòng TP trong lệnh"
                    tone="primary"
                />
                <DetailMetric
                    icon={CircleDollarSign}
                    label="Tổng giá thành"
                    value={formatCurrency(sumItems(items, "total_cost"))}
                    hint="Tổng chi phí đã tính"
                    tone="info"
                />
                <DetailMetric
                    icon={Boxes}
                    label="Dòng thiếu tồn"
                    value={formatNumber(shortageCount)}
                    hint={shortageCount > 0 ? "Cần bổ sung tồn hoặc giảm SL SX" : "Đủ tồn theo FIFO"}
                    tone={shortageCount > 0 ? "warn" : "success"}
                />
                <DetailMetric
                    icon={openWarnings.length ? AlertTriangle : CheckCircle2}
                    label="Cảnh báo mở"
                    value={formatNumber(openWarnings.length)}
                    hint={openWarnings.length ? "Cần kiểm tra trước khi nhập TP" : "Không có cảnh báo"}
                    tone={openWarnings.length ? "warn" : "muted"}
                />
            </div>

            <Tabs defaultValue="items">
                <TabsList className="bg-muted/70 h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl p-1">
                    <TabsTrigger value="items" className="h-10 shrink-0 px-4">
                        <Factory className="mr-2 h-4 w-4" />
                        Thành phẩm
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="h-10 shrink-0 px-4">
                        <Layers3 className="mr-2 h-4 w-4" />
                        Vật tư
                    </TabsTrigger>
                    <TabsTrigger value="fifo" className="h-10 shrink-0 px-4">
                        <Route className="mr-2 h-4 w-4" />
                        FIFO
                    </TabsTrigger>
                    <TabsTrigger value="outputs" className="h-10 shrink-0 px-4">
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Nhập TP
                    </TabsTrigger>
                    <TabsTrigger value="vouchers" className="h-10 shrink-0 px-4">
                        <FileText className="mr-2 h-4 w-4" />
                        Chứng từ
                    </TabsTrigger>
                    <TabsTrigger value="warnings" className="h-10 shrink-0 px-4">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Cảnh báo
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="h-10 shrink-0 px-4">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="mt-4 space-y-3">
                    {items.map((item) => (
                        <FinishedProductBlock key={item.id} production={production} item={item} />
                    ))}
                </TabsContent>

                <TabsContent value="materials" className="mt-4">
                    <MaterialsTable production={production} />
                </TabsContent>

                <TabsContent value="fifo" className="mt-4">
                    <FifoTab production={production} fifoRuns={fifoRuns} />
                </TabsContent>

                <TabsContent value="outputs" className="mt-4">
                    <OutputsTab production={production} />
                </TabsContent>

                <TabsContent value="vouchers" className="mt-4">
                    <ProductionVoucherTab production={production} />
                </TabsContent>

                <TabsContent value="warnings" className="mt-4">
                    <SimpleTable
                        empty="Không có cảnh báo"
                        headers={["Mức", "Mã", "Nội dung", "Trạng thái"]}
                        rows={warnings.map((w) => [
                            <Badge key="severity" variant={w.severity === "ERROR" ? "destructive" : "secondary"}>{w.severity}</Badge>,
                            w.warning_code,
                            w.message,
                            w.resolved_at ? "Đã xử lý" : "Chưa xử lý",
                        ])}
                    />
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                    <SimpleTable
                        empty="Chưa có log thao tác"
                        headers={["Thời điểm", "Đối tượng", "Hành động", "Ghi chú"]}
                        rows={actionLogs.map((l) => [
                            l.created_at,
                            l.entity_type,
                            l.action,
                            l.note,
                        ])}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ProductionHeader({ production }: { production: Production }) {
    const items = production.items ?? []
    const warehouses = Array.from(
        new Set(items.map((item) => item.warehouse?.name).filter(Boolean))
    )

    return (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="grid lg:grid-cols-[minmax(360px,1.2fr)_minmax(360px,0.8fr)]">
                <div className="min-w-0 border-b p-5 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            #{production.id}
                        </span>
                        <StatusBadge value={production.status} />
                    </div>
                    <h3 className="mt-3 truncate text-2xl font-bold">
                            {production.production_no || `Lệnh #${production.id}`}
                    </h3>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            Ngày lệnh {formatDate(production.production_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Warehouse className="h-4 w-4" />
                            Kho nhập {warehouses.length ? warehouses.join(", ") : "-"}
                        </span>
                    </div>
                </div>

                <div className="grid gap-2 p-5 text-sm sm:grid-cols-3">
                    <MiniInfo label="Kỳ tính giá" value={production.costing_period || "-"} />
                    <MiniInfo label="Số dòng TP" value={formatNumber(items.length)} />
                    <MiniInfo label="Tạo lúc" value={formatDateTime(production.created_at)} />
                </div>
            </div>

            {production.note && (
                <div className="border-t bg-muted/30 px-5 py-3 text-sm text-muted-foreground">
                    {production.note}
                </div>
            )}
        </div>
    )
}

function ProductionActionBar({ production }: { production: Production }) {
    const queryClient = useQueryClient()
    const shortageCount = countShortage(production.items ?? [])
    const isClosed = isProductionClosed(production)
    const canGenerate = canGenerateMaterials(production)
    const canAllocateFifo = canRunFifo(production)
    const canConfirm = canReceiveOutput(production)

    const refresh = () => {
        void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
        void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
        void queryClient.invalidateQueries({ queryKey: ["productions"] })
    }

    const generateMutation = useMutation({
        mutationFn: () => generateProductionMaterials(production.id),
        onSuccess: () => {
            toast.success("Đã sinh vật tư")
            refresh()
        },
        onError: (e: any) => toast.error(e.message || "Không thể sinh vật tư"),
    })

    const fifoMutation = useMutation({
        mutationFn: () => allocateProductionFifo(production.id),
        onSuccess: () => {
            toast.success("Đã chạy FIFO")
            refresh()
        },
        onError: (e: any) => toast.error(e.message || "Không thể chạy FIFO"),
    })

    const isBusy =
        generateMutation.isPending ||
        fifoMutation.isPending

    return (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                <div>
                    <div className="font-semibold">Luồng xử lý sản xuất</div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        Sinh vật tư → chạy FIFO → nhập thành phẩm.
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        disabled={isBusy || !canGenerate}
                        onClick={() => generateMutation.mutate()}
                    >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Sinh vật tư
                    </Button>

                    <Button
                        variant="outline"
                        disabled={isBusy || !canAllocateFifo}
                        onClick={() => fifoMutation.mutate()}
                    >
                        <Route className="mr-2 h-4 w-4" />
                        Chạy FIFO
                    </Button>

                    <ReceiveOutputDialog
                        production={production}
                        disabled={isBusy || !canConfirm || shortageCount > 0}
                        onDone={refresh}
                    />
                </div>
            </div>

            {isClosed && (
                <div className="mx-4 my-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Lệnh đã nhập thành phẩm hoặc đã đóng, không thể thao tác thêm.
                </div>
            )}

            {!isClosed && (
                <div className="mx-4 my-3 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    Bước hiện tại: {getProductionStepMessage(production)}
                </div>
            )}

            {shortageCount > 0 && (
                <div className="mx-4 mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Còn {shortageCount} dòng vật tư chưa được FIFO đủ. Vào tab Vật tư để xem dòng thiếu,
                    bổ sung tồn kho hoặc giảm số lượng sản xuất rồi chạy FIFO lại trước khi nhập TP.
                </div>
            )}
        </div>
    )
}

type OutputConfirmRow = {
    production_item_id: number
    output_id?: number
    product_label: string
    warehouse_label: string
    quantity_label: string
    lot_no: string
    expiry_date: string
    note?: string
}

function ReceiveOutputDialog({
    production,
    disabled,
    onDone,
}: {
    production: Production
    disabled: boolean
    onDone: () => void
}) {
    const [open, setOpen] = useState(false)
    const [rows, setRows] = useState<OutputConfirmRow[]>(() =>
        buildOutputConfirmRows(production)
    )

    const confirmMutation = useMutation({
        mutationFn: () =>
            confirmProduction(production.id, {
                outputs: rows.map((row) => ({
                    production_item_id: row.production_item_id,
                    output_id: row.output_id,
                    lot_no: row.lot_no,
                    expiry_date: row.expiry_date,
                    note: row.note || undefined,
                })),
            }),
        onSuccess: () => {
            toast.success("Đã nhập thành phẩm")
            setOpen(false)
            onDone()
        },
        onError: (e: any) => toast.error(e.message || "Không thể nhập thành phẩm"),
    })

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setRows(buildOutputConfirmRows(production))
        }
        setOpen(nextOpen)
    }

    const updateRow = (index: number, patch: Partial<OutputConfirmRow>) => {
        setRows((old) =>
            old.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row
            )
        )
    }

    const submit = () => {
        if (!rows.length) {
            return toast.error("Không có dòng thành phẩm để nhập kho")
        }

        for (const [index, row] of rows.entries()) {
            if (!row.lot_no?.trim()) {
                return toast.error(`Dòng thành phẩm #${index + 1} chưa nhập số lô TP`)
            }
            if (!row.expiry_date) {
                return toast.error(`Dòng thành phẩm #${index + 1} chưa nhập HSD TP`)
            }
        }

        confirmMutation.mutate()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Nhập TP
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[88vh] !max-w-4xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Nhập thành phẩm</DialogTitle>
                    <DialogDescription>
                        Kiểm tra số lượng nhập kho và nhập số lô, hạn sử dụng thực tế của thành phẩm.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <div className="space-y-3">
                        {rows.map((row, index) => (
                            <div key={`${row.production_item_id}-${row.output_id ?? index}`} className="rounded-md border">
                                <div className="grid gap-3 p-3 lg:grid-cols-[minmax(260px,1fr)_160px_180px_180px]">
                                    <div className="min-w-0">
                                        <Label className="text-sm">Thành phẩm #{index + 1}</Label>
                                        <div className="mt-2 truncate font-medium">
                                            {row.product_label}
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            Kho nhập: {row.warehouse_label}
                                        </div>
                                    </div>

                                    <Field label="SL nhập">
                                        <Input value={row.quantity_label} disabled />
                                    </Field>

                                    <Field label="Số lô TP" required>
                                        <Input
                                            value={row.lot_no}
                                            onChange={(event) =>
                                                updateRow(index, { lot_no: event.target.value })
                                            }
                                            placeholder="VD: LOT-20260514-01"
                                        />
                                    </Field>

                                    <Field label="HSD TP" required>
                                        <DatePicker
                                            value={row.expiry_date}
                                            onChange={(value) =>
                                                updateRow(index, { expiry_date: value || "" })
                                            }
                                            placeholder="Chọn HSD"
                                        />
                                    </Field>
                                </div>

                                <div className="border-t bg-muted/20 p-3">
                                    <Field label="Ghi chú">
                                        <Input
                                            value={row.note ?? ""}
                                            onChange={(event) =>
                                                updateRow(index, { note: event.target.value })
                                            }
                                            placeholder="Ghi chú riêng cho dòng nhập TP"
                                        />
                                    </Field>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Hủy
                        </Button>
                    </DialogClose>
                    <Button onClick={submit} disabled={confirmMutation.isPending}>
                        <PackageCheck className="mr-2 h-4 w-4" />
                        {confirmMutation.isPending ? "Đang nhập..." : "Xác nhận nhập TP"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function buildOutputConfirmRows(production: Production): OutputConfirmRow[] {
    const rows: OutputConfirmRow[] = []

    for (const item of production.items ?? []) {
        const outputs = item.outputs?.length ? item.outputs : [undefined]

        for (const output of outputs) {
            rows.push({
                production_item_id: item.id,
                output_id: output?.id,
                product_label: productName(item.product),
                warehouse_label: output?.warehouse?.name || item.warehouse?.name || "-",
                quantity_label: formatQty(output?.quantity ?? item.quantity_done, item.product?.unit),
                lot_no:
                    output?.lot_no ||
                    item.output_lot_no ||
                    defaultOutputLotNo(production, item, output),
                expiry_date: output?.expiry_date || item.output_expiry_date || "",
                note: output?.note || item.note || "",
            })
        }
    }

    return rows
}

function defaultOutputLotNo(
    production: Production,
    item: ProductionItem,
    output?: NonNullable<ProductionItem["outputs"]>[number]
) {
    return `${production.production_no || `SX-${production.id}`}-TP-${output?.id ?? item.id}`
}

function FinishedProductBlock({
    production,
    item,
}: {
    production: Production
    item: ProductionItem
}) {
    const canAdjust = canAdjustMaterials(production)

    return (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="grid border-b bg-muted/30 lg:grid-cols-[minmax(320px,1.3fr)_minmax(240px,0.7fr)]">
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {item.product?.code || `#${item.product_id}`}
                        </span>
                        <StatusBadge value={item.check_status} />
                        <StatusBadge value={item.fifo_status} />
                    </div>
                    <div className="mt-2 text-lg font-bold leading-snug">
                        {item.product?.name || "-"}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        BOM {item.bom_version || "-"} · SL kế hoạch {formatQty(item.quantity_plan, item.product?.unit)} · SL nhập {formatQty(item.quantity_done, item.product?.unit)}
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2 p-4 lg:justify-end">
                    <ExtraForm production={production} item={item} disabled={!canAdjust} />
                    <SubstitutionForm production={production} item={item} disabled={!canAdjust} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-0 divide-x divide-y md:grid-cols-5 md:divide-y-0">
                <Metric label="NVL" value={formatCurrency(item.total_nvl_cost)} />
                <Metric label="Bao bì" value={formatCurrency(item.total_bb_cost)} />
                <Metric label="Gia công" value={formatCurrency(item.processing_cost)} />
                <Metric label="Chi phí chung" value={formatCurrency(item.overhead_cost)} />
                <Metric label="Giá thành/ĐV" value={formatCurrency(item.unit_cost)} />
            </div>

            <ItemAdjustments item={item} />
        </div>
    )
}

function ItemAdjustments({ item }: { item: ProductionItem }) {
    const extras = item.extras ?? []
    const substitutions = item.substitutions ?? []

    if (!extras.length && !substitutions.length) {
        return (
            <div className="mt-3 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                Chưa có vật tư phát sinh hoặc thay thế vật tư.
            </div>
        )
    }

    return (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border">
                <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                    Vật tư phát sinh
                </div>
                {extras.length ? (
                    <div className="divide-y">
                        {extras.map((extra) => (
                            <div key={extra.id} className="grid grid-cols-[minmax(180px,1fr)_80px_100px_100px] gap-3 px-3 py-2 text-sm">
                                <ProductCell product={extra.product} />
                                <div>
                                    <Badge variant="outline">{extra.material_type || "-"}</Badge>
                                </div>
                                <div className="text-right">
                                    {formatNumber(extra.quantity)}
                                </div>
                                <div className="text-right">
                                    {formatNumber(extra.quantity_per_unit)}
                                </div>
                                {extra.note && (
                                    <div className="col-span-4 text-muted-foreground">
                                        {extra.note}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Chưa có phát sinh
                    </div>
                )}
            </div>

            <div className="rounded-md border">
                <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                    Thay thế vật tư
                </div>
                {substitutions.length ? (
                    <div className="divide-y">
                        {substitutions.map((substitution) => (
                            <div key={substitution.id} className="grid grid-cols-[minmax(140px,1fr)_24px_minmax(140px,1fr)_90px] gap-3 px-3 py-2 text-sm">
                                <ProductCell product={substitution.original_product} />
                                <div className="text-muted-foreground">→</div>
                                <ProductCell product={substitution.substitute_product} />
                                <div className="text-right">
                                    {formatNumber(substitution.quantity)}
                                </div>
                                {(substitution.reason || substitution.note) && (
                                    <div className="col-span-4 text-muted-foreground">
                                        {substitution.reason || substitution.note}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Chưa có thay thế
                    </div>
                )}
            </div>
        </div>
    )
}

function MaterialsTable({ production }: { production: Production }) {
    const canPickLot = canRunFifo(production)
    const items = production.items ?? []
    const materials = items.flatMap((item) =>
        (item.materials ?? []).map((material) => ({
            ...material,
            finished_product: item.product,
            finished_item: item,
        }))
    )
    const shortageCount = materials.filter((m) => Number(m.shortage_quantity) > 0).length
    const hsdWarningCount = materials.reduce(
        (sum, material) =>
            sum +
            (material.fifo_allocations ?? []).filter(
                (allocation) => getExpiryStatus(allocation.expiry_date).tone !== "ok"
            ).length,
        0
    )

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Dòng vật tư" value={formatNumber(materials.length)} />
                <Metric label="Đã FIFO" value={formatNumber(materials.filter((m) => Number(m.allocated_quantity) > 0).length)} />
                <Metric label="Thiếu tồn" value={formatNumber(shortageCount)} tone={shortageCount > 0 ? "bad" : "ok"} />
                <Metric label="Cảnh báo HSD" value={formatNumber(hsdWarningCount)} tone={hsdWarningCount > 0 ? "bad" : "ok"} />
            </div>

            {!materials.length && (
                <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    Chưa sinh vật tư. Bấm “Sinh vật tư” để hệ thống lấy định mức BOM vào lệnh.
                </div>
            )}

            {items.map((item) => {
                const itemMaterials = item.materials ?? []
                if (!itemMaterials.length) return null

                const itemShortage = itemMaterials.filter((m) => Number(m.shortage_quantity) > 0).length
                const requiredQty = sumBy(itemMaterials, (m) => m.quantity_required)
                const allocatedQty = sumBy(itemMaterials, (m) => m.allocated_quantity)

                return (
                    <div key={item.id} className="rounded-md border">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                            <div>
                                <div className="font-semibold">
                                    {item.product?.code} - {item.product?.name}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    BOM {item.bom_version || "-"} · SL kế hoạch {formatQty(item.quantity_plan, item.product?.unit)} · SL nhập TP {formatQty(item.quantity_done, item.product?.unit)}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={itemShortage > 0 ? "destructive" : "secondary"}>
                                    {itemShortage > 0 ? `${itemShortage} dòng thiếu tồn` : "Đủ FIFO"}
                                </Badge>
                                <Badge variant="outline">
                                    Cần {formatNumber(requiredQty)} · Đã FIFO {formatNumber(allocatedQty)}
                                </Badge>
                            </div>
                        </div>

                        <div className="divide-y">
                            {itemMaterials.map((material) => (
                                <MaterialCheckRow
                                    key={material.id}
                                    production={production}
                                    material={material}
                                    canPickLot={canPickLot}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function MaterialCheckRow({
    production,
    material,
    canPickLot,
}: {
    production: Production
    material: ProductionMaterial
    canPickLot: boolean
}) {
    const shortage = Number(material.shortage_quantity) || 0
    const required = Number(material.quantity_required) || 0
    const allocated = Number(material.allocated_quantity) || 0
    const progress = required > 0 ? Math.min(100, Math.round((allocated / required) * 100)) : 0
    const hsdWarnings = (material.fifo_allocations ?? []).filter(
        (allocation) => getExpiryStatus(allocation.expiry_date).tone !== "ok"
    )

    return (
        <div className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(260px,1.5fr)_180px_180px_190px]">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-medium">
                        {material.product?.code || `#${material.product_id}`}
                    </div>
                    <Badge variant="outline">{material.material_type || "-"}</Badge>
                    <Badge variant="outline">{sourceTypeLabel(material.source_type)}</Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                    {material.product?.name || "-"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Kho xuất: {material.warehouse?.name || "-"}</span>
                    <span>Định mức/ĐV: {formatNumber(material.quantity_per_unit)}</span>
                </div>
            </div>

            <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">SL cần</span>
                    <span className="font-medium">{formatNumber(required)}</span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Đã FIFO</span>
                    <span className="font-medium">{formatNumber(allocated)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                    <div className={shortage > 0 ? "h-1.5 rounded-full bg-destructive" : "h-1.5 rounded-full bg-primary"} style={{ width: `${progress}%` }} />
                </div>
                {shortage > 0 && (
                    <div className="text-xs font-medium text-destructive">
                        Thiếu {formatNumber(shortage)}
                    </div>
                )}
            </div>

            <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Giá FIFO</span>
                    <span className="font-medium">{formatCurrency(material.fifo_unit_cost)}</span>
                </div>
                <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Thành tiền</span>
                    <span className="font-medium">{formatCurrency(material.fifo_total_cost)}</span>
                </div>
                <StatusBadge value={material.fifo_status} />
            </div>

            <div className="space-y-2">
                <PreferredLotForm production={production} material={material} disabled={!canPickLot} />
                <FifoLotSummary allocations={material.fifo_allocations ?? []} />
                {hsdWarnings.length > 0 && (
                    <div className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                        {hsdWarnings.length} lô cần chú ý HSD
                    </div>
                )}
            </div>
        </div>
    )
}

function FifoLotSummary({ allocations }: { allocations: NonNullable<ProductionMaterial["fifo_allocations"]> }) {
    if (!allocations.length) {
        return <div className="text-xs text-muted-foreground">Chưa có lô FIFO</div>
    }

    return (
        <div className="space-y-1">
            {allocations.slice(0, 2).map((allocation) => (
                <div key={allocation.id} className="rounded border px-2 py-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{allocation.lot_no || "-"}</span>
                        <ExpiryBadge date={allocation.expiry_date} />
                    </div>
                    <div className="mt-0.5 text-muted-foreground">
                        SL {formatNumber(allocation.quantity)} · {formatCurrency(allocation.unit_cost)}
                    </div>
                </div>
            ))}
            {allocations.length > 2 && (
                <div className="text-xs text-muted-foreground">
                    +{allocations.length - 2} lô khác
                </div>
            )}
        </div>
    )
}

function FifoTab({
    production,
    fifoRuns,
}: {
    production: Production
    fifoRuns: any[]
}) {
    const allocations = (production.items ?? []).flatMap((item) =>
        (item.materials ?? []).flatMap((material) =>
            (material.fifo_allocations ?? []).map((allocation) => ({
                ...allocation,
                material,
                finished_product: item.product,
            }))
        )
    )

    return (
        <div className="space-y-3">
            <SimpleTable
                empty="Chưa có lần chạy FIFO"
                headers={["ID", "Phạm vi", "Trạng thái", "Bắt đầu", "Kết thúc", "Ghi chú"]}
                rows={fifoRuns.map((r) => [
                    r.id,
                    r.run_scope,
                    getProductionSubStatusLabel(r.status),
                    r.started_at,
                    r.finished_at,
                    r.note,
                ])}
            />

            <SimpleTable
                empty="Chưa có phân bổ FIFO"
                headers={["TP", "Vật tư", "Lô", "Ngày nhập", "HSD", "Cảnh báo", "SL", "Đơn giá", "Thành tiền", "Ưu tiên"]}
                rows={allocations.map((a) => [
                    a.finished_product?.code,
                    a.material?.product?.code,
                    a.lot_no,
                    a.inbound_date,
                    formatDate(a.expiry_date),
                    <ExpiryBadge key="expiry" date={a.expiry_date} />,
                    formatNumber(a.quantity),
                    formatCurrency(a.unit_cost),
                    formatCurrency(a.amount),
                    a.is_preferred_lot ? "Có" : "",
                ])}
            />
        </div>
    )
}

function OutputsTab({ production }: { production: Production }) {
    const rows: { item: ProductionItem; output?: NonNullable<ProductionItem["outputs"]>[number] }[] = []

    for (const item of production.items ?? []) {
        const outputs = item.outputs ?? []

        if (!outputs.length) {
            rows.push({ item })
            continue
        }

        for (const output of outputs) {
            rows.push({ item, output })
        }
    }

    return (
        <SimpleTable
            empty="Chưa nhập thành phẩm"
            headers={["Thành phẩm", "Kho", "SL kế hoạch", "SL nhập", "Số lô", "HSD", "Giá thành/ĐV", "Trạng thái"]}
            rows={rows.map(({ item, output }) => [
                <ProductCell key="product" product={item.product} />,
                output?.warehouse?.name || item.warehouse?.name || "-",
                formatQty(item.quantity_plan, item.product?.unit),
                formatQty(output?.quantity ?? item.quantity_done, item.product?.unit),
                output?.lot_no || item.output_lot_no || "-",
                formatDate(output?.expiry_date || item.output_expiry_date),
                formatCurrency(output?.unit_cost ?? item.unit_cost),
                getProductionSubStatusLabel(output?.status || item.fifo_status),
            ])}
        />
    )
}

type IssueVoucherRow = {
    item: ProductionItem
    material: ProductionMaterial
    allocation: NonNullable<ProductionMaterial["fifo_allocations"]>[number]
}

type OutputVoucherRow = {
    item: ProductionItem
    output?: NonNullable<ProductionItem["outputs"]>[number]
}

function ProductionVoucherTab({ production }: { production: Production }) {
    const issueRows = getIssueVoucherRows(production)
    const outputRows = getOutputVoucherRows(production)
    const status = productionStatus(production)
    const issueDocNo = buildVoucherNo(production, "XK-SX")
    const outputDocNo = buildVoucherNo(production, "NK-TP")
    const issueQuantity = sumBy(issueRows, (row) => row.allocation.quantity)
    const issueAmount = sumBy(issueRows, (row) => row.allocation.amount)
    const outputQuantity = sumBy(outputRows, (row) => row.output?.quantity ?? row.item.quantity_done)
    const outputAmount = sumBy(outputRows, (row) => row.output?.total_cost ?? row.item.total_cost)
    const shortageCount = countShortage(production.items ?? [])
    const issueCsvRows = issueRows.map((row) => ({
        "Đối tượng THCP": productName(row.item.product),
        "Vật tư xuất": productName(row.material.product || row.allocation.material_product),
        "Kho xuất": row.allocation.warehouse?.name || row.material.warehouse?.name || "-",
        "Lô xuất": row.allocation.lot_no || "-",
        "Ngày lô": formatDate(row.allocation.inbound_date),
        "HSD": formatDate(row.allocation.expiry_date),
        "SL xuất": formatNumber(row.allocation.quantity),
        "Đơn giá": row.allocation.unit_cost ?? 0,
        "Thành tiền": row.allocation.amount ?? 0,
    }))
    const outputCsvRows = outputRows.map(({ item, output }) => ({
        "Thành phẩm": productName(item.product),
        "Kho nhập": output?.warehouse?.name || item.warehouse?.name || "-",
        "Số lô TP": output?.lot_no || item.output_lot_no || "-",
        "HSD": formatDate(output?.expiry_date || item.output_expiry_date),
        "SL nhập": formatQty(output?.quantity ?? item.quantity_done, item.product?.unit),
        "Giá thành/ĐV": output?.unit_cost ?? item.unit_cost ?? 0,
        "Thành tiền": output?.total_cost ?? item.total_cost ?? 0,
        "Trạng thái": getProductionSubStatusLabel(output?.status || item.fifo_status),
    }))

    return (
        <div className="space-y-4">
            <VoucherSection
                title="Phiếu xuất kho sản xuất"
                docNo={issueDocNo}
                date={production.production_date}
                status={getIssueVoucherStatus(status, shortageCount, issueRows.length)}
                metrics={[
                    { label: "Dòng vật tư", value: formatNumber(issueRows.length) },
                    { label: "Tổng SL xuất", value: formatNumber(issueQuantity) },
                    { label: "Tổng giá trị xuất", value: formatCurrency(issueAmount) },
                ]}
                onPrint={() => printVoucher({
                    title: "Phiếu xuất kho sản xuất",
                    docNo: issueDocNo,
                    date: production.production_date,
                    status: getIssueVoucherStatus(status, shortageCount, issueRows.length),
                    rows: issueCsvRows,
                })}
                onExport={() => downloadCsv(`${issueDocNo}.csv`, issueCsvRows)}
                note={
                    issueRows.length
                        ? "Phiếu xuất kho SX được hình thành từ các dòng FIFO đã phân bổ. Khi nhập TP, hệ thống trừ tồn theo đúng các lô này."
                        : "Chưa có phiếu xuất kho SX vì lệnh chưa chạy FIFO hoặc FIFO chưa có dòng phân bổ."
                }
            >
                <SimpleTable
                    empty="Chưa có dòng xuất kho sản xuất"
                    headers={["Đối tượng THCP", "Vật tư xuất", "Kho xuất", "Lô xuất", "Ngày lô", "HSD", "Cảnh báo", "SL xuất", "Đơn giá", "Thành tiền"]}
                    rows={issueRows.map((row) => [
                        <ProductCell key="finished-product" product={row.item.product} />,
                        <ProductCell key="material" product={row.material.product || row.allocation.material_product} />,
                        row.allocation.warehouse?.name || row.material.warehouse?.name || "-",
                        row.allocation.lot_no || "-",
                        formatDate(row.allocation.inbound_date),
                        formatDate(row.allocation.expiry_date),
                        <ExpiryBadge key="expiry" date={row.allocation.expiry_date} />,
                        formatNumber(row.allocation.quantity),
                        formatCurrency(row.allocation.unit_cost),
                        formatCurrency(row.allocation.amount),
                    ])}
                />
            </VoucherSection>

            <VoucherSection
                title="Phiếu nhập kho thành phẩm"
                docNo={outputDocNo}
                date={production.production_date}
                status={getOutputVoucherStatus(status, outputRows.length)}
                metrics={[
                    { label: "Dòng thành phẩm", value: formatNumber(outputRows.length) },
                    { label: "Tổng SL nhập", value: formatNumber(outputQuantity) },
                    { label: "Tổng giá trị nhập", value: formatCurrency(outputAmount) },
                ]}
                onPrint={() => printVoucher({
                    title: "Phiếu nhập kho thành phẩm",
                    docNo: outputDocNo,
                    date: production.production_date,
                    status: getOutputVoucherStatus(status, outputRows.length),
                    rows: outputCsvRows,
                })}
                onExport={() => downloadCsv(`${outputDocNo}.csv`, outputCsvRows)}
                note={
                    status === "OUTPUT_RECEIVED"
                        ? "Phiếu nhập TP đã ghi nhận tồn kho thành phẩm theo giá thành sau FIFO."
                        : "Phiếu nhập TP sẽ được ghi sổ sau khi FIFO phân bổ đủ và bấm Nhập TP."
                }
            >
                <SimpleTable
                    empty="Chưa có dòng nhập kho thành phẩm"
                    headers={["Thành phẩm", "Kho nhập", "Số lô TP", "HSD", "SL nhập", "Giá thành/ĐV", "Thành tiền", "Trạng thái"]}
                    rows={outputRows.map(({ item, output }) => [
                        <ProductCell key="product" product={item.product} />,
                        output?.warehouse?.name || item.warehouse?.name || "-",
                        output?.lot_no || item.output_lot_no || "-",
                        formatDate(output?.expiry_date || item.output_expiry_date),
                        formatQty(output?.quantity ?? item.quantity_done, item.product?.unit),
                        formatCurrency(output?.unit_cost ?? item.unit_cost),
                        formatCurrency(output?.total_cost ?? item.total_cost),
                        getProductionSubStatusLabel(output?.status || item.fifo_status),
                    ])}
                />
            </VoucherSection>
        </div>
    )
}

function VoucherSection({
    title,
    docNo,
    date,
    status,
    metrics,
    note,
    onPrint,
    onExport,
    children,
}: {
    title: string
    docNo: string
    date?: string
    status: string
    metrics: { label: string; value: React.ReactNode }[]
    note: string
    onPrint: () => void
    onExport: () => void
    children: React.ReactNode
}) {
    return (
        <div className="rounded-md border">
            <div className="border-b bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{title}</h3>
                            <Badge variant="outline">{status}</Badge>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            Số phiếu {docNo} · Ngày chứng từ {formatDate(date)}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-start justify-end gap-2">
                        <div className="grid min-w-[320px] grid-cols-3 gap-2">
                            {metrics.map((metric) => (
                                <Metric key={metric.label} label={metric.label} value={metric.value} />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                In
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={onExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Xuất CSV
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-3 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                    {note}
                </div>
            </div>
            <div className="p-3">
                {children}
            </div>
        </div>
    )
}

function getIssueVoucherRows(production: Production): IssueVoucherRow[] {
    return (production.items ?? []).flatMap((item) =>
        (item.materials ?? []).flatMap((material) =>
            (material.fifo_allocations ?? []).map((allocation) => ({
                item,
                material,
                allocation,
            }))
        )
    )
}

function getOutputVoucherRows(production: Production): OutputVoucherRow[] {
    const rows: OutputVoucherRow[] = []

    for (const item of production.items ?? []) {
        const outputs = item.outputs ?? []

        if (!outputs.length) {
            rows.push({ item })
            continue
        }

        for (const output of outputs) {
            rows.push({ item, output })
        }
    }

    return rows
}

function buildVoucherNo(production: Production, suffix: string) {
    return `${production.production_no || `SX-${production.id}`}-${suffix}`
}

function getIssueVoucherStatus(status: string, shortageCount: number, rowCount: number) {
    if (status === "OUTPUT_RECEIVED") return "Đã ghi sổ"
    if (shortageCount > 0) return "Thiếu tồn"
    if (rowCount > 0) return "Đã phân bổ FIFO"
    return "Chưa phát sinh"
}

function getOutputVoucherStatus(status: string, rowCount: number) {
    if (status === "OUTPUT_RECEIVED") return "Đã ghi sổ"
    if (status === "FIFO_ALLOCATED") return "Chờ nhập TP"
    if (rowCount > 0) return "Dự kiến"
    return "Chưa phát sinh"
}

function ExtraForm({
    production,
    item,
    disabled,
}: {
    production: Production
    item: ProductionItem
    disabled?: boolean
}) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [productId, setProductId] = useState<number>()
    const [warehouseId, setWarehouseId] = useState<number>()
    const [materialType, setMaterialType] = useState("NVL")
    const [quantityPerUnit, setQuantityPerUnit] = useState("")
    const [quantity, setQuantity] = useState("")
    const [note, setNote] = useState("")

    const mutation = useMutation({
        mutationFn: () =>
            addProductionExtraMaterial(production.id, {
                production_item_id: item.id,
                product_id: productId,
                warehouse_id: warehouseId,
                material_type: materialType,
                quantity_per_unit: toNumber(quantityPerUnit),
                quantity: toNumber(quantity),
                note,
            }),
        onSuccess: () => {
            toast.success("Đã thêm vật tư phát sinh")
            setProductId(undefined)
            setWarehouseId(undefined)
            setQuantity("")
            setQuantityPerUnit("")
            setNote("")
            setOpen(false)
            void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
            void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            void queryClient.invalidateQueries({ queryKey: ["productions"] })
        },
        onError: (e: any) => toast.error(e.message || "Không thể thêm phát sinh"),
    })

    return (
        <Dialog open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm phát sinh
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thêm vật tư phát sinh</DialogTitle>
                    <DialogDescription>
                        {item.product?.code} - {item.product?.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Vật tư">
                        <AsyncSelect
                            value={productId}
                            onChange={(v: any) => setProductId(v || undefined)}
                            placeholder="Chọn vật tư"
                            dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                            mapOption={(x: any) => ({ value: x.id, label: `${x.code} - ${x.name}` })}
                        />
                    </Field>
                    <Field label="Kho xuất">
                        <AsyncSelect
                            value={warehouseId}
                            onChange={(v: any) => setWarehouseId(v || undefined)}
                            placeholder="Theo kho thành phẩm"
                            dataSource={{ getList: listWarehouses, getById: getWarehouse, params: { page: 1, size: 20 } }}
                            mapOption={(x: any) => ({ value: x.id, label: x.name })}
                        />
                    </Field>
                    <Field label="Loại vật tư">
                        <Select value={materialType} onValueChange={setMaterialType}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NVL">Nguyên vật liệu</SelectItem>
                                <SelectItem value="BB">Bao bì</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Tổng số lượng">
                        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="VD: 12.5" type="number" />
                    </Field>
                    <Field label="Định mức / 1 đơn vị">
                        <Input value={quantityPerUnit} onChange={(e) => setQuantityPerUnit(e.target.value)} placeholder="Có thể bỏ trống" type="number" />
                    </Field>
                    <Field label="Ghi chú">
                        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do phát sinh" className="min-h-9" />
                    </Field>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Hủy</Button>
                    </DialogClose>
                    <Button onClick={() => mutation.mutate()} disabled={disabled || mutation.isPending || !productId || (!quantity && !quantityPerUnit)}>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu phát sinh
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SubstitutionForm({
    production,
    item,
    disabled,
}: {
    production: Production
    item: ProductionItem
    disabled?: boolean
}) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [originalProductId, setOriginalProductId] = useState<number>()
    const [substituteProductId, setSubstituteProductId] = useState<number>()
    const [quantity, setQuantity] = useState("")
    const [reason, setReason] = useState("")

    const mutation = useMutation({
        mutationFn: () =>
            addProductionSubstitution(production.id, {
                production_item_id: item.id,
                original_product_id: originalProductId,
                substitute_product_id: substituteProductId,
                quantity: toNumber(quantity),
                reason,
            }),
        onSuccess: () => {
            toast.success("Đã thêm thay thế vật tư")
            setOriginalProductId(undefined)
            setSubstituteProductId(undefined)
            setQuantity("")
            setReason("")
            setOpen(false)
            void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
            void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            void queryClient.invalidateQueries({ queryKey: ["productions"] })
        },
        onError: (e: any) => toast.error(e.message || "Không thể thêm thay thế"),
    })

    return (
        <Dialog open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={disabled}>
                    <Replace className="mr-2 h-4 w-4" />
                    Thay thế vật tư
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Thay thế vật tư</DialogTitle>
                    <DialogDescription>
                        {item.product?.code} - {item.product?.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Vật tư gốc">
                        <AsyncSelect
                            value={originalProductId}
                            onChange={(v: any) => setOriginalProductId(v || undefined)}
                            placeholder="Chọn vật tư cần thay"
                            dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                            mapOption={(x: any) => ({ value: x.id, label: `${x.code} - ${x.name}` })}
                        />
                    </Field>
                    <Field label="Vật tư thay thế">
                        <AsyncSelect
                            value={substituteProductId}
                            onChange={(v: any) => setSubstituteProductId(v || undefined)}
                            placeholder="Chọn vật tư thay thế"
                            dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                            mapOption={(x: any) => ({ value: x.id, label: `${x.code} - ${x.name}` })}
                        />
                    </Field>
                    <Field label="Số lượng thay thế">
                        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="VD: 10" type="number" />
                    </Field>
                    <Field label="Lý do">
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Hết lô NVL chính" />
                    </Field>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Hủy</Button>
                    </DialogClose>
                    <Button onClick={() => mutation.mutate()} disabled={disabled || mutation.isPending || !originalProductId || !substituteProductId || !quantity}>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay thế
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PreferredLotForm({
    production,
    material,
    disabled,
}: {
    production: Production
    material: ProductionMaterial
    disabled?: boolean
}) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [lotNo, setLotNo] = useState(material.preferred_lot_no ?? "")

    const mutation = useMutation({
        mutationFn: () =>
            setProductionPreferredLot(production.id, material.id, {
                lot_no: lotNo || undefined,
            }),
        onSuccess: () => {
            toast.success("Đã cập nhật lô ưu tiên")
            setOpen(false)
            void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
            void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            void queryClient.invalidateQueries({ queryKey: ["productions"] })
        },
        onError: (e: any) => toast.error(e.message || "Không thể cập nhật lô"),
    })

    return (
        <Dialog open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
            <DialogTrigger asChild>
                <Button size="sm" variant={material.preferred_lot_no ? "secondary" : "outline"} disabled={disabled}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    {material.preferred_lot_no || "Chọn lô"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lô ưu tiên</DialogTitle>
                    <DialogDescription>
                        {material.product?.code} - {material.product?.name}
                    </DialogDescription>
                </DialogHeader>
                <Field label="Số lô ưu tiên">
                    <Input value={lotNo} onChange={(e) => setLotNo(e.target.value)} placeholder="Nhập số lô muốn ưu tiên" />
                </Field>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Hủy</Button>
                    </DialogClose>
                    <Button onClick={() => mutation.mutate()} disabled={disabled || mutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu lô
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MiniInfo({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-md border bg-background px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    )
}

function DetailMetric({
    icon: Icon,
    label,
    value,
    hint,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    value: React.ReactNode
    hint: string
    tone?: "primary" | "success" | "info" | "warn" | "muted"
}) {
    const toneClass =
        tone === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : tone === "info"
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : tone === "warn"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : tone === "primary"
                        ? "bg-primary/10 text-primary border-primary/10"
                        : "bg-muted text-muted-foreground border-transparent"

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", toneClass)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-muted-foreground text-sm font-semibold">{label}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
                    <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">{hint}</div>
                </div>
            </div>
        </div>
    )
}

function ProductCell({ product }: { product?: any }) {
    if (!product) return "-"

    return (
        <div>
            <div className="font-medium">{product.code}</div>
            <div className="text-muted-foreground">{product.name}</div>
        </div>
    )
}

function ExpiryBadge({ date }: { date?: string }) {
    const status = getExpiryStatus(date)

    if (!date) {
        return <Badge variant="outline">Chưa có HSD</Badge>
    }

    return (
        <Badge variant={status.tone === "bad" ? "destructive" : status.tone === "warn" ? "outline" : "secondary"}>
            {status.label}
        </Badge>
    )
}

function getExpiryStatus(date?: string) {
    if (!date) return { label: "Chưa có HSD", tone: "warn" as const }

    const expiry = new Date(date)
    if (Number.isNaN(expiry.getTime())) return { label: "HSD không hợp lệ", tone: "warn" as const }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000)

    if (days < 0) return { label: "Hết hạn", tone: "bad" as const }
    if (days <= 180) return { label: `Cận date ${days} ngày`, tone: "warn" as const }

    return { label: "Còn hạn", tone: "ok" as const }
}

function sourceTypeLabel(value?: string) {
    switch (String(value ?? "").toUpperCase()) {
        case "BOM":
            return "Theo BOM"
        case "EXTRA":
            return "Phát sinh"
        case "SUBSTITUTE":
            return "Thay thế"
        default:
            return value || "-"
    }
}

function productName(product?: any) {
    if (!product) return "-"
    return [product.code, product.name].filter(Boolean).join(" - ")
}

function downloadCsv(fileName: string, rows: Record<string, unknown>[]) {
    if (!rows.length) {
        toast.info("Chưa có dữ liệu để xuất")
        return
    }

    const headers = Object.keys(rows[0])
    const csv = [
        headers.join(","),
        ...rows.map((row) =>
            headers
                .map((header) => csvCell(row[header]))
                .join(",")
        ),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
}

function printVoucher({
    title,
    docNo,
    date,
    status,
    rows,
}: {
    title: string
    docNo: string
    date?: string
    status: string
    rows: Record<string, unknown>[]
}) {
    if (!rows.length) {
        toast.info("Chưa có dữ liệu để in")
        return
    }

    const headers = Object.keys(rows[0])
    const html = `
        <html>
            <head>
                <title>${escapeHtml(title)} ${escapeHtml(docNo)}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                    h1 { font-size: 22px; margin: 0 0 8px; }
                    .meta { color: #4b5563; margin-bottom: 18px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
                    th { background: #f3f4f6; font-weight: 700; }
                    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 42px; text-align: center; }
                    .signatures div { min-height: 80px; }
                    @media print { body { padding: 12px; } }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(title)}</h1>
                <div class="meta">
                    Số phiếu: <strong>${escapeHtml(docNo)}</strong> · Ngày chứng từ: ${escapeHtml(formatDate(date))} · Trạng thái: ${escapeHtml(status)}
                </div>
                <table>
                    <thead>
                        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
                        ${rows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(String(row[header] ?? ""))}</td>`).join("")}</tr>`).join("")}
                    </tbody>
                </table>
                <div class="signatures">
                    <div>Người lập phiếu</div>
                    <div>Thủ kho</div>
                    <div>Kế toán</div>
                </div>
            </body>
        </html>
    `

    const win = window.open("", "_blank", "width=1100,height=800")
    if (!win) {
        toast.error("Trình duyệt đang chặn cửa sổ in")
        return
    }

    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
}

function csvCell(value: unknown) {
    const text = String(value ?? "")
    return `"${text.replace(/"/g, '""')}"`
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function Field({
    label,
    required,
    children,
}: {
    label: string
    required?: boolean
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
        </div>
    )
}

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "ok" | "bad" }) {
    return (
        <div className="rounded-md border px-3 py-2">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className={tone === "bad" ? "font-semibold text-destructive" : tone === "ok" ? "font-semibold text-emerald-600" : "font-semibold"}>
                {value}
            </div>
        </div>
    )
}

function StatusBadge({ value }: { value?: string }) {
    if (!value) return <Badge variant="outline">-</Badge>

    const status = String(value ?? "").toUpperCase()
    const variant = getProductionSubStatusVariant(status)
    const label = getProductionSubStatusLabel(status)
    const ok = variant === "secondary"

    return (
        <Badge variant={variant}>
            {ok && <CheckCircle2 className="h-3 w-3" />}
            {label}
        </Badge>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}

function formatDateTime(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString("vi-VN")
}

function formatQty(value?: number, unit?: string) {
    const text = formatNumber(value)
    return unit ? `${text} ${unit}` : text
}

function SimpleTable({
    headers,
    rows,
    empty,
}: {
    headers: string[]
    rows: React.ReactNode[][]
    empty: string
}) {
    return (
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/60">
                    <tr>{headers.map((h) => <Th key={h}>{h}</Th>)}</tr>
                </thead>
                <tbody>
                    {rows.length ? rows.map((r, i) => (
                        <tr key={i} className="border-t">
                            {r.map((c, j) => <Td key={j}>{c}</Td>)}
                        </tr>
                    )) : (
                        <tr>
                            <Td colSpan={headers.length} className="py-8 text-center text-muted-foreground">{empty}</Td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={`px-3 py-2 text-left font-medium ${className ?? ""}`} {...props} />
}

function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={`px-3 py-2 align-top ${className ?? ""}`} {...props} />
}

function sumItems(items: ProductionItem[], key: keyof ProductionItem) {
    return items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

function sumBy<T>(items: T[], getValue: (item: T) => unknown) {
    return items.reduce((sum, item) => sum + (Number(getValue(item)) || 0), 0)
}

function countShortage(items: ProductionItem[]) {
    return items.reduce(
        (sum, item) =>
            sum +
            (item.materials ?? []).filter((m) => (m.shortage_quantity ?? 0) > 0).length,
        0
    )
}

function isProductionClosed(production?: Pick<Production, "status">) {
    return ["OUTPUT_RECEIVED", "DONE", "LOCKED", "CANCELLED"].includes(
        productionStatus(production)
    )
}

function canGenerateMaterials(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED"].includes(productionStatus(production))
}

function canAdjustMaterials(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED", "MATERIAL_GENERATED"].includes(productionStatus(production))
}

function canRunFifo(production?: Pick<Production, "status">) {
    return productionStatus(production) === "MATERIAL_GENERATED"
}

function canReceiveOutput(production?: Pick<Production, "status">) {
    return productionStatus(production) === "FIFO_ALLOCATED"
}

function getProductionStepMessage(production?: Pick<Production, "status">) {
    const status = productionStatus(production)

    if (["DRAFT", "PLANNED"].includes(status)) {
        return "cần sinh vật tư trước."
    }
    if (status === "MATERIAL_GENERATED") {
        return "cần chạy FIFO."
    }
    if (status === "FIFO_ALLOCATED") {
        return "cần nhập thành phẩm."
    }
    return "không có thao tác phù hợp với trạng thái hiện tại."
}

function productionStatus(production?: Pick<Production, "status">) {
    return String(production?.status ?? "").toUpperCase()
}

function toNumber(value: string) {
    if (value === "") return undefined
    const n = Number(value)
    return Number.isFinite(n) ? n : undefined
}
