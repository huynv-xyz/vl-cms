import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { createProductBom, updateProductBom } from "@/api/production/bom"
import { getProduct, listProducts } from "@/api/product"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/features/product/data/schema"
import type { CreateProductBomItemRequest, CreateProductBomRequest, ProductBom } from "../data/schema"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    bom?: ProductBom
}

type BomRow = CreateProductBomItemRequest & {
    material_product?: Product
}

const today = () => new Date().toISOString().slice(0, 10)

const newRow = (): BomRow => ({
    material_type: "NVL",
    quantity: 1,
})

const mapProductOption = (x: Product) => ({
    value: x.id,
    label: `${x.code} - ${x.name}`,
    raw: x,
})

function productUnit(product?: Product) {
    return product?.unit || ""
}

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? true
}

function toDateInput(value?: string) {
    if (!value) return ""
    return value.slice(0, 10)
}

function rowsFromBom(bom?: ProductBom): BomRow[] {
    if (!bom?.items?.length) return [newRow()]

    return bom.items.map((item) => ({
        material_product_id: item.material_product_id,
        material_product: item.material_product,
        material_type: item.material_type === "BB" ? "BB" : "NVL",
        quantity: Number(item.quantity || 0),
        unit: item.unit || productUnit(item.material_product),
        line_no: item.line_no,
        note: item.note,
    }))
}

