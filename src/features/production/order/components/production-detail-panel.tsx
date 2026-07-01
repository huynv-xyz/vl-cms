import { useState } from "react"
import type React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
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
    Pencil,
    Plus,
    Printer,
    Route,
    Save,
    Settings2,
    Trash2,
    Undo2,
    Wand2,
    Warehouse,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

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
import type { Product } from "@/features/product/data/schema"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import {
    addProductionMaterial,
    allocateProductionFifo,
    cancelProduction,
    deleteProductionMaterial,
    issueProductionMaterials,
    receiveProductionProducts,
    generateProductionMaterials,
    setProductionPreferredLot,
    unpostProduction,
    updateProductionMaterial,
} from "@/api/production/order"
import type {
    Production,
    ProductionItem,
    ProductionMaterial,
    ProductionWarning,
} from "../data/schema"
import {
    getProductionSubStatusLabel,
    getProductionSubStatusVariant,
} from "./production-status"
import { useProductionPermissions } from "../hooks/use-production-permissions"

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
        <div className="space-y-3">
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
                <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
                    <TabsTrigger
                        value="items"
                        className="data-[state=active]:border-primary data-[state=active]:text-primary h-10 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <Factory className="mr-2 h-4 w-4" />
                        {"Th\u00e0nh ph\u1ea9m & v\u1eadt t\u01b0"}
                    </TabsTrigger>
                    <TabsTrigger
                        value="fifo"
                        className="data-[state=active]:border-primary data-[state=active]:text-primary h-10 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <Route className="mr-2 h-4 w-4" />
                        FIFO
                    </TabsTrigger>
                    <TabsTrigger
                        value="outputs"
                        className="data-[state=active]:border-primary data-[state=active]:text-primary h-10 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        {"Nh\u1eadp TP"}
                    </TabsTrigger>
                    <TabsTrigger
                        value="vouchers"
                        className="data-[state=active]:border-primary data-[state=active]:text-primary h-10 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        {"Ch\u1ee9ng t\u1eeb"}
                    </TabsTrigger>
                    <TabsTrigger
                        value="warnings"
                        className="data-[state=active]:border-primary data-[state=active]:text-primary h-10 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        {"C\u1ea3nh b\u00e1o"}
                    </TabsTrigger>
                    <TabsTrigger
                        value="logs"
                        className="data-[state=active]:border-primary data-[state=active]:text-primary h-10 shrink-0 rounded-none border-b-2 border-transparent bg-transparent px-4 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="items" className="mt-4">
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
                            warningMessage(w, production),
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
    const navigate = useNavigate()
    const items = production.items ?? []
    const warehouses = Array.from(
        new Set(items.map((item) => item.warehouse?.name).filter(Boolean))
    )
    const physicalWarehouseName =
        production.physical_warehouse?.name ||
        (production.physical_warehouse_id
            ? `Địa điểm kho #${production.physical_warehouse_id}`
            : "-")

    return (
        <div className="border-b pb-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mt-1 h-8 w-8 shrink-0"
                        onClick={() => navigate({ to: "/production/orders", search: {} as any })}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="min-w-0">
                        <h2 className="text-2xl font-bold tracking-tight">
                            Chi tiết lệnh sản xuất
                        </h2>

                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span>
                                <span className="font-medium text-foreground">Mã lệnh:</span>{" "}
                                {production.production_no || `Lệnh #${production.id}`}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" />
                                <span>
                                    <span className="font-medium text-foreground">Ngày lệnh:</span>{" "}
                                    {formatDate(production.production_date)}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Warehouse className="h-4 w-4" />
                                <span>
                                    <span className="font-medium text-foreground">Địa điểm kho:</span>{" "}
                                    {physicalWarehouseName}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Warehouse className="h-4 w-4" />
                                <span>
                                    <span className="font-medium text-foreground">Kho nhập:</span>{" "}
                                    {warehouses.length ? warehouses.join(", ") : "-"}
                                </span>
                            </span>
                            <span>
                                <span className="font-medium text-foreground">Kỳ tính giá:</span>{" "}
                                <span className="text-foreground font-medium">
                                    {production.costing_period || "-"}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center self-stretch">
                    <StatusBadge
                        value={production.status}
                        className="px-3 py-1 text-sm font-semibold"
                        iconClassName="h-4 w-4"
                    />
                </div>
            </div>

            {production.note ? (
                <div className="text-muted-foreground mt-2 text-sm">
                    {production.note}
                </div>
            ) : null}
        </div>
    )
}

