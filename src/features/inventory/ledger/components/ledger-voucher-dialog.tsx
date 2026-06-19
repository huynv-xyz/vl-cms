import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowUpRight, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { createVoucher, postVoucher, type CreateVoucherRequest, type VoucherTypeCode } from "@/api/inventory/voucher"
import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    INVENTORY_INBOUND_DOC_TYPES,
    INVENTORY_OUTBOUND_DOC_TYPES,
} from "../data/schema"

type VoucherMode = "in" | "out"

type VoucherLine = {
    id: string
    product_id?: number
    unit?: string
    quantity: string
    unit_price: string
    lot_code: string
    expiry_date: string
    note: string
}

type Props = {
    mode: VoucherMode
    open: boolean
    onOpenChange: (open: boolean) => void
}

const INBOUND_TYPES = INVENTORY_INBOUND_DOC_TYPES.filter(
    (type) => !["OPENING", "PRODUCTION", "SALES_RETURN"].includes(type.value),
)

const OUTBOUND_TYPES = INVENTORY_OUTBOUND_DOC_TYPES.filter(
    (type) => !["PRODUCTION_MATERIAL", "SALES_EXPORT"].includes(type.value),
)

const VOUCHER_TYPE_BY_DOC_TYPE: Record<string, VoucherTypeCode> = {
    OPENING: "OPENING_IN",
    SALES_RETURN: "PNK_SALES_RETURN",
    IMPORT_PURCHASE: "PNK_PURCHASE_IMPORT",
    DOMESTIC_PURCHASE: "PNK_PURCHASE_DOMESTIC",
    PRODUCTION: "PNK_PROD",
    OTHER_INBOUND: "PNK_OTHER",
    SALES_EXPORT: "PXK_SALE",
    TRANSFER_EXPORT: "PXK_OTHER",
    PRODUCTION_MATERIAL: "PXK_PROD",
    TRANSPORT_EXPORT: "PXK_OTHER",
    PURCHASE_RETURN: "PXK_PURCHASE_RETURN",
    OTHER_EXPORT: "PXK_OTHER",
}

function createId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
}

function createEmptyLine(): VoucherLine {
    return {
        id: createId(),
        quantity: "",
        unit_price: "",
        lot_code: "",
        expiry_date: "",
        note: "",
    }
}

function today() {
    return new Date().toISOString().slice(0, 10)
}