export function CreateBomDialog({ open, onOpenChange, bom }: Props) {
    const queryClient = useQueryClient()
    const isEdit = !!bom

    const [productId, setProductId] = useState<number>()
    const [version, setVersion] = useState("V1")
    const [validFrom, setValidFrom] = useState(today())
    const [validTo, setValidTo] = useState("")
    const [active, setActive] = useState(true)
    const [note, setNote] = useState("")
    const [rows, setRows] = useState<BomRow[]>([newRow()])

    const summary = useMemo(() => {
        const nvlCount = rows.filter((x) => x.material_type === "NVL").length
        const bbCount = rows.filter((x) => x.material_type === "BB").length
        return { total: rows.length, nvlCount, bbCount }
    }, [rows])

    const reset = () => {
        setProductId(undefined)
        setVersion("V1")
        setValidFrom(today())
        setValidTo("")
        setActive(true)
        setNote("")
        setRows([newRow()])
    }

    const fillForm = (value: ProductBom) => {
        setProductId(value.product_id)
        setVersion(value.version || "V1")
        setValidFrom(toDateInput(value.valid_from) || today())
        setValidTo(toDateInput(value.valid_to))
        setActive(activeOf(value))
        setNote(value.note || "")
        setRows(rowsFromBom(value))
    }

    useEffect(() => {
        if (!open) return

        if (bom) {
            fillForm(bom)
        } else {
            reset()
        }
    }, [open, bom])

    const { mutate, isPending } = useMutation({
        mutationFn: (body: CreateProductBomRequest) =>
            bom ? updateProductBom(bom.id, body) : createProductBom(body),
        onSuccess: () => {
            toast.success(isEdit ? "Đã cập nhật BOM" : "Đã tạo BOM")
            reset()
            onOpenChange(false)
            void queryClient.invalidateQueries({ queryKey: ["product-boms"] })
        },
        onError: (e: any) => {
            toast.error(e.message || (isEdit ? "Không thể cập nhật BOM" : "Không thể tạo BOM"))
        },
    })

    const updateRow = (index: number, patch: Partial<BomRow>) => {
        setRows((old) => old.map((x, i) => (i === index ? { ...x, ...patch } : x)))
    }

    const addRow = () => {
        setRows((old) => [...old, newRow()])
    }

    const removeRow = (index: number) => {
        setRows((old) => old.filter((_, i) => i !== index))
    }

    const submit = () => {
        if (!productId) return toast.error("Chưa chọn thành phẩm")
        if (!validFrom) return toast.error("Ngày hiệu lực là bắt buộc")
        if (!rows.length) return toast.error("BOM cần ít nhất 1 dòng vật tư")

        for (const [index, row] of rows.entries()) {
            if (!row.material_product_id) {
                return toast.error(`Dòng ${index + 1} chưa chọn vật tư`)
            }
            if (!row.quantity || Number(row.quantity) <= 0) {
                return toast.error(`Định mức dòng ${index + 1} phải > 0`)
            }
        }

        mutate({
            product_id: productId,
            version: version.trim() || "V1",
            valid_from: validFrom,
            valid_to: validTo || undefined,
            active: true,
            note: note.trim() || undefined,
            items: rows.map((row, index) => ({
                material_product_id: row.material_product_id,
                material_type: row.material_type,
                quantity: Number(row.quantity),
                unit: row.unit || productUnit(row.material_product) || undefined,
                line_no: index + 1,
                note: row.note?.trim() || undefined,
            })),
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] !max-w-6xl flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>{isEdit ? "Sửa BOM" : "Tạo BOM"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Cập nhật định mức vật tư cho thành phẩm."
                            : "Khai báo định mức vật tư cho 1 đơn vị thành phẩm."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_280px]">
                    <div className="space-y-6 p-6">
                        <section className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Thành phẩm *</Label>
                                <AsyncSelect
                                    value={productId}
                                    onChange={setProductId}
                                    required
                                    placeholder="Chọn thành phẩm"
                                    searchPlaceholder="Tìm mã hoặc tên thành phẩm"
                                    dataSource={{
                                        getList: listProducts,
                                        getById: getProduct,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={mapProductOption}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Phiên bản</Label>
                                <Input
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="V1"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Hiệu lực từ *</Label>
                                <DatePicker
                                    value={validFrom}
                                    onChange={(v) => setValidFrom(v || "")}
                                    placeholder="Ngày bắt đầu"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Hiệu lực đến</Label>
                                <DatePicker
                                    value={validTo}
                                    onChange={(v) => setValidTo(v || "")}
                                    placeholder="Bỏ trống nếu dùng lâu dài"
                                />
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">Vật tư định mức</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mỗi dòng là lượng vật tư cần cho 1 đơn vị thành phẩm.
                                    </p>
                                </div>
                                <Button type="button" variant="outline" onClick={addRow}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm dòng
                                </Button>
                            </div>

                            <div className="overflow-hidden rounded-md border">
                                <div className="grid grid-cols-[minmax(280px,1fr)_120px_140px_90px_44px] gap-3 border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                                    <div>Vật tư</div>
                                    <div>Loại</div>
                                    <div>Định mức</div>
                                    <div>Đơn vị</div>
                                    <div />
                                </div>

                                <div className="divide-y">
                                    {rows.map((row, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-[minmax(280px,1fr)_120px_140px_90px_44px] gap-3 px-3 py-3"
                                        >
                                            <AsyncSelect
                                                value={row.material_product_id}
                                                onChange={async (value: number | undefined) => {
                                                    if (!value) {
                                                        updateRow(index, {
                                                            material_product_id: undefined,
                                                            material_product: undefined,
                                                            unit: "",
                                                        })
                                                        return
                                                    }

                                                    const product = await getProduct(value).catch(
                                                        () => undefined
                                                    )

                                                    updateRow(index, {
                                                        material_product_id: value,
                                                        material_product: product,
                                                        unit: product?.unit || row.unit,
                                                    })
                                                }}
                                                required
                                                placeholder="Chọn vật tư"
                                                searchPlaceholder="Tìm vật tư"
                                                dataSource={{
                                                    getList: listProducts,
                                                    getById: getProduct,
                                                    params: { page: 1, size: 20 },
                                                }}
                                                mapOption={(x: Product) => ({
                                                    ...mapProductOption(x),
                                                    label: `${x.code} - ${x.name}`,
                                                })}
                                            />

                                            <Select
                                                value={row.material_type}
                                                onValueChange={(value: "NVL" | "BB") =>
                                                    updateRow(index, { material_type: value })
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NVL">NVL</SelectItem>
                                                    <SelectItem value="BB">BB</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.000001"
                                                value={row.quantity}
                                                onChange={(e) =>
                                                    updateRow(index, {
                                                        quantity: Number(e.target.value),
                                                    })
                                                }
                                            />

                                            <Input
                                                value={row.unit || productUnit(row.material_product)}
                                                onChange={(e) =>
                                                    updateRow(index, { unit: e.target.value })
                                                }
                                                placeholder="kg"
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={rows.length === 1}
                                                onClick={() => removeRow(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <div className="space-y-2">
                            <Label>Ghi chú</Label>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ghi chú BOM..."
                            />
                        </div>
                    </div>

                    <aside className="border-t bg-muted/20 p-6 lg:border-l lg:border-t-0">
                        <h3 className="font-semibold">Tóm tắt</h3>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Tổng dòng</dt>
                                <dd className="font-medium">{summary.total}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Nguyên liệu</dt>
                                <dd className="font-medium">{summary.nvlCount}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Bao bì</dt>
                                <dd className="font-medium">{summary.bbCount}</dd>
                            </div>
                        </dl>
                    </aside>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Huỷ
                    </Button>
                    <Button onClick={submit} disabled={isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isEdit ? "Cập nhật BOM" : "Lưu BOM"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
