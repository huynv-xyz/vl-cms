import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, ArrowRight, CalendarDays, ChevronDown, CheckCircle2, LoaderCircle, PackageCheck, PackageOpen, Pencil, Plus, Route, Save, SlidersHorizontal, Trash2, Wand2, Warehouse, Wrench, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import {
    adjustProduction,
    checkProductionAdjustment,
    getProductionDetail,
    type AdjustProductionRequest,
    type ProductionAdjustmentResult,
} from "@/api/production/order"
import { getEffectiveProductBom } from "@/api/production/bom"
import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { cn } from "@/lib/utils"
import type { Production } from "../data/schema"

type Props = {
    production?: Production
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Row = {
    product_id?: number
    product?: any
    warehouse_id?: number
    quantity_plan?: number
    quantity_done?: number
    lot_no?: string
    expiry_date?: string
    note?: string
    materials?: MaterialRow[]
}

type MaterialRow = {
    product_id?: number
    product?: any
    original_product_id?: number
    warehouse_id?: number
    warehouse?: any
    material_type?: string
    source_type?: string
    source_ref_id?: number
    bom_item_id?: number
    quantity_per_unit?: number
    quantity_original?: number
    quantity?: number
    base_output_quantity?: number
    base_quantity?: number
    lot_id?: number
    lot_no?: string
    fifo_allocations?: any[]
    note?: string
}

type AdjustmentIssue = {
    message: string
    status?: string
    category?: string
    product_code?: string
    warehouse_code?: string
    lot_code?: string
    isSummary?: boolean
}

const newRow = (): Row => ({
    quantity_plan: 1,
    quantity_done: 1,
    materials: [],
})

const newMaterialRow = (): MaterialRow => ({
    material_type: "NVL",
    source_type: "ADJUSTMENT",
    quantity: 1,
})

const roundQuantity = (value: number) => {
    if (!Number.isFinite(value)) return 0
    return Number(value.toFixed(3))
}

const recalculateMaterialsForOutputQuantity = (
    materials: MaterialRow[] | undefined,
    nextOutputQuantity: number,
) => {
    return (materials || []).map((material) => {
        const baseOutputQuantity = Number(material.base_output_quantity || 0)
        const baseQuantity = Number(material.base_quantity || 0)
        const quantityPerUnit = Number(material.quantity_per_unit || 0)
        const expectedBaseQuantity = baseOutputQuantity > 0 && quantityPerUnit > 0
            ? quantityPerUnit * baseOutputQuantity
            : 0
        const baseDiff = Math.abs(expectedBaseQuantity - baseQuantity)
        const baseTolerance = Math.max(1, Math.abs(baseQuantity) * 0.02)
        const currentRatio = quantityPerUnit > 0 && (baseQuantity <= 0 || baseDiff <= baseTolerance)
            ? quantityPerUnit
            : baseOutputQuantity > 0 && baseQuantity > 0
                ? baseQuantity / baseOutputQuantity
                : quantityPerUnit
        if (currentRatio <= 0) return material
        const quantity = roundQuantity(currentRatio * Number(nextOutputQuantity || 0))
        return {
            ...material,
            quantity,
            quantity_original: quantity,
        }
    })
}

type AdjustmentWorkflowStep = "materials" | "fifo" | "issue" | "receive"
type AdjustmentWorkflowState = "done" | "current" | "pending" | "error"

const adjustmentWorkflowSteps: Array<{
    key: AdjustmentWorkflowStep
    label: string
    icon: typeof Wand2
}> = [
    { key: "materials", label: "Sinh vật tư", icon: Wand2 },
    { key: "fifo", label: "Chạy FIFO", icon: Route },
    { key: "issue", label: "Xuất nguyên liệu", icon: PackageCheck },
    { key: "receive", label: "Nhập TP", icon: PackageOpen },
]

function getAdjustmentStepClass(state: AdjustmentWorkflowState) {
    if (state === "done") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700 opacity-100 disabled:opacity-100"
    }
    if (state === "current") {
        return "border-amber-300 bg-amber-400 text-amber-950 opacity-100 disabled:opacity-100"
    }
    if (state === "error") {
        return "border-red-200 bg-red-50 text-red-700 opacity-100 disabled:opacity-100"
    }
    return "border-slate-200 bg-slate-50 text-slate-400 opacity-100 disabled:opacity-100"
}

function workflowCompletedCount(result: ProductionAdjustmentResult | null, applied: boolean) {
    if (!result) return 0
    if (applied && result.success) return adjustmentWorkflowSteps.length
    if (result.success) return adjustmentWorkflowSteps.length
    const errorText = `${result.message || ""} ${(result.details || []).map((x) => x.message || x.status || x.type || "").join(" ")}`
        .toLowerCase()
    if (errorText.includes("fifo")) return 1
    if (errorText.includes("xuất") || errorText.includes("xuat") || errorText.includes("nguyên liệu") || errorText.includes("nguyen lieu")) return 2
    if (errorText.includes("nhập") || errorText.includes("nhap") || errorText.includes("tp")) return 3
    return 0
}

function workflowStepLabel(key: AdjustmentWorkflowStep) {
    switch (key) {
        case "materials":
            return "Sinh vật tư"
        case "fifo":
            return "Chạy FIFO"
        case "issue":
            return "Xuất nguyên liệu"
        case "receive":
            return "Nhập TP"
        default:
            return key
    }
}

