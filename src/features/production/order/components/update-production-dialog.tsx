import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Save, Trash2 } from "lucide-react"

import { updateProduction, type UpdateProductionRequest } from "@/api/production/order"
import { listProducts, getProduct } from "@/api/product"
import { listPhysicalWarehouses, getPhysicalWarehouse } from "@/api/physical-warehouse"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
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
import type { Production } from "../data/schema"
import { getProductionStatusLabel } from "./production-status"
import {
    ProductionItemsBulkPaste,
    type ProductionItemDraft,
} from "./production-items-bulk-paste"

type Props = {
    production: Production
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Row = ProductionItemDraft

const newRow = (): Row => ({
    quantity_plan: 1,
    quantity_done: 1,
})

const currentTime = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const normalizeTime = (value?: string) => (value ? value.slice(0, 5) : currentTime())

export function UpdateProductionDialog({
    production,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()

    const [productionDate, setProductionDate] = useState("")
    const [productionTime, setProductionTime] = useState(currentTime())
    const [physicalWarehouseId, setPhysicalWarehouseId] = useState<number>()
    const [warehouseId, setWarehouseId] = useState<number>()
    const [packingCode, setPackingCode] = useState("")
    const [note, setNote] = useState("")
    const [items, setItems] = useState<Row[]>([newRow()])

    useEffect(() => {
        if (!production || !open) return

        setProductionDate(production.production_date || "")
        setProductionTime(normalizeTime(production.production_time))
        setNote(production.note || "")
        setPhysicalWarehouseId(production.physical_warehouse_id)
        setWarehouseId(production.items?.[0]?.warehouse_id)
        setPackingCode((production as any).packing_code || "")
        setItems(
            production.items?.length
                ? production.items.map((item: any) => ({
                    product_id: item.product_id,
                    product: item.product,
                    quantity_plan: item.quantity_plan ?? 1,
                    quantity_done: item.quantity_done ?? 1,
                    note: item.note ?? "",
                }))
                : [newRow()]
        )
    }, [production, open])

    const summary = useMemo(() => {
        const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity_plan) || 0), 0)
        const units = Array.from(
            new Set(items.map((item) => getProductUnit(item.product)).filter(Boolean))
        )
        const unit = units.length === 1 ? units[0] : units.length > 1 ? "nhiều ĐV" : ""

        return {
            count: items.length,
            totalQuantity,
            unit,
        }
    }, [items])

    const { mutate, isPending } = useMutation({
        mutationFn: updateProduction,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["productions"] })
            await queryClient.invalidateQueries({ queryKey: ["production-orders"] })
            toast.success("Cập nhật lệnh sản xuất thành công")
            onOpenChange(false)
        },
        onError: (e: any) => toast.error(e.message || "Không thể cập nhật lệnh sản xuất"),
    })

    const updateRow = (index: number, patch: Partial<Row>) => {
        setItems((old) =>
            old.map((item, i) => (i === index ? { ...item, ...patch } : item))
        )
    }

    const addRow = () => {
        setItems((old) => [...old, newRow()])
    }

    const removeRow = (index: number) => {
        setItems((old) => old.filter((_, i) => i !== index))
    }

    const applyBulkItems = (rows: Row[]) => {
        setItems(rows.length ? rows : [newRow()])
    }

    const submit = () => {
        if (!productionDate) return toast.error("Ngày lệnh là bắt buộc")
        if (!physicalWarehouseId) return toast.error("Địa điểm kho là bắt buộc")
        if (!warehouseId) return toast.error("Kho nhập là bắt buộc")
        if (!items.length) return toast.error("Cần ít nhất 1 thành phẩm")

        for (const [index, item] of items.entries()) {
            if (!item.product_id) return toast.error(`Thành phẩm #${index + 1} chưa chọn mã`)
            if (!item.quantity_plan || item.quantity_plan <= 0) {
                return toast.error(`Số lượng sản xuất của thành phẩm #${index + 1} phải > 0`)
            }
        }

        mutate({
            id: production.id,
            physical_warehouse_id: physicalWarehouseId,
            warehouse_id: warehouseId,
            production_date: productionDate,
            production_time: productionTime || undefined,
            packing_code: packingCode || undefined,
            status: production.status,
            note,
            items: items.map((item) => ({
                product_id: item.product_id,
                quantity_plan: item.quantity_plan,
                quantity_done: item.quantity_done,
                note: item.note || undefined,
            })),
        } as UpdateProductionRequest)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] !max-w-5xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Cập nhật lệnh sản xuất</DialogTitle>
                    <DialogDescription>
                        Chỉnh ngày, địa điểm kho và thành phẩm khi lệnh còn ở bước nháp hoặc kế hoạch.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                        <section className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-4">
                                <Field label="Mã lệnh SX">
                                    <Input value={production.production_no || ""} disabled />
                                </Field>

                                <Field label="Ngày lệnh" required>
                                    <DatePicker
                                        value={productionDate}
                                        onChange={(value) => setProductionDate(value || "")}
                                        placeholder="Chọn ngày"
                                    />
                                </Field>

                                <Field label="Địa điểm kho" required>
                                    <AsyncSelect
                                        value={physicalWarehouseId}
                                        onChange={(value: any) => {
                                            setPhysicalWarehouseId(value || undefined)
                                            setWarehouseId(undefined)
                                        }}
                                        placeholder="Chọn địa điểm kho"
                                        dataSource={{
                                            getList: listPhysicalWarehouses,
                                            getById: getPhysicalWarehouse,
                                            params: { page: 1, size: 20, status: "ACTIVE" },
                                        }}
                                        mapOption={(warehouse: any) => ({
                                            value: warehouse.id,
                                            label: warehouse.name || warehouse.code || `#${warehouse.id}`,
                                        })}
                                        optionWrapLabel
                                        popoverContentClassName="w-[460px] max-w-[calc(100vw-2rem)]"
                                    />
                                </Field>

                                <Field label={"Gi\u1edd l\u1ec7nh"} required>
                                    <Input
                                        type="time"
                                        value={productionTime}
                                        onChange={(event) => setProductionTime(event.target.value)}
                                    />
                                </Field>

                                <Field label="Kho nhập" required>
                                    <AsyncSelect
                                        value={warehouseId}
                                        onChange={(value: any) => setWarehouseId(value || undefined)}
                                        placeholder={
                                            physicalWarehouseId
                                                ? "Chọn kho nhập"
                                                : "Chọn địa điểm kho trước"
                                        }
                                        disabled={!physicalWarehouseId}
                                        dataSource={{
                                            getList: listWarehouses,
                                            getById: getWarehouse,
                                            params: {
                                                page: 1,
                                                size: 20,
                                                status: "ACTIVE",
                                                physical_warehouse_id: physicalWarehouseId,
                                            },
                                        }}
                                        mapOption={(warehouse: any) => ({
                                            value: warehouse.id,
                                            label: warehouse.name || warehouse.code || `#${warehouse.id}`,
                                            raw: warehouse,
                                        })}
                                        optionWrapLabel
                                        popoverContentClassName="w-[460px] max-w-[calc(100vw-2rem)]"
                                    />
                                </Field>

                                <Field label="Packing code">
                                    <Input
                                        value={packingCode}
                                        onChange={(event) => setPackingCode(event.target.value)}
                                        placeholder="PACK001"
                                    />
                                </Field>

                                <Field label="Trạng thái">
                                    <Input value={getProductionStatusLabel(production.status || "PLANNED")} disabled />
                                </Field>

                                <Field label="Ghi chú">
                                    <Input
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        placeholder="Ghi chú chung"
                                    />
                                </Field>
                            </div>

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold">Thành phẩm</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Mỗi dòng là một thành phẩm trong cùng lệnh sản xuất.
                                        </p>
                                    </div>

                                    <Button type="button" variant="outline" size="sm" onClick={addRow}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Thêm dòng
                                    </Button>
                                </div>

                                <ProductionItemsBulkPaste
                                    disabled={isPending}
                                    effectiveDate={productionDate}
                                    onApply={applyBulkItems}
                                />

                                <div className="space-y-3">
                                    {items.map((row, index) => (
                                            <div key={index} className="rounded-md border">
                                                <div className="grid gap-3 p-3 lg:grid-cols-[minmax(260px,1fr)_160px_auto]">
                                                    <Field label={`Thành phẩm #${index + 1}`} required>
                                                        <AsyncSelect
                                                            value={row.product_id}
                                                            onChange={(value: any, option: any) =>
                                                                updateRow(index, {
                                                                    product_id: value || undefined,
                                                                    product: option?.raw,
                                                                })
                                                            }
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
                                                        />
                                                    </Field>

                                                    <Field label="Số lượng sản xuất" required>
                                                        <QuantityInput
                                                            type="number"
                                                            min={0}
                                                            value={row.quantity_plan}
                                                            unit={getProductUnit(row.product)}
                                                            onChange={(event) => {
                                                                const quantity = Number(event.target.value)
                                                                updateRow(index, {
                                                                    quantity_plan: quantity,
                                                                    quantity_done: quantity,
                                                                })
                                                            }}
                                                        />
                                                    </Field>

                                                    <div className="flex items-end justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeRow(index)}
                                                            disabled={items.length <= 1}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {row.product?.name && (
                                                    <div className="border-t px-3 py-2 text-sm text-muted-foreground">
                                                        {row.product.code} - {row.product.name}
                                                        {getProductUnit(row.product) && (
                                                            <span className="ml-2 rounded border px-1.5 py-0.5 text-xs">
                                                                Đơn vị: {getProductUnit(row.product)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </section>

                        <aside className="h-fit rounded-md border bg-muted/20 p-4">
                            <div className="text-sm font-medium">Tóm tắt lệnh</div>
                            <div className="mt-3 space-y-3 text-sm">
                                <SummaryRow label="Số thành phẩm" value={summary.count} />
                                <SummaryRow label="Tổng SL sản xuất" value={formatQuantity(summary.totalQuantity, summary.unit)} />
                            </div>
                            <div className="mt-4 rounded-md border bg-background p-3 text-sm text-muted-foreground">
                                Kho nhập thành phẩm được chọn từ danh sách kho quản lý thuộc địa điểm kho.
                            </div>
                        </aside>
                    </div>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button onClick={submit} disabled={isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
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
        <div className="space-y-1.5">
            <Label className="text-sm">
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
        </div>
    )
}

function QuantityInput({
    unit,
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    unit?: string
}) {
    return (
        <div className="relative">
            <Input
                className={`${unit ? "pr-16" : ""} ${className ?? ""}`}
                {...props}
            />
            {unit && (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
                    {unit}
                </span>
            )}
        </div>
    )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    )
}

function getProductUnit(product: any) {
    return product?.unit?.trim?.() || ""
}

function formatQuantity(value: number, unit?: string) {
    return unit ? `${value} ${unit}` : value
}