function ProductionActionBar({ production }: { production: Production }) {
    const queryClient = useQueryClient()
    const perms = useProductionPermissions()
    const shortageCount = countShortage(production.items ?? [])
    // BA Spec BR-07: chỉ KT có quyền post mới được sinh vật tư / chạy FIFO / xuất NL / nhập TP.
    const canGenerate = canGenerateMaterials(production) && perms.canPost
    const canAllocateFifo = canRunFifo(production) && perms.canPost
    const canIssueMaterials =
        canIssueProductionMaterials(production) && perms.canPost
    const canConfirm = canReceiveOutput(production) && perms.canPost
    const canCancel = canCancelProduction(production) && perms.canCancel
    const canUnpost = canReverseProductionStep(production) && perms.canUnpost
    const workflowButtonClass = (step: WorkflowStep) =>
        getWorkflowStepClass(getWorkflowStepState(production, step))

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
            toast.success("\u0110\u00e3 ch\u1ea1y FIFO")
            refresh()
        },
        onError: (e: any) => toast.error(e.message || "Kh\u00f4ng th\u1ec3 ch\u1ea1y FIFO"),
    })

    const issueMutation = useMutation({
        mutationFn: () => issueProductionMaterials(production.id),
        onSuccess: () => {
            toast.success("\u0110\u00e3 xu\u1ea5t nguy\u00ean li\u1ec7u")
            refresh()
        },
        onError: (e: any) => toast.error(e.message || "Kh\u00f4ng th\u1ec3 xu\u1ea5t nguy\u00ean li\u1ec7u"),
    })

    const cancelMutation = useMutation({
        mutationFn: () => cancelProduction(production.id),
        onSuccess: () => {
            toast.success("\u0110\u00e3 h\u1ee7y l\u1ec7nh s\u1ea3n xu\u1ea5t")
            refresh()
        },
        onError: (e: any) => toast.error(e.message || "Kh\u00f4ng th\u1ec3 h\u1ee7y l\u1ec7nh"),
    })

    // BA Spec BR-06.2 / BR-06.3 / US-06: cho phép UNPOST LSX đã đóng để sửa rồi POST lại
    const unpostMutation = useMutation({
        mutationFn: (reason: string) => unpostProduction(production.id, reason),
        onSuccess: () => {
            toast.success("\u0110\u00e3 l\u00f9i v\u1ec1 b\u01b0\u1edbc tr\u01b0\u1edbc")
            refresh()
        },
        onError: (e: any) => toast.error(e.message || "Kh\u00f4ng th\u1ec3 l\u00f9i b\u01b0\u1edbc"),
    })

    const handleUnpost = () => {
        const reason = window.prompt(
            "L\u00fd do l\u00f9i b\u01b0\u1edbc? H\u1ec7 th\u1ed1ng ch\u1ec9 l\u00f9i 1 b\u01b0\u1edbc trong lu\u1ed3ng x\u1eed l\u00fd v\u00e0 ho\u00e0n nguy\u00ean d\u1eef li\u1ec7u kho n\u1ebfu b\u01b0\u1edbc \u0111\u00f3 \u0111\u00e3 ghi s\u1ed5.",
            "",
        )
        if (reason == null) return
        if (!reason.trim()) {
            toast.error("Vui l\u00f2ng nh\u1eadp l\u00fd do \u0111\u1ec3 ghi audit log")
            return
        }
        unpostMutation.mutate(reason.trim())
    }

    const isBusy =
        generateMutation.isPending ||
        fifoMutation.isPending ||
        issueMutation.isPending ||
        cancelMutation.isPending ||
        unpostMutation.isPending

    return (
        <div className="border-b pb-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="mr-1 text-sm font-medium">{"Lu\u1ed3ng x\u1eed l\u00fd:"}</div>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9",
                        workflowButtonClass("generate-materials"),
                    )}
                    disabled={isBusy || !canGenerate}
                    onClick={() => generateMutation.mutate()}
                >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {"Sinh v\u1eadt t\u01b0"}
                </Button>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9",
                        workflowButtonClass("allocate-fifo"),
                    )}
                    disabled={isBusy || !canAllocateFifo}
                    onClick={() => fifoMutation.mutate()}
                >
                    <Route className="mr-2 h-4 w-4" />
                    {"Ch\u1ea1y FIFO"}
                </Button>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9",
                        workflowButtonClass("issue-materials"),
                    )}
                    disabled={isBusy || !canIssueMaterials || shortageCount > 0}
                    onClick={() => issueMutation.mutate()}
                    title="T\u1ea1o phi\u1ebfu xu\u1ea5t kho NL/BB theo ph\u00e2n b\u1ed5 FIFO"
                >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {"Xu\u1ea5t nguy\u00ean li\u1ec7u"}
                </Button>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <ReceiveOutputDialog
                    production={production}
                    disabled={isBusy || !canConfirm || shortageCount > 0}
                    triggerClassName={cn("h-9", workflowButtonClass("receive-output"))}
                    onDone={refresh}
                />
                <div className="mx-1 h-7 w-px bg-border" />
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={isBusy || !canUnpost}
                    onClick={handleUnpost}
                    title="L\u00f9i v\u1ec1 b\u01b0\u1edbc tr\u01b0\u1edbc trong lu\u1ed3ng x\u1eed l\u00fd"
                >
                    <Undo2 className="mr-2 h-4 w-4" />
                    {"L\u00f9i b\u01b0\u1edbc"}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={isBusy || !canCancel}
                    onClick={() => cancelMutation.mutate()}
                >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {"H\u1ee7y l\u1ec7nh"}
                </Button>
            </div>

            {shortageCount > 0 ? (
                <div className="mt-2 text-right text-sm text-destructive">
                    {"C\u00f2n"} {shortageCount} {"d\u00f2ng v\u1eadt t\u01b0 ch\u01b0a \u0111\u01b0\u1ee3c FIFO \u0111\u1ee7. V\u00e0o tab Th\u00e0nh ph\u1ea9m & v\u1eadt t\u01b0 \u0111\u1ec3 xem d\u00f2ng thi\u1ebfu, b\u1ed5 sung t\u1ed3n kho ho\u1eb7c gi\u1ea3m s\u1ed1 l\u01b0\u1ee3ng s\u1ea3n xu\u1ea5t r\u1ed3i ch\u1ea1y FIFO l\u1ea1i tr\u01b0\u1edbc khi nh\u1eadp TP."}
                </div>
            ) : null}
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
    triggerClassName,
    onDone,
}: {
    production: Production
    disabled: boolean
    triggerClassName?: string
    onDone: () => void
}) {
    const [open, setOpen] = useState(false)
    const [rows, setRows] = useState<OutputConfirmRow[]>(() =>
        buildOutputConfirmRows(production)
    )

    const confirmMutation = useMutation({
        mutationFn: () =>
            receiveProductionProducts(production.id, {
                outputs: rows.map((row) => ({
                    production_item_id: row.production_item_id,
                    output_id: row.output_id,
                    lot_no: row.lot_no,
                    expiry_date: row.expiry_date,
                    note: row.note || undefined,
                })),
            }),
        onSuccess: () => {
            toast.success("\u0110\u00e3 nh\u1eadp th\u00e0nh ph\u1ea9m")
            setOpen(false)
            onDone()
        },
        onError: (e: any) => toast.error(e.message || "Kh\u00f4ng th\u1ec3 nh\u1eadp th\u00e0nh ph\u1ea9m"),
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
            return toast.error("Kh\u00f4ng c\u00f3 d\u00f2ng th\u00e0nh ph\u1ea9m \u0111\u1ec3 nh\u1eadp kho")
        }

        for (const [index, row] of rows.entries()) {
            if (!row.lot_no?.trim()) {
                return toast.error(`D\u00f2ng th\u00e0nh ph\u1ea9m #${index + 1} ch\u01b0a nh\u1eadp s\u1ed1 l\u00f4 TP`)
            }
            if (false && !row.expiry_date) {
                return toast.error(`D\u00f2ng th\u00e0nh ph\u1ea9m #${index + 1} ch\u01b0a nh\u1eadp HSD TP`)
            }
        }

        confirmMutation.mutate()
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className={triggerClassName} disabled={disabled}>
                    <PackageCheck className="mr-2 h-4 w-4" />
                    {"Nh\u1eadp TP"}
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[88vh] !max-w-4xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>{"Nh\u1eadp th\u00e0nh ph\u1ea9m"}</DialogTitle>
                    <DialogDescription>
                        {"Ki\u1ec3m tra s\u1ed1 l\u01b0\u1ee3ng nh\u1eadp kho v\u00e0 nh\u1eadp s\u1ed1 l\u00f4, h\u1ea1n s\u1eed d\u1ee5ng th\u1ef1c t\u1ebf c\u1ee7a th\u00e0nh ph\u1ea9m."}
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <div className="space-y-3">
                        {rows.map((row, index) => (
                            <div key={`${row.production_item_id}-${row.output_id ?? index}`} className="rounded-md border">
                                <div className="grid gap-3 p-3 lg:grid-cols-[minmax(260px,1fr)_160px_180px_180px]">
                                    <div className="min-w-0">
                                        <Label className="text-sm">{"Th\u00e0nh ph\u1ea9m"} #{index + 1}</Label>
                                        <div className="mt-2 truncate font-medium">
                                            {row.product_label}
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {"Kho nh\u1eadp:"} {row.warehouse_label}
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

                                    <Field label="HSD TP">
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
                            {"H\u1ee7y"}
                        </Button>
                    </DialogClose>
                    <Button onClick={submit} disabled={confirmMutation.isPending}>
                        <PackageCheck className="mr-2 h-4 w-4" />
                        {confirmMutation.isPending ? "\u0110ang nh\u1eadp..." : "X\u00e1c nh\u1eadn nh\u1eadp TP"}
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
    _production: Production,
    item: ProductionItem,
    _output?: NonNullable<ProductionItem["outputs"]>[number]
) {
    // BA Spec BR-01.2: mã lô TP mặc định = `<product_code>-TP`. Cho phép KT sửa.
    // Nếu thiếu mã sản phẩm, fallback về `TP-<item_id>` để vẫn có giá trị mặc định.
    const productCode = item.product?.code
    if (productCode) return `${productCode}-TP`
    return `TP-${item.id}`
}

function FinishedProductBlock({
    production,
    item,
}: {
    production: Production
    item: ProductionItem
}) {
    const perms = useProductionPermissions()
    // BA Spec BR-07: chỉ KT có quyền chỉnh vật tư mới được sửa danh sách vật tư lệnh.
    const canAdjust = canAdjustMaterials(production) && perms.canAdjustMaterials

    return (
        <div className="rounded-md border bg-background">
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {item.product?.code || `#${item.product_id}`}
                        </span>
                        <StatusBadge value={item.check_status} />
                        <StatusBadge value={item.fifo_status} />
                    </div>
                    <div className="mt-1.5 text-base font-semibold leading-snug">
                        {item.product?.name || "-"}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                        BOM {item.bom_version || "-"} · SL kế hoạch{" "}
                        {formatQty(item.quantity_plan, item.product?.unit)} · SL
                        nhập {formatQty(item.quantity_done, item.product?.unit)}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <MaterialForm
                        production={production}
                        item={item}
                        disabled={!canAdjust}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t bg-muted/20 px-4 py-2.5 text-sm">
                <CostInline label="NVL" value={item.total_nvl_cost} />
                <CostInline label="Bao bì" value={item.total_bb_cost} />
                <CostInline label="Gia công" value={item.processing_cost} />
                <CostInline label="CP chung" value={item.overhead_cost} />
                <CostInline
                    label="Giá thành/ĐV"
                    value={item.unit_cost}
                    strong
                />
            </div>

        </div>
    )
}

function CostInline({
    label,
    value,
    strong,
}: {
    label: string
    value?: number
    strong?: boolean
}) {
    return (
        <span className="inline-flex items-baseline gap-1.5">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={cn(
                    "tabular-nums",
                    strong ? "font-bold text-emerald-700" : "font-semibold",
                )}
            >
                {formatCurrency(value)}
            </span>
        </span>
    )
}

function MaterialsTable({ production }: { production: Production }) {
    const perms = useProductionPermissions()
    // BA Spec BR-07: chỉ KT Kho mới được chỉ định lô ưu tiên
    const canPickLot = canRunFifo(production) && perms.canPickLot
    const canAdjust = canAdjustMaterials(production) && perms.canAdjustMaterials
    const items = production.items ?? []
    const [openItemId, setOpenItemId] = useState<number | undefined>(items[0]?.id)
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
        <div className="space-y-2.5">
            <div className="grid gap-2 md:grid-cols-4">
                <Metric label="Dòng vật tư" value={formatNumber(materials.length)} />
                <Metric label="Đã FIFO" value={formatNumber(materials.filter((m) => Number(m.allocated_quantity) > 0).length)} />
                <Metric label="Thiếu tồn" value={formatNumber(shortageCount)} tone={shortageCount > 0 ? "bad" : "ok"} />
                <Metric label="Cảnh báo HSD" value={formatNumber(hsdWarningCount)} tone={hsdWarningCount > 0 ? "bad" : "ok"} />
            </div>

            {!items.length && (
                <div className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    Chưa có thành phẩm trong lệnh.
                </div>
            )}

            {items.map((item) => {
                const itemMaterials = item.materials ?? []
                const isOpen = openItemId === item.id
                const itemShortage = itemMaterials.filter((m) => Number(m.shortage_quantity) > 0).length
                const requiredQty = sumBy(itemMaterials, (m) => m.quantity_required)
                const allocatedQty = sumBy(itemMaterials, (m) => m.allocated_quantity)

                return (
                    <div key={item.id} className="overflow-hidden rounded-md border bg-background">
                        <div className="flex items-start justify-between gap-2 border-b px-3 py-2">
                            <button
                                type="button"
                                className="flex min-w-0 flex-1 items-start gap-2 text-left"
                                onClick={() => setOpenItemId(item.id)}
                            >
                                <ArrowRight
                                    className={cn(
                                        "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                        isOpen && "rotate-90",
                                    )}
                                />
                                <div className="min-w-0">
                                    <div className="font-semibold leading-tight">
                                        {item.product?.name || "-"}
                                    </div>
                                    <div className="mt-0.5 text-sm text-muted-foreground">
                                        {item.product?.code || `#${item.product_id}`} · BOM {item.bom_version || "-"} · SL KH {formatQty(item.quantity_plan, item.product?.unit)} · SL nhập {formatQty(item.quantity_done, item.product?.unit)}
                                    </div>
                                </div>
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                                {itemShortage > 0 ? (
                                    <Badge variant="destructive">{itemShortage} thiếu</Badge>
                                ) : (
                                    <Badge variant="secondary">Đủ FIFO</Badge>
                                )}
                                <Badge variant="outline">
                                    Cần {formatNumber(requiredQty)} · FIFO {formatNumber(allocatedQty)}
                                </Badge>
                                <MaterialManagerDialog
                                    production={production}
                                    item={item}
                                    disabled={!canAdjust}
                                />
                            </div>
                        </div>

                        {isOpen ? (
                            itemMaterials.length ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1280px] text-sm">
                                        <thead className="bg-muted/40 text-muted-foreground">
                                            <tr>
                                                <Th className="w-12">STT</Th>
                                                <Th>Tên</Th>
                                                <Th className="w-20">ĐVT</Th>
                                                <Th className="w-44">Kho</Th>
                                                <Th className="w-20">Loại</Th>
                                                <Th className="w-28 text-right">SL cần</Th>
                                                <Th className="w-28 text-right">Đã FIFO</Th>
                                                <Th className="w-28 text-right">Thiếu</Th>
                                                <Th className="w-36">Trạng thái</Th>
                                                <Th className="w-44">Lô FIFO</Th>
                                                <Th className="w-36 text-right">Chọn lô</Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemMaterials.map((material, index) => {
                                                const shortage = Number(material.shortage_quantity) || 0
                                                const allocations = material.fifo_allocations ?? []
                                                return (
                                                    <tr key={material.id} className="border-t">
                                                        <Td className="text-muted-foreground">{index + 1}</Td>
                                                        <Td>
                                                            <div className="font-medium leading-tight">{material.product?.name || "-"}</div>
                                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                                {material.product?.code || `#${material.product_id}`} · ĐM {formatNumber(material.quantity_per_unit)}
                                                            </div>
                                                        </Td>
                                                        <Td className="text-muted-foreground">{material.product?.unit || "-"}</Td>
                                                        <Td>
                                                            <div className="font-medium leading-tight">{material.warehouse?.name || "-"}</div>
                                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                                {material.warehouse?.code || (material.warehouse_id ? `#${material.warehouse_id}` : "-")}
                                                            </div>
                                                        </Td>
                                                        <Td className="text-muted-foreground">{material.material_type || "-"}</Td>
                                                        <Td className="text-right font-medium tabular-nums">{formatNumber(material.quantity_required)}</Td>
                                                        <Td className="text-right tabular-nums">{formatNumber(material.allocated_quantity)}</Td>
                                                        <Td className={cn("text-right font-medium tabular-nums", shortage > 0 && "text-destructive")}>{formatNumber(shortage)}</Td>
                                                        <Td>
                                                            <div className="space-y-1">
                                                                <StatusBadge value={material.fifo_status} />
                                                                <div className="text-xs text-muted-foreground">{sourceTypeLabel(material.source_type)}</div>
                                                            </div>
                                                        </Td>
                                                        <Td>
                                                            {allocations.length ? (
                                                                <div className="space-y-0.5 text-xs">
                                                                    {allocations.slice(0, 2).map((allocation) => (
                                                                        <div key={allocation.id} className="truncate">
                                                                            {allocation.lot_no || "-"} · {formatNumber(allocation.quantity)}
                                                                        </div>
                                                                    ))}
                                                                    {allocations.length > 2 ? <div className="text-muted-foreground">+{allocations.length - 2} lô</div> : null}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">Chưa có lô FIFO</span>
                                                            )}
                                                        </Td>
                                                        <Td className="text-right">
                                                            <PreferredLotForm production={production} material={material} disabled={!canPickLot} />
                                                        </Td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
                                    Chưa có vật tư. Bấm biểu tượng chỉnh vật tư để thêm vật tư cho thành phẩm này.
                                </div>
                            )
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

function MaterialManagerDialog({
    production,
    item,
    disabled,
}: {
    production: Production
    item: ProductionItem
    disabled?: boolean
}) {
    const materials = item.materials ?? []

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-9 w-9"
                    disabled={disabled}
                    title="Chỉnh vật tư"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Chỉnh vật tư</DialogTitle>
                    <DialogDescription>
                        {item.product?.name || "-"} · {item.product?.code || `#${item.product_id}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-end">
                    <MaterialForm production={production} item={item} disabled={disabled} />
                </div>

                {materials.length ? (
                    <div className="overflow-x-auto rounded-md border">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="bg-muted/40 text-muted-foreground">
                                <tr>
                                    <Th className="w-12">STT</Th>
                                    <Th>Tên</Th>
                                    <Th className="w-20">ĐVT</Th>
                                    <Th className="w-24">Loại</Th>
                                    <Th className="w-28 text-right">SL cần</Th>
                                    <Th className="w-28 text-right">Định mức</Th>
                                    <Th className="w-40">Kho xuất</Th>
                                    <Th>Ghi chú</Th>
                                    <Th className="w-24 text-right">Thao tác</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map((material, index) => (
                                    <tr key={material.id} className="border-t">
                                        <Td className="text-muted-foreground">{index + 1}</Td>
                                        <Td>
                                            <div className="font-medium leading-tight">{material.product?.name || "-"}</div>
                                            <div className="mt-0.5 text-xs text-muted-foreground">
                                                {material.product?.code || `#${material.product_id}`}
                                            </div>
                                        </Td>
                                        <Td className="text-muted-foreground">{material.product?.unit || "-"}</Td>
                                        <Td className="text-muted-foreground">{material.material_type || "-"}</Td>
                                        <Td className="text-right font-medium tabular-nums">{formatNumber(material.quantity_required)}</Td>
                                        <Td className="text-right tabular-nums">{formatNumber(material.quantity_per_unit)}</Td>
                                        <Td className="text-muted-foreground">{material.warehouse?.name || "-"}</Td>
                                        <Td className="text-muted-foreground">{material.note || "-"}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <MaterialForm
                                                    production={production}
                                                    item={item}
                                                    material={material}
                                                    disabled={disabled}
                                                />
                                                <DeleteMaterialButton
                                                    production={production}
                                                    material={material}
                                                    disabled={disabled}
                                                />
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        Chưa có vật tư cho thành phẩm này.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function DeleteMaterialButton({
    production,
    material,
    disabled,
}: {
    production: Production
    material: ProductionMaterial
    disabled?: boolean
}) {
    const queryClient = useQueryClient()
    const deleteMutation = useMutation({
        mutationFn: () => deleteProductionMaterial(production.id, material.id),
        onSuccess: () => {
            toast.success("Đã xóa vật tư")
            void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
            void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            void queryClient.invalidateQueries({ queryKey: ["productions"] })
        },
        onError: (e: any) => toast.error(e.message || "Không thể xóa vật tư"),
    })

    return (
        <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 text-destructive hover:text-destructive"
            disabled={disabled || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            title="Xóa vật tư"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}

function MaterialCheckRow({
    production,
    item,
    material,
    canPickLot,
    canAdjust,
}: {
    production: Production
    item: ProductionItem
    material: ProductionMaterial
    canPickLot: boolean
    canAdjust: boolean
}) {
    const queryClient = useQueryClient()
    const shortage = Number(material.shortage_quantity) || 0
    const required = Number(material.quantity_required) || 0
    const allocated = Number(material.allocated_quantity) || 0
    const progress = required > 0 ? Math.min(100, Math.round((allocated / required) * 100)) : 0
    const hsdWarnings = (material.fifo_allocations ?? []).filter(
        (allocation) => getExpiryStatus(allocation.expiry_date).tone !== "ok"
    )
    const deleteMutation = useMutation({
        mutationFn: () => deleteProductionMaterial(production.id, material.id),
        onSuccess: () => {
            toast.success("Đã xóa vật tư")
            void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
            void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            void queryClient.invalidateQueries({ queryKey: ["productions"] })
        },
        onError: (e: any) => toast.error(e.message || "Không thể xóa vật tư"),
    })

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
                {canAdjust && (
                    <div className="flex justify-end gap-2">
                        <MaterialForm
                            production={production}
                            item={item}
                            material={material}
                            disabled={!canAdjust}
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate()}
                            title="Xóa vật tư"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
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
            headers={["Thành phẩm", "Kho nhập", "SL kế hoạch", "SL đã nhập", "Số lô TP", "HSD", "Giá thành/ĐV", "Thành tiền", "Trạng thái"]}
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

const PRODUCTION_ISSUE_TK_NO = "621"
const PRODUCTION_OUTPUT_TK_CO = "154"

function ProductionVoucherTab({ production }: { production: Production }) {
    const issueRows = getIssueVoucherRows(production)
    const outputRows = getOutputVoucherRows(production)
    const status = productionStatus(production)
    const issueDocNo = getProductionVoucherNo(production, "PRODUCTION_MATERIAL", "XK-SX")
    const outputDocNo = getProductionVoucherNo(production, "PRODUCTION", "NK-TP")
    const issueQuantity = sumBy(issueRows, (row) => row.allocation.quantity)
    const issueAmount = sumBy(issueRows, (row) => row.allocation.amount)
    const outputQuantity = sumBy(outputRows, (row) => row.output?.quantity ?? row.item.quantity_done)
    const outputAmount = sumBy(outputRows, (row) => row.output?.total_cost ?? row.item.total_cost)
    const shortageCount = countShortage(production.items ?? [])
    const issueCsvRows = issueRows.map((row) => ({
        "Đối tượng THCP": productName(row.item.product),
        "Vật tư xuất": productName(row.material.product || row.allocation.material_product),
        "Kho xuất": row.allocation.warehouse?.name || row.material.warehouse?.name || "-",
        ["TK N\u1ee3"]: PRODUCTION_ISSUE_TK_NO,
        ["TK C\u00f3"]: inventoryAccount(row.material.product || row.allocation.material_product),
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
        ["TK N\u1ee3"]: inventoryAccount(item.product),
        ["TK C\u00f3"]: PRODUCTION_OUTPUT_TK_CO,
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
                    headers={["\u0110\u1ed1i t\u01b0\u1ee3ng THCP", "V\u1eadt t\u01b0 xu\u1ea5t", "Kho xu\u1ea5t", "TK N\u1ee3", "TK C\u00f3", "L\u00f4 xu\u1ea5t", "Ng\u00e0y l\u00f4", "HSD", "C\u1ea3nh b\u00e1o", "SL xu\u1ea5t", "\u0110\u01a1n gi\u00e1", "Th\u00e0nh ti\u1ec1n"]}
                    rows={issueRows.map((row) => [
                        <ProductCell key="finished-product" product={row.item.product} />,
                        <ProductCell key="material" product={row.material.product || row.allocation.material_product} />,
                        row.allocation.warehouse?.name || row.material.warehouse?.name || "-",
                        PRODUCTION_ISSUE_TK_NO,
                        inventoryAccount(row.material.product || row.allocation.material_product),
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
                    ["OUTPUT_RECEIVED", "DONE"].includes(status)
                        ? "Phiếu nhập TP đã ghi nhận tồn kho thành phẩm theo giá thành sau FIFO."
                        : "Phiếu nhập TP sẽ được ghi sổ sau khi đã xuất nguyên liệu và bấm Nhập TP."
                }
            >
                <SimpleTable
                    empty="Chưa có dòng nhập kho thành phẩm"
                    headers={["Th\u00e0nh ph\u1ea9m", "Kho nh\u1eadp", "TK N\u1ee3", "TK C\u00f3", "S\u1ed1 l\u00f4 TP", "HSD", "SL nh\u1eadp", "Gi\u00e1 th\u00e0nh/\u0110V", "Th\u00e0nh ti\u1ec1n", "Tr\u1ea1ng th\u00e1i"]}
                    rows={outputRows.map(({ item, output }) => [
                        <ProductCell key="product" product={item.product} />,
                        output?.warehouse?.name || item.warehouse?.name || "-",
                        inventoryAccount(item.product),
                        PRODUCTION_OUTPUT_TK_CO,
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

function getProductionVoucherNo(production: Production, type: string, fallbackSuffix: string) {
    return production.vouchers?.find((voucher) => voucher.voucher_type_code === type)?.voucher_no
        || buildVoucherNo(production, fallbackSuffix)
}

function getIssueVoucherStatus(status: string, shortageCount: number, rowCount: number) {
    if (["MATERIAL_ISSUED", "OUTPUT_RECEIVED", "DONE"].includes(status)) return "Đã ghi sổ"
    if (shortageCount > 0) return "Thiếu tồn"
    if (rowCount > 0) return "Đã phân bổ FIFO"
    return "Chưa phát sinh"
}

function getOutputVoucherStatus(status: string, rowCount: number) {
    if (["OUTPUT_RECEIVED", "DONE"].includes(status)) return "Đã ghi sổ"
    if (status === "MATERIAL_ISSUED") return "Chờ nhập TP"
    if (status === "FIFO_ALLOCATED") return "Chờ xuất nguyên liệu"
    if (rowCount > 0) return "Dự kiến"
    return "Chưa phát sinh"
}

function MaterialForm({
    production,
    item,
    material,
    disabled,
}: {
    production: Production
    item: ProductionItem
    material?: ProductionMaterial
    disabled?: boolean
}) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const isEdit = Boolean(material)
    const [productId, setProductId] = useState<number | undefined>(material?.product_id)
    const [warehouseId, setWarehouseId] = useState<number | undefined>(material?.warehouse_id)
    const [materialType, setMaterialType] = useState(material?.material_type || "NVL")
    const [quantityPerUnit, setQuantityPerUnit] = useState(material?.quantity_per_unit ? String(material.quantity_per_unit) : "")
    const [quantity, setQuantity] = useState(material?.quantity_required ? String(material.quantity_required) : "")
    const [note, setNote] = useState(material?.note || "")

    const handleProductChange = (value: number | undefined, option: { raw?: Product } | null) => {
        setProductId(value || undefined)
        setWarehouseId(option?.raw?.default_warehouse_id || undefined)
    }

    const mutation = useMutation({
        mutationFn: () => {
            const body = {
                production_item_id: item.id,
                product_id: productId,
                warehouse_id: warehouseId,
                material_type: materialType,
                quantity_per_unit: toNumber(quantityPerUnit),
                quantity: toNumber(quantity),
                note,
            }
            return isEdit && material
                ? updateProductionMaterial(production.id, material.id, body)
                : addProductionMaterial(production.id, body)
        },
        onSuccess: () => {
            toast.success(isEdit ? "Đã cập nhật vật tư" : "Đã thêm vật tư")
            if (!isEdit) {
                setProductId(undefined)
                setWarehouseId(undefined)
                setQuantity("")
                setQuantityPerUnit("")
                setNote("")
            }
            setOpen(false)
            void queryClient.invalidateQueries({ queryKey: ["production-order-detail", production.id] })
            void queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            void queryClient.invalidateQueries({ queryKey: ["productions"] })
        },
        onError: (e: any) => toast.error(e.message || (isEdit ? "Không thể cập nhật vật tư" : "Không thể thêm vật tư")),
    })

    return (
        <Dialog open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
            <DialogTrigger asChild>
                {isEdit ? (
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        disabled={disabled}
                        title="Sửa vật tư"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button size="sm" variant="outline" disabled={disabled}>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm vật tư
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Sửa vật tư" : "Thêm vật tư"}</DialogTitle>
                    <DialogDescription>
                        {item.product?.code} - {item.product?.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Vật tư">
                        <AsyncSelect
                            value={productId}
                            onChange={handleProductChange}
                            placeholder="Chọn vật tư"
                            dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                            mapOption={(x: Product) => ({ value: x.id, label: `${x.code} - ${x.name}`, raw: x })}
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
                                <SelectItem value="TP">Thành phẩm (cấp dưới)</SelectItem>
                                <SelectItem value="HH">Hàng hóa</SelectItem>
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
                        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú vật tư" className="min-h-9" />
                    </Field>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Hủy</Button>
                    </DialogClose>
                    <Button onClick={() => mutation.mutate()} disabled={disabled || mutation.isPending || !productId || (!quantity && !quantityPerUnit)}>
                        <Save className="mr-2 h-4 w-4" />
                        {isEdit ? "Cập nhật" : "Lưu vật tư"}
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

    // BA Spec BR-05 + EC-06: cảnh báo (không chặn cứng) khi KT chỉ định lô đã hết hạn
    // hoặc cận date. Lấy expiry_date từ FIFO allocations đã có của material để dò.
    const lotIndex = new Map(
        (material.fifo_allocations ?? [])
            .filter((a) => a.lot_no)
            .map((a) => [a.lot_no as string, a.expiry_date]),
    )
    const matchedExpiry = lotNo ? lotIndex.get(lotNo.trim()) : undefined
    const matchedStatus = getExpiryStatus(matchedExpiry)
    const showExpiredWarn = lotNo && matchedExpiry && matchedStatus.tone !== "ok"

    const handleSave = () => {
        if (matchedStatus.tone === "bad") {
            const ok = window.confirm(
                `Lô "${lotNo}" đã HẾT HẠN (${matchedStatus.label}). Bạn có chắc muốn dùng lô này?`,
            )
            if (!ok) return
        }
        mutation.mutate()
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
            <DialogTrigger asChild>
                <Button size="sm" variant={material.preferred_lot_no ? "secondary" : "outline"} disabled={disabled}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    {material.preferred_lot_no || "Auto"}
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
                {showExpiredWarn ? (
                    <div
                        className={cn(
                            "rounded-md border px-3 py-2 text-sm",
                            matchedStatus.tone === "bad"
                                ? "border-destructive/40 bg-destructive/10 text-destructive"
                                : "border-amber-300 bg-amber-50 text-amber-800",
                        )}
                    >
                        <div className="flex items-center gap-2 font-medium">
                            <AlertTriangle className="h-4 w-4" />
                            {matchedStatus.tone === "bad"
                                ? "Lô đã hết hạn"
                                : "Lô cận date"}
                        </div>
                        <div className="mt-1 text-xs">
                            HSD lô này: {formatDate(matchedExpiry)} ·{" "}
                            {matchedStatus.label}
                        </div>
                    </div>
                ) : null}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Hủy</Button>
                    </DialogClose>
                    <Button onClick={handleSave} disabled={disabled || mutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu lô
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
    const labelToneClass =
        tone === "warn"
            ? "text-amber-700"
            : tone === "success"
                ? "text-emerald-700"
                : "text-muted-foreground"

    return (
        <div className="rounded-md border bg-background px-3 py-2.5">
            <div
                className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    labelToneClass,
                )}
            >
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="mt-1 text-2xl font-semibold leading-none tracking-tight tabular-nums">
                {value}
            </div>
            <div className="text-muted-foreground mt-0.5 truncate text-xs">
                {hint}
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
        case "MANUAL":
            return "Chỉnh tay"
        default:
            return value || "-"
    }
}

function productName(product?: any) {
    if (!product) return "-"
    return [product.code, product.name].filter(Boolean).join(" - ")
}


function inventoryAccount(product?: any) {
    return product?.inventory_account_code || "-"
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

function StatusBadge({
    value,
    className,
    iconClassName,
}: {
    value?: string
    className?: string
    iconClassName?: string
}) {
    if (!value) return <Badge variant="outline" className={className}>-</Badge>

    const status = String(value ?? "").toUpperCase()
    const variant = getProductionSubStatusVariant(status)
    const label = getProductionSubStatusLabel(status)
    const ok = variant === "secondary"

    return (
        <Badge variant={variant} className={className}>
            {ok && <CheckCircle2 className={cn("h-3 w-3", iconClassName)} />}
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

function warningMessage(warning: ProductionWarning, production: Production) {
    const material = findWarningMaterial(warning, production)
    const materialAny = material as any
    const productionAny = production as any
    const productCode =
        materialAny?.product?.code ??
        materialAny?.product_code ??
        (material?.product_id != null ? String(material.product_id) : undefined)
    const physicalWarehouseName =
        productionAny.physical_warehouse?.name ??
        productionAny.physical_warehouse_name ??
        (production.physical_warehouse_id != null ? String(production.physical_warehouse_id) : undefined)

    if (warning.warning_code === "NOT_ENOUGH_STOCK" && productCode) {
        const shortage = material?.shortage_quantity
        return `Vật tư ${productCode} thiếu ${formatNumber(Number(shortage ?? 0))} trong địa điểm kho ${physicalWarehouseName ?? "-"}`
    }

    if (warning.warning_code === "LOT_COST_MISSING" && productCode) {
        return `Vật tư ${productCode} có lô chưa có đơn giá vốn, vẫn phân bổ FIFO theo số lượng với giá 0`
    }

    return warning.message ?? "-"
}

function findWarningMaterial(warning: ProductionWarning, production: Production) {
    if (warning.production_material_id == null) return undefined
    for (const item of production.items ?? []) {
        const material = (item.materials ?? []).find((m) => m.id === warning.production_material_id)
        if (material) return material
    }
    return undefined
}

type WorkflowStep =
    | "generate-materials"
    | "allocate-fifo"
    | "issue-materials"
    | "receive-output"

type WorkflowStepState = "done" | "current" | "pending"

const workflowStepOrder: WorkflowStep[] = [
    "generate-materials",
    "allocate-fifo",
    "issue-materials",
    "receive-output",
]

function getWorkflowStepState(
    production: Pick<Production, "status">,
    step: WorkflowStep
): WorkflowStepState {
    const stepIndex = workflowStepOrder.indexOf(step)
    const currentIndex = getCurrentWorkflowStepIndex(productionStatus(production))

    if (currentIndex < 0) return "pending"
    if (stepIndex < currentIndex) return "done"
    if (stepIndex === currentIndex) return "current"
    return "pending"
}

function getCurrentWorkflowStepIndex(status: string) {
    if (["DRAFT", "PLANNED"].includes(status)) return 0
    if (status === "MATERIAL_GENERATED") return 1
    if (status === "FIFO_ALLOCATED") return 2
    if (status === "MATERIAL_ISSUED") return 3
    if (["DONE", "OUTPUT_RECEIVED", "LOCKED"].includes(status)) {
        return workflowStepOrder.length
    }
    return -1
}

function getWorkflowStepClass(state: WorkflowStepState) {
    if (state === "done") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700 opacity-100 hover:bg-emerald-50 disabled:opacity-100"
    }

    if (state === "current") {
        return "border-amber-300 bg-amber-400 text-amber-950 opacity-100 hover:bg-amber-400 disabled:opacity-100"
    }

    return "border-slate-200 bg-slate-50 text-slate-400 opacity-100 hover:bg-slate-50 disabled:opacity-100"
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

function canIssueProductionMaterials(production?: Pick<Production, "status">) {
    return productionStatus(production) === "FIFO_ALLOCATED"
}

function canReceiveOutput(production?: Pick<Production, "status">) {
    return productionStatus(production) === "MATERIAL_ISSUED"
}

function canCancelProduction(production?: Pick<Production, "status">) {
    return ["DRAFT", "PLANNED", "MATERIAL_GENERATED", "FIFO_ALLOCATED"].includes(productionStatus(production))
}

function canReverseProductionStep(production?: Pick<Production, "status">) {
    return ["FIFO_ALLOCATED", "MATERIAL_ISSUED"].includes(productionStatus(production))
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
        return "cần xuất nguyên liệu."
    }
    if (status === "MATERIAL_ISSUED") {
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