export function LedgerVoucherDialog({ mode, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const isInbound = mode === "in"
    const voucherTypes = isInbound ? INBOUND_TYPES : OUTBOUND_TYPES
    const [voucherType, setVoucherType] = useState<VoucherTypeCode>(voucherTypes[0].value as VoucherTypeCode)
    const [postingDate, setPostingDate] = useState(today())
    const [warehouseId, setWarehouseId] = useState<number | undefined>()
    const [description, setDescription] = useState("")
    const [lines, setLines] = useState<VoucherLine[]>([createEmptyLine()])

    const title = isInbound ? "Tạo phiếu nhập kho" : "Tạo phiếu xuất kho"
    const Icon = isInbound ? ArrowDownLeft : ArrowUpRight

    useEffect(() => {
        if (!open) return
        setVoucherType(voucherTypes[0].value as VoucherTypeCode)
    }, [mode, open])

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = buildPayload()
            const voucher = await createVoucher(payload)
            await postVoucher(voucher.id)
            return voucher
        },
        onSuccess: async () => {
            toast.success(isInbound ? "Đã tạo phiếu nhập kho" : "Đã tạo phiếu xuất kho")
            await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
            onOpenChange(false)
            resetForm()
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không tạo được phiếu kho")
        },
    })

    const validLines = useMemo(
        () => lines.filter((line) => line.product_id && Number(line.quantity) > 0),
        [lines],
    )

    const updateLine = (id: string, patch: Partial<VoucherLine>) => {
        setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
    }

    const addLine = () => setLines((current) => [...current, createEmptyLine()])

    const removeLine = (id: string) => {
        setLines((current) => (current.length <= 1 ? current : current.filter((line) => line.id !== id)))
    }

    const resetForm = () => {
        setVoucherType(voucherTypes[0].value as VoucherTypeCode)
        setPostingDate(today())
        setWarehouseId(undefined)
        setDescription("")
        setLines([createEmptyLine()])
    }

    const buildPayload = (): CreateVoucherRequest => {
        if (!warehouseId) {
            throw new Error("Chọn kho hàng")
        }
        if (!postingDate) {
            throw new Error("Chọn ngày chứng từ")
        }
        if (!validLines.length) {
            throw new Error("Thêm ít nhất 1 dòng sản phẩm có số lượng")
        }

        return {
            voucher_type_code: VOUCHER_TYPE_BY_DOC_TYPE[voucherType] ?? voucherType,
            posting_date: postingDate,
            document_date: postingDate,
            warehouse_id: warehouseId,
            description: description.trim() || undefined,
            source_type: voucherType,
            items: validLines.map((line, index) => {
                const quantity = Number(line.quantity)
                const unitPrice = Number(line.unit_price || 0)

                return {
                    line_no: index + 1,
                    product_id: Number(line.product_id),
                    warehouse_id: warehouseId,
                    quantity,
                    unit: line.unit,
                    unit_price: unitPrice,
                    amount: quantity * unitPrice,
                    lot_code: isInbound && line.lot_code.trim() ? line.lot_code.trim() : undefined,
                    expiry_date: isInbound && line.expiry_date ? line.expiry_date : undefined,
                    note: line.note.trim() || undefined,
                }
            }),
        }
    }

    const handleSubmit = () => {
        try {
            buildPayload()
        } catch (error: any) {
            toast.error(error?.message || "Kiểm tra lại thông tin phiếu")
            return
        }
        mutation.mutate()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-[96vw] flex-col overflow-hidden sm:max-w-[1500px]">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", isInbound ? "text-emerald-600" : "text-rose-600")} />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                    <div className="grid gap-3 xl:grid-cols-[minmax(440px,1fr)_180px_minmax(420px,1.4fr)]">
                        <div className="min-w-0 space-y-1.5">
                            <Label>Loại chứng từ</Label>
                            <Select value={voucherType} onValueChange={(value) => setVoucherType(value as VoucherTypeCode)}>
                                <SelectTrigger className="w-full min-w-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {voucherTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-0 space-y-1.5">
                            <Label>Ngày chứng từ</Label>
                            <Input type="date" value={postingDate} onChange={(event) => setPostingDate(event.target.value)} />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                            <Label>Kho hàng</Label>
                            <AsyncSelect
                                value={warehouseId}
                                onChange={(value: any) => setWarehouseId(value || undefined)}
                                placeholder="Chọn kho hàng"
                                dataSource={{
                                    getList: listWarehouses,
                                    getById: getWarehouse,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={(warehouse: any) => ({
                                    value: warehouse.id,
                                    label: warehouse.name,
                                    raw: warehouse,
                                })}
                            />
                        </div>

                        <div className="space-y-1.5 xl:col-span-3">
                            <Label>Ghi chú</Label>
                            <Textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Ghi chú chung của phiếu"
                                className="min-h-16"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-md border">
                        <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-2">
                            <div className="font-semibold">Danh sách sản phẩm</div>
                            <Button type="button" size="sm" variant="outline" onClick={addLine}>
                                <Plus className="mr-1 h-4 w-4" />
                                Thêm dòng
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1180px] text-sm">
                                <thead className="text-muted-foreground bg-muted/30 border-b text-xs">
                                    <tr>
                                        <th className="w-12 px-3 py-2 text-center">STT</th>
                                        <th className="min-w-[420px] px-3 py-2 text-left">Sản phẩm</th>
                                        <th className="w-20 px-3 py-2 text-left">ĐVT</th>
                                        <th className="w-32 px-3 py-2 text-right">Số lượng</th>
                                        {isInbound ? <th className="w-36 px-3 py-2 text-left">Số lô</th> : null}
                                        {isInbound ? <th className="w-36 px-3 py-2 text-left">HSD</th> : null}
                                        <th className="w-36 px-3 py-2 text-right">Đơn giá</th>
                                        <th className="min-w-[180px] px-3 py-2 text-left">Ghi chú</th>
                                        <th className="w-14 px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, index) => (
                                        <tr key={line.id} className="border-b last:border-b-0">
                                            <td className="text-muted-foreground px-3 py-2 text-center font-mono">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-2">
                                                <AsyncSelect
                                                    value={line.product_id}
                                                    onChange={(_value: any, option: any) =>
                                                        updateLine(line.id, {
                                                            product_id: option?.value || undefined,
                                                            unit: option?.raw?.unit || undefined,
                                                        })
                                                    }
                                                    placeholder="Chọn sản phẩm"
                                                    dataSource={{
                                                        getList: listProducts,
                                                        getById: getProduct,
                                                        params: { page: 1, size: 20 },
                                                    }}
                                                    mapOption={(product: any) => ({
                                                        value: product.id,
                                                        label: `${product.code} - ${product.name}`,
                                                        raw: product,
                                                    })}
                                                />
                                            </td>
                                            <td className="text-muted-foreground px-3 py-2">
                                                {line.unit || "-"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.001"
                                                    value={line.quantity}
                                                    onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                                                    className="text-right"
                                                    placeholder="0"
                                                />
                                            </td>
                                            {isInbound ? (
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={line.lot_code}
                                                        onChange={(event) => updateLine(line.id, { lot_code: event.target.value })}
                                                        placeholder="Tự sinh nếu trống"
                                                    />
                                                </td>
                                            ) : null}
                                            {isInbound ? (
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="date"
                                                        value={line.expiry_date}
                                                        onChange={(event) => updateLine(line.id, { expiry_date: event.target.value })}
                                                    />
                                                </td>
                                            ) : null}
                                            <td className="px-3 py-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.001"
                                                    value={line.unit_price}
                                                    onChange={(event) => updateLine(line.id, { unit_price: event.target.value })}
                                                    className="text-right"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input
                                                    value={line.note}
                                                    onChange={(event) => updateLine(line.id, { note: event.target.value })}
                                                    placeholder="Ghi chú dòng"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={lines.length <= 1}
                                                    onClick={() => removeLine(line.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!isInbound ? (
                        <div className="text-muted-foreground rounded-md border bg-muted/30 px-3 py-2 text-sm">
                            Phiếu xuất sẽ tự chọn lô theo FIFO trong kho đã chọn khi lưu.
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="shrink-0 border-t pt-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {mutation.isPending ? "Đang lưu..." : "Lưu và ghi sổ"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