export function AdjustProductionDialog({ production, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const contentRef = useRef<HTMLDivElement | null>(null)
    const initializedProductionIdRef = useRef<number | null>(null)
    const [rows, setRows] = useState<Row[]>([newRow()])
    const [expandedIndex, setExpandedIndex] = useState(0)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [result, setResult] = useState<ProductionAdjustmentResult | null>(null)
    const [applied, setApplied] = useState(false)
    const [successRevealCount, setSuccessRevealCount] = useState(0)
    const detailQuery = useQuery({
        queryKey: ["production-order-detail", production?.id],
        queryFn: () => getProductionDetail(Number(production?.id)),
        enabled: open && !!production?.id,
    })
    const sourceProduction = detailQuery.data || production

    useEffect(() => {
        if (!open) {
            initializedProductionIdRef.current = null
            return
        }
        if (!sourceProduction?.id) return
        if (detailQuery.isLoading && !detailQuery.data) return
        if (initializedProductionIdRef.current === Number(sourceProduction.id)) return
        initializedProductionIdRef.current = Number(sourceProduction.id)
        setApplied(false)
        setResult(null)
        setExpandedIndex(0)
        setEditingIndex(null)
        setRows(
            sourceProduction.items?.length
                ? sourceProduction.items.map((item: any) => {
                    const outputQuantity = Number(item.quantity_plan || item.quantity_done || 1)
                    return {
                    product_id: item.product_id,
                    product: item.product,
                    warehouse_id: item.warehouse_id,
                    quantity_plan: outputQuantity,
                    quantity_done: Number(item.quantity_done || item.quantity_plan || 1),
                    lot_no: item.output_lot_no || "",
                    expiry_date: item.output_expiry_date || "",
                    note: item.note || "",
                    materials: (item.materials || []).map((material: any) => {
                        const materialQuantity = Number(material.quantity_required || 0)
                        return {
                        product_id: material.product_id,
                        product: material.product,
                        original_product_id: material.original_product_id,
                        warehouse_id: material.warehouse_id,
                        warehouse: material.warehouse,
                        material_type: material.material_type || "NVL",
                        source_type: material.source_type || "ADJUSTMENT",
                        source_ref_id: material.source_ref_id,
                        bom_item_id: material.bom_item_id,
                        quantity_per_unit: Number(material.quantity_per_unit || 0),
                        quantity_original: Number(material.quantity_original || 0),
                        quantity: materialQuantity,
                        base_output_quantity: outputQuantity,
                        base_quantity: materialQuantity,
                        lot_id: material.lot_id,
                        lot_no: material.preferred_lot_no || "",
                        fifo_allocations: material.fifo_allocations || [],
                        note: material.note || "",
                        }
                    }),
                    }
                })
                : [newRow()]
            )
    }, [open, sourceProduction, detailQuery.isLoading, detailQuery.data])

    useEffect(() => {
        if (!result?.success) {
            setSuccessRevealCount(0)
            return
        }

        setSuccessRevealCount(0)
        let next = 0
        const timer = window.setInterval(() => {
            next += 1
            setSuccessRevealCount(Math.min(next, adjustmentWorkflowSteps.length))
            if (next >= adjustmentWorkflowSteps.length) {
                window.clearInterval(timer)
            }
        }, 180)

        return () => window.clearInterval(timer)
    }, [result])

    const requestBody = useMemo<AdjustProductionRequest>(() => ({
        warehouse_id: sourceProduction?.items?.[0]?.warehouse_id,
        items: rows.map((row) => ({
            product_id: row.product_id,
            warehouse_id: row.warehouse_id,
            quantity_plan: Number(row.quantity_plan || 0),
            quantity_done: Number(row.quantity_done || row.quantity_plan || 0),
            lot_no: row.lot_no || undefined,
            expiry_date: row.expiry_date || undefined,
            note: row.note || undefined,
            materials: row.materials?.map((material) => ({
                product_id: material.product_id,
                original_product_id: material.original_product_id,
                warehouse_id: material.warehouse_id,
                material_type: material.material_type || "NVL",
                source_type: material.source_type || "ADJUSTMENT",
                source_ref_id: material.source_ref_id,
                bom_item_id: material.bom_item_id,
                quantity_per_unit: Number(material.quantity_per_unit || 0),
                quantity_original: Number(material.quantity_original || 0),
                quantity: Number(material.quantity || 0),
                lot_id: material.lot_id,
                lot_no: material.lot_no || undefined,
                note: material.note || undefined,
            })),
        })),
    }), [sourceProduction?.items, rows])

    const checkMutation = useMutation({
        mutationFn: () => checkProductionAdjustment(Number(sourceProduction?.id), requestBody),
        onSuccess: (data) => {
            setApplied(false)
            setResult(data)
        },
        onError: (error: any) => {
            setApplied(false)
            setResult({
                success: false,
                message: error?.message || "Kiểm tra điều chỉnh thất bại",
                details: [{
                    category: "Kiểm tra",
                    status: "Lỗi",
                    message: error?.message || "Không thể kiểm tra điều chỉnh",
                }],
            })
        },
    })

    const applyMutation = useMutation({
        mutationFn: () => adjustProduction(Number(sourceProduction?.id), requestBody),
        onSuccess: async (data) => {
            setApplied(true)
            setResult(data)
            await queryClient.invalidateQueries({ queryKey: ["productions"] })
            await queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            await queryClient.invalidateQueries({ queryKey: ["production-order-detail", production?.id] })
        },
        onError: (error: any) => {
            setApplied(false)
            setResult({
                success: false,
                message: error?.message || "Điều chỉnh thất bại, đã rollback",
                details: [{
                    category: "Chạy điều chỉnh",
                    status: "Lỗi",
                    message: error?.message || "Không thể điều chỉnh lệnh sản xuất",
                }],
            })
        },
    })

    const updateRow = (index: number, patch: Partial<Row>) => {
        setApplied(false)
        setResult(null)
        setRows((old) => old.map((row, i) => i === index ? { ...row, ...patch } : row))
    }

    const buildMaterialsFromBom = async (productId: number, outputQuantity: number) => {
        try {
            const bom = await getEffectiveProductBom(productId, String(sourceProduction?.production_date || ""))
            return (bom.items || []).map((item: any) => {
                const materialProduct = item.material_product
                const quantityPerUnit = Number(item.quantity || 0)
                const quantity = roundQuantity(quantityPerUnit * Number(outputQuantity || 0))
                return {
                    product_id: item.material_product_id,
                    product: materialProduct,
                    original_product_id: item.material_product_id,
                    warehouse_id: materialProduct?.default_warehouse_id,
                    warehouse: materialProduct?.default_warehouse,
                    material_type: item.material_type || "NVL",
                    source_type: "BOM",
                    source_ref_id: item.id,
                    bom_item_id: item.id,
                    quantity_per_unit: quantityPerUnit,
                    quantity_original: quantity,
                    quantity,
                    base_output_quantity: Number(outputQuantity || 0),
                    base_quantity: quantity,
                    lot_no: "",
                    note: item.note || "",
                } satisfies MaterialRow
            })
        } catch {
            return []
        }
    }

    const handleProductChange = async (index: number, value: any, option: any, row: Row) => {
        const productId = value ? Number(value) : undefined
        const outputQuantity = Number(row.quantity_plan || row.quantity_done || 0)

        if (!productId) {
            updateRow(index, {
                product_id: undefined,
                product: undefined,
                materials: [],
            })
            return
        }

        updateRow(index, {
            product_id: productId,
            product: option?.raw,
            materials: [],
        })

        const materials = await buildMaterialsFromBom(productId, outputQuantity)
        setRows((old) => old.map((current, i) => i === index
            ? {
                ...current,
                product_id: productId,
                product: option?.raw || current.product,
                materials,
            }
            : current
        ))
    }

    const addRow = () => {
        setApplied(false)
        setResult(null)
        setRows((old) => [...old, newRow()])
    }

    const removeRow = (index: number) => {
        setApplied(false)
        setResult(null)
        setRows((old) => old.filter((_, i) => i !== index))
    }

    const updateMaterialRow = (rowIndex: number, materialIndex: number, patch: Partial<MaterialRow>) => {
        setApplied(false)
        setResult(null)
        setRows((old) => old.map((row, i) => {
            if (i !== rowIndex) return row
            const materials = [...(row.materials || [])]
            const nextMaterial = { ...materials[materialIndex], ...patch }
            if ("quantity" in patch) {
                nextMaterial.base_output_quantity = Number(row.quantity_plan || row.quantity_done || 0)
                nextMaterial.base_quantity = Number(patch.quantity || 0)
            }
            materials[materialIndex] = nextMaterial
            return { ...row, materials }
        }))
    }

    const addMaterialRow = (rowIndex: number) => {
        setApplied(false)
        setResult(null)
        setRows((old) => old.map((row, i) => i === rowIndex
            ? { ...row, materials: [...(row.materials || []), newMaterialRow()] }
            : row
        ))
    }

    const removeMaterialRow = (rowIndex: number, materialIndex: number) => {
        setApplied(false)
        setResult(null)
        setRows((old) => old.map((row, i) => i === rowIndex
            ? { ...row, materials: (row.materials || []).filter((_, j) => j !== materialIndex) }
            : row
        ))
    }

    const prepareRunView = () => {
        setExpandedIndex(-1)
        setEditingIndex(null)
        requestAnimationFrame(() => {
            contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
        })
    }

    const validate = () => {
        if (!sourceProduction?.id) return "Không tìm thấy lệnh SX"
        if (detailQuery.isLoading) return "Đang tải chi tiết lệnh SX"
        if (String(sourceProduction.status || "").toUpperCase() !== "DONE") return "Chỉ điều chỉnh lệnh đã hoàn thành"
        if (!rows.length) return "Cần ít nhất 1 thành phẩm"
        for (const [index, row] of rows.entries()) {
            if (!row.product_id) return `Dòng ${index + 1} chưa chọn thành phẩm`
            if (Number(row.quantity_plan || 0) <= 0) return `Dòng ${index + 1} có số lượng không hợp lệ`
        }
        for (const [rowIndex, row] of rows.entries()) {
            for (const [materialIndex, material] of (row.materials || []).entries()) {
                if (!material.product_id) return `TP ${rowIndex + 1}, vật tư ${materialIndex + 1} chưa chọn mã hàng`
                if (Number(material.quantity || 0) <= 0 && Number(material.quantity_per_unit || 0) <= 0) {
                    return `TP ${rowIndex + 1}, vật tư ${materialIndex + 1} chưa có số lượng`
                }
            }
        }
        return ""
    }

    const validationMessage = validate()
    const canApply = !!result?.success && !applied && !validationMessage
    const isChecking = checkMutation.isPending
    const isApplying = applyMutation.isPending
    const completedWorkflowSteps = result?.success ? successRevealCount : workflowCompletedCount(result, applied)
    const sourceProductionAny = sourceProduction as any
    const inputWarehouses = Array.from(
        new Set(
            (sourceProduction?.items || [])
                .map((item: any) => item.warehouse?.name || item.warehouse_name)
                .filter(Boolean),
        ),
    )
    const physicalWarehouseName = sourceProductionAny?.physical_warehouse?.name
        || sourceProductionAny?.physical_warehouse_name
        || "-"
    const costingPeriod = sourceProductionAny?.costing_period || sourceProductionAny?.costing_period_code || "-"
    const displayWorkflowMode = isApplying
        ? "Đang điều chỉnh..."
        : isChecking
            ? "Đang kiểm tra..."
            : applied
                ? "Đã chạy điều chỉnh"
                : result?.success ? "Kiểm tra hợp lệ" : result ? "Dừng do lỗi" : "Chưa kiểm tra"
    const resultTitle = applied
        ? "Đã chạy điều chỉnh"
        : result?.success
            ? "Kiểm tra hợp lệ"
            : "Không thể điều chỉnh"
    const resultMessage = result?.success
        ? applied
            ? "Đã chạy điều chỉnh thành công."
            : "An toàn, có thể điều chỉnh."
        : "Không thể điều chỉnh. Xem các dòng lỗi bên dưới."
    const resultDetails = result?.success ? [] : result?.details || []
    const resultIssues = useMemo(() => buildAdjustmentIssues(resultDetails), [resultDetails])
    const checkButtonLabel = checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"
    const applyButtonLabel = applyMutation.isPending ? "Đang điều chỉnh..." : "Chạy điều chỉnh"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[calc(100vh-24px)] max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] !max-w-[calc(100vw-24px)] flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b py-4 pl-6 pr-14">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                                <Wrench className="h-6 w-6 text-teal-600" />
                                Điều chỉnh lệnh sản xuất
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Điều chỉnh lệnh sản xuất
                            </DialogDescription>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                                <MetaItem label="Mã lệnh" value={sourceProduction?.production_no || "-"} strongValue />
                                <MetaItem icon={CalendarDays} label="Ngày lệnh" value={formatDate(sourceProduction?.production_date)} />
                                <MetaItem icon={Warehouse} label="Địa điểm kho" value={physicalWarehouseName} />
                                <MetaItem icon={Warehouse} label="Kho nhập" value={inputWarehouses.length ? inputWarehouses.join(", ") : "-"} />
                                <MetaItem label="Kỳ tính giá" value={costingPeriod} strongValue />
                            </div>
                        </div>
                        <div className="shrink-0 rounded-full border bg-muted/50 px-3 py-1 text-sm font-semibold text-muted-foreground">
                            {displayWorkflowMode}
                        </div>
                    </div>
                    <div className="mt-3 border-t pt-3">
                        <AdjustmentWorkflow
                            completedCount={completedWorkflowSteps}
                            hasResult={!!result}
                            success={!!result?.success}
                            checking={isChecking}
                            applying={isApplying}
                        />
                    </div>
                </DialogHeader>

                <div ref={contentRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-3">
                    <div className="hidden">
                        <div className="grid gap-3 border-b px-4 py-3 md:grid-cols-4">
                            <InfoItem label="Mã lệnh" value={sourceProduction?.production_no || "-"} />
                            <InfoItem label="Ngày lệnh" value={formatDate(sourceProduction?.production_date)} />
                            <InfoItem label="Địa điểm kho" value={(sourceProduction as any)?.physical_warehouse?.name || "-"} />
                            <InfoItem label="Trạng thái hiện tại" value={sourceProduction?.status || "-"} />
                        </div>
                        <AdjustmentWorkflow
                            completedCount={completedWorkflowSteps}
                            hasResult={!!result}
                            success={!!result?.success}
                            checking={isChecking}
                            applying={isApplying}
                        />
                    </div>

                    {(validationMessage || result) ? (
                        <div>
                            {validationMessage ? (
                                <ResultBox
                                    success={false}
                                    title="Chưa thể kiểm tra"
                                    message={validationMessage}
                                    details={[]}
                                />
                            ) : result ? (
                                <ResultBox
                                    success={!!result.success}
                                    title={resultTitle}
                                    message={resultMessage}
                                    details={resultDetails}
                                />
                            ) : null}
                        </div>
                    ) : null}

                    <ProductionAdjustmentCards
                        rows={rows}
                        expandedIndex={expandedIndex}
                        disabled={applied}
                        issues={resultIssues}
                        onAdd={addRow}
                        onToggle={(index) => setExpandedIndex((old) => old === index ? -1 : index)}
                        onEdit={(index) => setEditingIndex(index)}
                        onRemove={removeRow}
                        onMaterialChange={updateMaterialRow}
                    />

                    <div className="hidden">
                        <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
                            <div className="font-semibold">Thành phẩm sau điều chỉnh</div>
                            <Button type="button" size="sm" variant="outline" onClick={addRow} disabled={applied}>
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm dòng
                            </Button>
                        </div>
                        <div className="divide-y">
                            {rows.map((row, index) => (
                                <div key={index} className="space-y-3 p-3">
                                    <div className="grid gap-3 lg:grid-cols-[minmax(520px,1fr)_180px_240px_220px_auto]">
                                    <Field label={`Thành phẩm #${index + 1}`} required>
                                        <AsyncSelect
                                            value={row.product_id}
                                            onChange={(value: any, option: any) => handleProductChange(index, value, option, row)}
                                            disabled={applied}
                                            placeholder="Chọn mã hoặc tên thành phẩm"
                                            dataSource={{
                                                getList: listProducts,
                                                getById: getProduct,
                                                params: {
                                                    page: 1,
                                                    size: 20,
                                                    has_bom: true,
                                                    effective_date: sourceProduction?.production_date,
                                                },
                                            }}
                                            mapOption={(product: any) => ({
                                                value: product.id,
                                                label: `${product.code} - ${product.name}`,
                                                raw: product,
                                            })}
                                            optionWrapLabel
                                            popoverContentClassName="w-[620px] max-w-[calc(100vw-2rem)]"
                                        />
                                    </Field>

                                    <Field label="Số lượng" required>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={row.quantity_plan ?? ""}
                                            disabled={applied}
                                            onChange={(event) => {
                                                const quantity = Number(event.target.value)
                                                updateRow(index, {
                                                    quantity_plan: quantity,
                                                    quantity_done: quantity,
                                                    materials: recalculateMaterialsForOutputQuantity(row.materials, quantity),
                                                })
                                            }}
                                        />
                                    </Field>

                                    <Field label="Số lô TP">
                                        <Input
                                            value={row.lot_no || ""}
                                            disabled={applied}
                                            onChange={(event) => updateRow(index, { lot_no: event.target.value })}
                                            placeholder="Tự sinh nếu trống"
                                        />
                                    </Field>

                                    <Field label="HSD">
                                        <Input
                                            type="date"
                                            value={row.expiry_date || ""}
                                            disabled={applied}
                                            onChange={(event) => updateRow(index, { expiry_date: event.target.value })}
                                        />
                                    </Field>

                                    <div className="flex items-end justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={applied || rows.length <= 1}
                                            onClick={() => removeRow(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                    </div>
                                    <MaterialEditor
                                        rowIndex={index}
                                        materials={row.materials || []}
                                        disabled={applied}
                                        onAdd={() => addMaterialRow(index)}
                                        onRemove={(materialIndex) => removeMaterialRow(index, materialIndex)}
                                        onChange={(materialIndex, patch) => updateMaterialRow(index, materialIndex, patch)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {editingIndex != null && rows[editingIndex] ? (
                        <ProductionRowEditDialog
                            row={rows[editingIndex]}
                            rowIndex={editingIndex}
                            open
                            disabled={applied}
                            productionDate={String(sourceProduction?.production_date || "")}
                            canRemove={rows.length > 1}
                            onOpenChange={(next) => {
                                if (!next) setEditingIndex(null)
                            }}
                            onProductChange={(value, option, row) => handleProductChange(editingIndex, value, option, row)}
                            onRowChange={(patch) => updateRow(editingIndex, patch)}
                            onRemove={() => {
                                removeRow(editingIndex)
                                setEditingIndex(null)
                            }}
                            onMaterialAdd={() => addMaterialRow(editingIndex)}
                            onMaterialRemove={(materialIndex) => removeMaterialRow(editingIndex, materialIndex)}
                            onMaterialChange={(materialIndex, patch) => updateMaterialRow(editingIndex, materialIndex, patch)}
                        />
                    ) : null}

                    {false && validationMessage && (
                        <ResultBox
                            success={false}
                            title="Chưa thể kiểm tra"
                            message={validationMessage}
                            details={[]}
                        />
                    )}

                    {false && result && (
                        <ResultBox
                            success={!!result!.success}
                            title={applied ? "Đã chạy điều chỉnh" : result!.success ? "Kiểm tra hợp lệ" : "Không thể điều chỉnh"}
                            message={result!.message || ""}
                            details={result!.details || []}
                        />
                    )}
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!!validationMessage || checkMutation.isPending || applyMutation.isPending || applied}
                        onClick={() => {
                            prepareRunView()
                            checkMutation.mutate()
                        }}
                    >
                        {checkButtonLabel}
                    </Button>
                    <Button
                        type="button"
                        disabled={!canApply || applyMutation.isPending}
                        onClick={() => {
                            if (!canApply) {
                                toast.warning("Cần kiểm tra hợp lệ trước khi chạy điều chỉnh")
                                return
                            }
                            prepareRunView()
                            applyMutation.mutate()
                        }}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {applyButtonLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ProductionAdjustmentCards({
    rows,
    expandedIndex,
    disabled,
    issues,
    onAdd,
    onToggle,
    onEdit,
    onRemove,
    onMaterialChange,
}: {
    rows: Row[]
    expandedIndex: number
    disabled?: boolean
    issues?: AdjustmentIssue[]
    onAdd: () => void
    onToggle: (index: number) => void
    onEdit: (index: number) => void
    onRemove: (index: number) => void
    onMaterialChange: (rowIndex: number, materialIndex: number, patch: Partial<MaterialRow>) => void
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Thành phẩm sau điều chỉnh</div>
                <Button type="button" size="sm" variant="outline" onClick={onAdd} disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm thành phẩm
                </Button>
            </div>
            {rows.map((row, index) => {
                const isOpen = expandedIndex === index
                const materials = row.materials || []
                const product = row.product
                const rowIssues = findRowIssues(issues || [], row)
                const materialIssues = materials.flatMap((material) => findMaterialIssues(issues || [], material))
                const cardIssues = [
                    ...rowIssues,
                    ...(materialIssues.length
                        ? [{
                            message: `Có ${formatNumber(materialIssues.length)} dòng vật tư lỗi. Mở thành phẩm để xem chi tiết.`,
                            isSummary: true,
                        }]
                        : []),
                ]
                return (
                    <div key={index} className={cn("overflow-hidden rounded-md border bg-background", cardIssues.length && "border-red-300 bg-red-50/50 shadow-sm shadow-red-100")}>
                        <div className="flex items-start justify-between gap-3 px-4 py-3">
                            <button
                                type="button"
                                className="flex min-w-0 flex-1 items-start gap-3 text-left"
                                onClick={() => onToggle(index)}
                            >
                                <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", !isOpen && "-rotate-90")} />
                                <div className="min-w-0">
                                    <div className="truncate text-base font-semibold">
                                        {product?.name || `Thành phẩm #${index + 1}`}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                        <span>{product?.code || "-"}</span>
                                        <span>·</span>
                                        <span>SL KH {formatNumber(row.quantity_plan)} {product?.unit || ""}</span>
                                        <span>·</span>
                                        <span>SL nhập {formatNumber(row.quantity_done || row.quantity_plan)} {product?.unit || ""}</span>
                                        {row.lot_no ? (
                                            <>
                                                <span>·</span>
                                                <span>Lô TP {row.lot_no}</span>
                                            </>
                                        ) : null}
                                    </div>
                                    <InlineIssueList issues={cardIssues} />
                                </div>
                            </button>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold">
                                    {materials.length} vật tư
                                </span>
                                <Button type="button" size="icon" variant="outline" disabled={disabled} onClick={() => onEdit(index)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button type="button" size="icon" variant="ghost" disabled={disabled || rows.length <= 1} onClick={() => onRemove(index)}>
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                        {isOpen ? (
                            materials.length ? (
                                <div className="overflow-x-auto border-t">
                                    <table className="w-full min-w-[1280px] text-sm">
                                        <thead className="bg-muted/40 text-muted-foreground">
                                            <tr>
                                                <Th className="w-12">STT</Th>
                                                <Th>Tên</Th>
                                                <Th className="w-20">ĐVT</Th>
                                                <Th className="w-44">Kho</Th>
                                                <Th className="w-20">Loại</Th>
                                                <Th className="w-28 text-right">SL cần</Th>
                                                <Th className="w-28 text-right">Định mức</Th>
                                                <Th className="w-44">Lô FIFO</Th>
                                                <Th className="w-40 text-right">Chọn lô</Th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materials.map((material, materialIndex) => {
                                                const materialIssues = findMaterialIssues(issues || [], material)
                                                return (
                                                    <Fragment key={materialIndex}>
                                                <tr className={cn("border-t", materialIssues.length && "bg-red-50 text-red-950 [&>td]:border-red-100")}>
                                                    <Td className="text-muted-foreground">{materialIndex + 1}</Td>
                                                    <Td>
                                                        <div className="font-medium leading-tight">{material.product?.name || "-"}</div>
                                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                                            {material.product?.code || "-"} · ĐM {formatNumber(material.quantity_per_unit)}
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
                                                    <Td className="text-right font-medium tabular-nums">{formatNumber(material.quantity)}</Td>
                                                    <Td className="text-right tabular-nums">{formatNumber(material.quantity_per_unit)}</Td>
                                                    <Td>
                                                        <AllocationSummary material={material} />
                                                    </Td>
                                                    <Td className="text-right">
                                                        <PreferredLotSelector
                                                            material={material}
                                                            disabled={disabled}
                                                            onChange={(lotNo) => onMaterialChange(index, materialIndex, { lot_no: lotNo })}
                                                        />
                                                    </Td>
                                                </tr>
                                                        {materialIssues.length ? (
                                                            <tr className="border-t border-red-100 bg-red-50 text-red-800">
                                                                <td colSpan={9} className="px-3 py-2 text-xs">
                                                                    <InlineIssueList issues={materialIssues} />
                                                                </td>
                                                            </tr>
                                                        ) : null}
                                                    </Fragment>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="border-t px-4 py-5 text-center text-sm text-muted-foreground">
                                    Chưa có vật tư. Bấm biểu tượng sửa để thêm vật tư cho thành phẩm này.
                                </div>
                            )
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

function ProductionRowEditDialog({
    row,
    rowIndex,
    open,
    disabled,
    productionDate,
    canRemove,
    onOpenChange,
    onProductChange,
    onRowChange,
    onRemove,
    onMaterialAdd,
    onMaterialRemove,
    onMaterialChange,
}: {
    row: Row
    rowIndex: number
    open: boolean
    disabled?: boolean
    productionDate?: string
    canRemove: boolean
    onOpenChange: (open: boolean) => void
    onProductChange: (value: any, option: any, row: Row) => void
    onRowChange: (patch: Partial<Row>) => void
    onRemove: () => void
    onMaterialAdd: () => void
    onMaterialRemove: (index: number) => void
    onMaterialChange: (index: number, patch: Partial<MaterialRow>) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] w-[calc(100vw-80px)] !max-w-[calc(100vw-80px)] flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Sửa thành phẩm & vật tư</DialogTitle>
                    <DialogDescription>
                        {row.product?.code || `TP #${rowIndex + 1}`} - {row.product?.name || "Chưa chọn thành phẩm"}
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
                    <div className="grid gap-3 lg:grid-cols-[minmax(520px,1fr)_180px_240px_220px_auto]">
                        <Field label={`Thành phẩm #${rowIndex + 1}`} required>
                            <AsyncSelect
                                value={row.product_id}
                                onChange={(value: any, option: any) => onProductChange(value, option, row)}
                                disabled={disabled}
                                placeholder="Chọn mã hoặc tên thành phẩm"
                                dataSource={{
                                    getList: listProducts,
                                    getById: getProduct,
                                    params: {
                                        page: 1,
                                        size: 20,
                                        has_bom: true,
                                        effective_date: productionDate,
                                    },
                                }}
                                mapOption={(product: any) => ({
                                    value: product.id,
                                    label: `${product.code} - ${product.name}`,
                                    raw: product,
                                })}
                                optionWrapLabel
                                popoverContentClassName="w-[760px] max-w-[calc(100vw-2rem)]"
                            />
                        </Field>

                        <Field label="Số lượng" required>
                            <Input
                                type="number"
                                min={0}
                                value={row.quantity_plan ?? ""}
                                disabled={disabled}
                                onChange={(event) => {
                                    const quantity = Number(event.target.value)
                                    onRowChange({
                                        quantity_plan: quantity,
                                        quantity_done: quantity,
                                        materials: recalculateMaterialsForOutputQuantity(row.materials, quantity),
                                    })
                                }}
                            />
                        </Field>

                        <Field label="Số lô TP">
                            <Input
                                value={row.lot_no || ""}
                                disabled={disabled}
                                onChange={(event) => onRowChange({ lot_no: event.target.value })}
                                placeholder="Tự sinh nếu trống"
                            />
                        </Field>

                        <Field label="HSD">
                            <Input
                                type="date"
                                value={row.expiry_date || ""}
                                disabled={disabled}
                                onChange={(event) => onRowChange({ expiry_date: event.target.value })}
                            />
                        </Field>

                        <div className="flex items-end justify-end">
                            <Button type="button" variant="ghost" size="icon" disabled={disabled || !canRemove} onClick={onRemove}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    </div>
                    <MaterialEditor
                        rowIndex={rowIndex}
                        materials={row.materials || []}
                        disabled={disabled}
                        onAdd={onMaterialAdd}
                        onRemove={onMaterialRemove}
                        onChange={onMaterialChange}
                    />
                </div>
                <DialogFooter className="border-t px-6 py-4">
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Xong
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AllocationSummary({ material }: { material: MaterialRow }) {
    const allocations = material.fifo_allocations || []
    if (!allocations.length) {
        return <span className="text-muted-foreground">Chưa có lô FIFO</span>
    }
    return (
        <div className="space-y-0.5 text-xs">
            {allocations.slice(0, 2).map((allocation, index) => (
                <div key={`${allocation.id || allocation.lot_no || index}`} className="truncate">
                    {allocation.lot_no || "-"} · {formatNumber(allocation.quantity)}
                </div>
            ))}
            {allocations.length > 2 ? <div className="text-muted-foreground">+{allocations.length - 2} lô</div> : null}
        </div>
    )
}

function PreferredLotSelector({
    material,
    disabled,
    onChange,
}: {
    material: MaterialRow
    disabled?: boolean
    onChange: (lotNo?: string) => void
}) {
    const allocationLots = Array.from(
        new Map(
            (material.fifo_allocations || [])
                .filter((allocation) => allocation.lot_no)
                .map((allocation) => [String(allocation.lot_no), allocation]),
        ).values(),
    )
    const value = material.lot_no || "AUTO"
    return (
        <Select value={value} disabled={disabled} onValueChange={(next) => onChange(next === "AUTO" ? undefined : next)}>
            <SelectTrigger className="h-9 min-w-[150px] justify-between">
                <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent className="max-w-[420px]">
                <SelectItem value="AUTO">
                    <span className="inline-flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Auto
                    </span>
                </SelectItem>
                {allocationLots.map((allocation: any) => (
                    <SelectItem key={String(allocation.lot_no)} value={String(allocation.lot_no)}>
                        {allocation.lot_no} - đã lấy {formatNumber(allocation.quantity)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

function MaterialEditor({
    rowIndex,
    materials,
    disabled,
    onAdd,
    onRemove,
    onChange,
}: {
    rowIndex: number
    materials: MaterialRow[]
    disabled?: boolean
    onAdd: () => void
    onRemove: (index: number) => void
    onChange: (index: number, patch: Partial<MaterialRow>) => void
}) {
    return (
        <div className="rounded-md border bg-muted/10">
            <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="text-sm font-semibold">Vật tư của TP #{rowIndex + 1}</div>
                <Button type="button" size="sm" variant="outline" onClick={onAdd} disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm vật tư
                </Button>
            </div>
            {materials.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                    Chưa có vật tư tùy chỉnh, hệ thống sẽ lấy theo BOM hiện hành khi kiểm tra.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1540px] table-fixed text-sm">
                        <colgroup>
                            <col className="w-[64px]" />
                            <col className="w-[520px]" />
                            <col className="w-[320px]" />
                            <col className="w-[120px]" />
                            <col className="w-[160px]" />
                            <col className="w-[160px]" />
                            <col className="w-[260px]" />
                            <col className="w-[64px]" />
                        </colgroup>
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                                <Th className="text-center">STT</Th>
                                <Th>Vật tư</Th>
                                <Th>Kho xuất</Th>
                                <Th>Loại</Th>
                                <Th>SL</Th>
                                <Th>Định mức</Th>
                                <Th>Ghi chú</Th>
                                <Th> </Th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((material, materialIndex) => (
                                <tr key={materialIndex} className="border-t">
                                    <Td className="text-center">{materialIndex + 1}</Td>
                                    <Td>
                                        <AsyncSelect
                                            value={material.product_id}
                                            onChange={(value: any, option: any) => onChange(materialIndex, {
                                                product_id: value || undefined,
                                                product: option?.raw,
                                                warehouse_id: option?.raw?.default_warehouse_id || material.warehouse_id,
                                            })}
                                            disabled={disabled}
                                            placeholder="Chọn vật tư"
                                            dataSource={{ getList: listProducts, getById: getProduct, params: { page: 1, size: 20 } }}
                                            mapOption={(product: any) => ({
                                                value: product.id,
                                                label: `${product.code} - ${product.name}`,
                                                raw: product,
                                            })}
                                            optionWrapLabel
                                            popoverContentClassName="w-[760px] max-w-[calc(100vw-2rem)]"
                                        />
                                    </Td>
                                    <Td>
                                        <AsyncSelect
                                            value={material.warehouse_id}
                                            onChange={(value: any, option: any) => onChange(materialIndex, {
                                                warehouse_id: value || undefined,
                                                warehouse: option?.raw,
                                            })}
                                            disabled={disabled}
                                            placeholder="Chọn kho"
                                            dataSource={{ getList: listWarehouses, getById: getWarehouse, params: { page: 1, size: 20 } }}
                                            mapOption={(warehouse: any) => ({
                                                value: warehouse.id,
                                                label: warehouse.name || warehouse.code,
                                                raw: warehouse,
                                            })}
                                            optionWrapLabel
                                            popoverContentClassName="w-[520px] max-w-[calc(100vw-2rem)]"
                                        />
                                    </Td>
                                    <Td>
                                        <Select
                                            value={material.material_type || "NVL"}
                                            onValueChange={(value) => onChange(materialIndex, { material_type: value })}
                                            disabled={disabled}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NVL">NVL</SelectItem>
                                                <SelectItem value="BB">BB</SelectItem>
                                                <SelectItem value="TP">TP</SelectItem>
                                                <SelectItem value="HH">HH</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Td>
                                    <Td>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={material.quantity ?? ""}
                                            disabled={disabled}
                                            onChange={(event) => onChange(materialIndex, { quantity: Number(event.target.value) })}
                                        />
                                    </Td>
                                    <Td>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={material.quantity_per_unit ?? ""}
                                            disabled={disabled}
                                            onChange={(event) => onChange(materialIndex, { quantity_per_unit: Number(event.target.value) })}
                                        />
                                    </Td>
                                    <Td>
                                        <Input
                                            value={material.note || ""}
                                            disabled={disabled}
                                            onChange={(event) => onChange(materialIndex, { note: event.target.value })}
                                            placeholder="Ghi chú"
                                        />
                                    </Td>
                                    <Td>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            disabled={disabled}
                                            onClick={() => onRemove(materialIndex)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function ResultBox({
    success,
    title,
    message,
}: {
    success: boolean
    title: string
    message: string
    details: NonNullable<ProductionAdjustmentResult["details"]>
}) {
    return (
        <div className={`rounded-md border p-3 ${success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <div className={`flex items-center gap-2 font-semibold ${success ? "text-emerald-800" : "text-red-800"}`}>
                {success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                {title}
            </div>
            {message && <div className={`mt-1 text-sm ${success ? "text-emerald-700" : "text-red-700"}`}>{message}</div>}
        </div>
    )
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    )
}

function MetaItem({
    icon: Icon,
    label,
    value,
    strongValue,
}: {
    icon?: LucideIcon
    label: string
    value: string
    strongValue?: boolean
}) {
    return (
        <span className="inline-flex max-w-full items-center gap-1.5">
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span className="shrink-0 font-medium text-foreground">{label}:</span>
            <span className={cn("truncate", strongValue ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {value}
            </span>
        </span>
    )
}

function isResultError(status?: string | null) {
    const value = String(status || "").trim().toLowerCase()
    return value === "lỗi" || value === "loi" || value.includes("error")
}

function buildAdjustmentIssues(details: NonNullable<ProductionAdjustmentResult["details"]>): AdjustmentIssue[] {
    return (details || [])
        .filter((row: any) => isResultError(row.status))
        .map((row: any) => ({
            message: formatIssueMessage(String(row.message || row.detail || row.status || "Có lỗi cần kiểm tra")),
            status: row.status,
            category: row.category || row.type,
            product_code: normalizeIssueValue(row.product_code),
            warehouse_code: normalizeIssueValue(row.warehouse_code),
            lot_code: normalizeIssueValue(row.lot_code),
        }))
}

function formatIssueMessage(message: string) {
    return message.replace(/(^|[^A-Za-z0-9_.-])(\d+(?:\.\d+)?)(?=$|[^A-Za-z0-9_.-])/g, (match, prefix, raw) => {
        const value = Number(raw)
        if (!Number.isFinite(value)) return match
        if (Math.abs(value) < 1000 && !raw.includes(".")) return match
        return `${prefix}${formatNumber(value)}`
    })
}

function findRowIssues(issues: AdjustmentIssue[], row: Row) {
    const productCode = normalizeIssueValue(row.product?.code)
    if (!productCode) return []
    return issues.filter((issue) => issue.product_code === productCode && !issue.warehouse_code)
}

function findMaterialIssues(issues: AdjustmentIssue[], material: MaterialRow) {
    const productCode = normalizeIssueValue(material.product?.code)
    const warehouseCode = normalizeIssueValue(material.warehouse?.code)
    const lotCode = normalizeIssueValue(material.lot_no)
    if (!productCode) return []
    return issues.filter((issue) => {
        if (issue.product_code !== productCode) return false
        if (issue.warehouse_code && warehouseCode && issue.warehouse_code !== warehouseCode) return false
        if (issue.lot_code && lotCode && issue.lot_code !== lotCode) return false
        return true
    })
}

function normalizeIssueValue(value: unknown) {
    const text = String(value || "").trim()
    return text && text !== "-" ? text : undefined
}

function InlineIssueList({ issues }: { issues: AdjustmentIssue[] }) {
    if (!issues.length) return null
    return (
        <div className="mt-1 space-y-1">
            {issues.map((issue, index) => (
                <div
                    key={`${issue.product_code || "issue"}-${index}`}
                    className={cn(
                        "rounded border px-2 py-1 text-xs font-medium",
                        issue.isSummary ? "border-red-200 bg-red-100 text-red-800" : "border-red-200 bg-red-50 text-red-700",
                    )}
                >
                    {issue.message}
                </div>
            ))}
        </div>
    )
}

function AdjustmentWorkflow({
    completedCount,
    hasResult,
    success,
    checking,
    applying,
}: {
    completedCount: number
    hasResult: boolean
    success: boolean
    checking: boolean
    applying: boolean
}) {
    const busy = checking || applying
    const stepState = (index: number): AdjustmentWorkflowState => {
        if (busy) {
            return index === 0 ? "current" : "pending"
        }
        if (!hasResult) return "pending"
        if (success) return "done"
        if (index < completedCount) return "done"
        if (index === completedCount) return "error"
        return "pending"
    }

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="mr-1 inline-flex items-center gap-2 text-sm font-medium">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin text-teal-600" /> : null}
                Luồng xử lý:
            </div>
            {adjustmentWorkflowSteps.map((step, index) => {
                const Icon = step.icon
                const state = stepState(index)
                return (
                    <div key={step.key} className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled
                            className={cn("h-9", getAdjustmentStepClass(state))}
                        >
                            <Icon className="mr-2 h-4 w-4" />
                            {workflowStepLabel(step.key)}
                        </Button>
                        {index < adjustmentWorkflowSteps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm">
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            {children}
        </div>
    )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <th className={`px-3 py-2 text-left font-semibold text-muted-foreground ${className}`}>{children}</th>
}

function Td({ children, number, mono, className = "" }: { children: React.ReactNode; number?: boolean; mono?: boolean; className?: string }) {
    return (
        <td className={`px-3 py-2 align-middle ${number ? "text-right tabular-nums" : ""} ${mono ? "font-mono text-xs" : ""} ${className}`}>
            {children}
        </td>
    )
}

function formatNumber(value?: number | null) {
    if (value == null) return "-"
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(Number(value || 0))
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [year, month, day] = value.slice(0, 10).split("-")
    if (!year || !month || !day) return value
    return `${day}/${month}/${year}`
}

