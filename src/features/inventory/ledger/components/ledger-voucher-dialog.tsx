import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus, Save, Settings2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { createVoucher, listVoucherTypes, postVoucher, type CreateVoucherRequest, type InventoryVoucherType, type VoucherTypeCode } from "@/api/inventory/voucher"
import { getProduct, listProducts } from "@/api/product"
import { getPhysicalWarehouse, listPhysicalWarehouses } from "@/api/physical-warehouse"
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

type VoucherMode = "in" | "out" | "transfer"

type VoucherLine = {
    id: string
    product_id?: number
    warehouse_id?: number
    to_warehouse_id?: number
    lot_id?: number
    unit?: string
    quantity: string
    unit_price: string
    lot_code: string
    expiry_date: string
    product_inventory_account?: string
    tk_no: string
    tk_co: string
    note: string
}

type Props = {
    mode: VoucherMode
    open: boolean
    onOpenChange: (open: boolean) => void
}

const PRODUCT_ACCOUNT_MARKER = "PRODUCT_ACCOUNT"

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
        tk_no: "",
        tk_co: "",
        note: "",
    }
}

function today() {
    return dateToYmd(new Date())
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function resolveConfiguredAccount(value: string | null | undefined, productAccount?: string) {
    const configured = (value || "").trim()
    if (!configured) return ""
    if (configured.toUpperCase() === PRODUCT_ACCOUNT_MARKER) {
        return (productAccount || "").trim()
    }
    return configured
}

function resolveLineAccounts(line: VoucherLine, voucherType?: InventoryVoucherType) {
    return {
        tk_no: resolveConfiguredAccount(voucherType?.tk_no, line.product_inventory_account),
        tk_co: resolveConfiguredAccount(voucherType?.tk_co, line.product_inventory_account),
    }
}

export function LedgerVoucherDialog({ mode, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const isInbound = mode === "in"
    const isTransfer = mode === "transfer"
    const { data: voucherTypes = [], isLoading: isLoadingTypes } = useQuery({
        queryKey: ["inventory-voucher-types", isInbound ? "I" : "O", mode],
        queryFn: () => listVoucherTypes(isInbound ? "I" : "O", 1),
        enabled: open,
    })
    const selectableVoucherTypes = useMemo(
        () => voucherTypes.filter((type) => {
            if (isTransfer) return type.code === "TRANSFER_EXPORT"
            return mode !== "out" || type.code !== "TRANSFER_EXPORT"
        }),
        [isTransfer, mode, voucherTypes],
    )
    const [voucherType, setVoucherType] = useState<VoucherTypeCode | "">("")
    const [postingDate, setPostingDate] = useState(today())
    const [physicalWarehouseId, setPhysicalWarehouseId] = useState<number | undefined>()
    const [toPhysicalWarehouseId, setToPhysicalWarehouseId] = useState<number | undefined>()
    const [description, setDescription] = useState("")
    const [lines, setLines] = useState<VoucherLine[]>([createEmptyLine()])

    const title = isTransfer ? "Tạo phiếu chuyển kho" : isInbound ? "Tạo phiếu nhập kho" : "Tạo phiếu xuất kho"
    const Icon = isTransfer ? ArrowLeftRight : isInbound ? ArrowDownLeft : ArrowUpRight
    const warehouseLabel = isTransfer ? "Địa điểm kho xuất" : "Địa điểm kho"
    const warehousePlaceholder = isTransfer ? "Chọn địa điểm kho xuất" : "Chọn địa điểm kho"
    const descriptionLabel = isTransfer ? "Diễn giải" : "Ghi chú"
    const descriptionPlaceholder = isTransfer ? "Diễn giải phiếu chuyển kho" : "Ghi chú chung của phiếu"
    const itemListTitle = isTransfer ? "Danh sách hàng chuyển" : "Danh sách sản phẩm"
    const productColumnLabel = isTransfer ? "Hàng hóa" : "Sản phẩm"
    const selectedVoucherType = useMemo(
        () => selectableVoucherTypes.find((type) => type.code === voucherType),
        [selectableVoucherTypes, voucherType],
    )
    useEffect(() => {
        if (!open) return
        setVoucherType(isTransfer ? "TRANSFER_EXPORT" : "")
        setToPhysicalWarehouseId(undefined)
    }, [mode, open])

    useEffect(() => {
        if (!open || isTransfer || voucherType || !selectableVoucherTypes.length) return
        setVoucherType(selectableVoucherTypes[0].code as VoucherTypeCode)
    }, [isTransfer, open, selectableVoucherTypes, voucherType])

    useEffect(() => {
        if (!open || !selectedVoucherType) return
        setLines((current) => current.map((line) => ({
            ...line,
            ...resolveLineAccounts(line, selectedVoucherType),
        })))
    }, [open, selectedVoucherType?.code])

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = buildPayload()
            let voucher
            try {
                voucher = await createVoucher(payload)
            } catch (error: any) {
                console.error("[inventory voucher] create draft failed", { payload, error })
                throw error
            }

            try {
                await postVoucher(voucher.id)
            } catch (error: any) {
                console.error("[inventory voucher] post voucher failed", { voucher, error })
                throw error
            }
            return voucher
        },
        onSuccess: async () => {
            toast.success(isTransfer ? "Đã tạo phiếu chuyển kho" : isInbound ? "Đã tạo phiếu nhập kho" : "Đã tạo phiếu xuất kho")
            await queryClient.invalidateQueries({ queryKey: ["inventory-ledger-report"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
            onOpenChange(false)
            resetForm()
        },
        onError: (error: any) => {
            toast.error(extractVoucherError(error) || "Không tạo được phiếu kho")
        },
    })

    const validLines = useMemo(
        () => lines.filter((line) => line.product_id && Number(line.quantity) > 0),
        [lines],
    )

    const updateLine = (id: string, patch: Partial<VoucherLine>) => {
        setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)))
    }

    const resolveDefaultWarehouseForPhysical = async (defaultWarehouseId?: number, selectedPhysicalWarehouseId?: number) => {
        if (!defaultWarehouseId || !selectedPhysicalWarehouseId) return undefined
        try {
            const warehouse = await getWarehouse(defaultWarehouseId)
            return Number(warehouse?.physical_warehouse_id) === Number(selectedPhysicalWarehouseId)
                ? defaultWarehouseId
                : undefined
        } catch {
            return undefined
        }
    }

    const handleProductChange = async (line: VoucherLine, option: any) => {
        const defaultWarehouseId = option?.raw?.default_warehouse_id
            ? Number(option.raw.default_warehouse_id)
            : undefined
        const nextLine: Partial<VoucherLine> = {
            product_id: option?.value || undefined,
            warehouse_id: undefined,
            lot_id: undefined,
            lot_code: "",
            unit: option?.raw?.unit || undefined,
            product_inventory_account: option?.raw?.inventory_account_code || undefined,
        }

        const matchedWarehouseId = await resolveDefaultWarehouseForPhysical(defaultWarehouseId, physicalWarehouseId)
        if (matchedWarehouseId) {
            nextLine.warehouse_id = matchedWarehouseId
        }

        const accountLine = {
            ...line,
            ...nextLine,
        }
        updateLine(line.id, {
            ...nextLine,
            ...(selectedVoucherType ? resolveLineAccounts(accountLine, selectedVoucherType) : {}),
        })
    }

    const addLine = () => setLines((current) => [...current, createEmptyLine()])

    const removeLine = (id: string) => {
        setLines((current) => (current.length <= 1 ? current : current.filter((line) => line.id !== id)))
    }

    const resetForm = () => {
        setVoucherType((selectableVoucherTypes[0]?.code as VoucherTypeCode) || "")
        setPostingDate(today())
        setPhysicalWarehouseId(undefined)
        setToPhysicalWarehouseId(undefined)
        setDescription("")
        setLines([createEmptyLine()])
    }

    const buildPayload = (): CreateVoucherRequest => {
        if (!physicalWarehouseId) {
            throw new Error(isTransfer ? "Chọn địa điểm kho xuất" : "Chọn địa điểm kho")
        }
        if (isTransfer && !toPhysicalWarehouseId) {
            throw new Error("Chọn địa điểm kho nhập")
        }
        if (!postingDate) {
            throw new Error("Chọn ngày chứng từ")
        }
        if (!isTransfer && !voucherType) {
            throw new Error("Chọn loại chứng từ")
        }
        if (!validLines.length) {
            throw new Error("Thêm ít nhất 1 dòng sản phẩm có số lượng")
        }
        const invalidWarehouseLine = validLines.find((line) => !line.warehouse_id)
        if (invalidWarehouseLine) {
            throw new Error(isTransfer ? "Chọn kho xuất cho từng dòng hàng" : "Chọn kho cho từng dòng hàng")
        }
        if (isTransfer) {
            const invalidToWarehouseLine = validLines.find((line) => !line.to_warehouse_id)
            if (invalidToWarehouseLine) {
                throw new Error("Chọn kho nhập cho từng dòng hàng")
            }
            const duplicatedWarehouseLine = validLines.find((line) => line.warehouse_id && line.warehouse_id === line.to_warehouse_id)
            if (duplicatedWarehouseLine) {
                throw new Error("Kho xuất và kho nhập trên dòng hàng không được trùng nhau")
            }
        }

        return {
            voucher_type_code: isTransfer ? "TRANSFER_EXPORT" : voucherType,
            posting_date: postingDate,
            document_date: postingDate,
            physical_warehouse_id: !isTransfer ? physicalWarehouseId : undefined,
            from_physical_warehouse_id: isTransfer ? physicalWarehouseId : undefined,
            to_physical_warehouse_id: isTransfer ? toPhysicalWarehouseId : undefined,
            description: description.trim() || undefined,
            source_type: isTransfer ? "TRANSFER_EXPORT" : voucherType,
            items: validLines.map((line, index) => {
                const quantity = Number(line.quantity)
                const unitPrice = isTransfer ? 0 : Number(line.unit_price || 0)

                return {
                    line_no: index + 1,
                    product_id: Number(line.product_id),
                    warehouse_id: Number(line.warehouse_id),
                    to_warehouse_id: isTransfer && line.to_warehouse_id ? Number(line.to_warehouse_id) : undefined,
                    lot_id: !isInbound && line.lot_id ? Number(line.lot_id) : undefined,
                    quantity,
                    unit: line.unit,
                    unit_price: unitPrice,
                    amount: quantity * unitPrice,
                    lot_code: line.lot_code.trim() ? line.lot_code.trim() : undefined,
                    expiry_date: isInbound && line.expiry_date ? line.expiry_date : undefined,
                    tk_no: line.tk_no.trim() ? line.tk_no.trim() : undefined,
                    tk_co: line.tk_co.trim() ? line.tk_co.trim() : undefined,
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
            <DialogContent
                className="flex max-h-[92vh] flex-col overflow-hidden"
                style={{ width: "calc(100vw - 24px)", maxWidth: "calc(100vw - 24px)" }}
            >
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", isTransfer ? "text-blue-600" : isInbound ? "text-emerald-600" : "text-rose-600")} />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                    <div className="grid gap-3 xl:grid-cols-[minmax(320px,1fr)_minmax(360px,1.2fr)_minmax(360px,1.2fr)]">
                        {!isTransfer ? (
                            <div className="min-w-0 space-y-1.5">
                                <Label>Loại chứng từ</Label>
                                <Select value={voucherType} onValueChange={(value) => setVoucherType(value as VoucherTypeCode)}>
                                    <SelectTrigger className="w-full min-w-0">
                                        <SelectValue placeholder={isLoadingTypes ? "Đang tải..." : "Chọn loại chứng từ"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectableVoucherTypes.map((type) => (
                                            <SelectItem key={type.code} value={type.code}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <div className={cn("min-w-0 space-y-1.5", isTransfer ? "xl:col-span-1" : "")}>
                            <Label>Ngày chứng từ</Label>
                            <Input type="date" value={postingDate} onChange={(event) => setPostingDate(event.target.value)} />
                        </div>

                        <div className="min-w-0 space-y-1.5">
                            <Label>{warehouseLabel}</Label>
                            <AsyncSelect
                                value={physicalWarehouseId}
                                onChange={(value: any) => {
                                    setPhysicalWarehouseId(value || undefined)
                                    setLines((current) => current.map((line) => ({
                                        ...line,
                                        warehouse_id: undefined,
                                        lot_id: undefined,
                                        lot_code: "",
                                    })))
                                }}
                                placeholder={warehousePlaceholder}
                                dataSource={{
                                    getList: listPhysicalWarehouses,
                                    getById: getPhysicalWarehouse,
                                    params: { page: 1, size: 20, status: "ACTIVE" },
                                }}
                                mapOption={(physicalWarehouse: any) => ({
                                    value: physicalWarehouse.id,
                                    label: physicalWarehouse.name,
                                    raw: physicalWarehouse,
                                })}
                            />
                        </div>

                        {isTransfer ? (
                            <div className="min-w-0 space-y-1.5">
                                <Label>Địa điểm kho nhập</Label>
                                <AsyncSelect
                                    value={toPhysicalWarehouseId}
                                    onChange={(value: any) => {
                                        setToPhysicalWarehouseId(value || undefined)
                                        setLines((current) => current.map((line) => ({
                                            ...line,
                                            to_warehouse_id: undefined,
                                        })))
                                    }}
                                    placeholder="Chọn địa điểm kho nhập"
                                    dataSource={{
                                        getList: listPhysicalWarehouses,
                                        getById: getPhysicalWarehouse,
                                        params: { page: 1, size: 20, status: "ACTIVE" },
                                    }}
                                    mapOption={(physicalWarehouse: any) => ({
                                        value: physicalWarehouse.id,
                                        label: physicalWarehouse.name,
                                        raw: physicalWarehouse,
                                    })}
                                />
                            </div>
                        ) : null}

                        <div className="space-y-1.5 xl:col-span-3">
                            <Label>{descriptionLabel}</Label>
                            <Textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder={descriptionPlaceholder}
                                className="min-h-16"
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-md border">
                        <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-2">
                            <div className="font-semibold">{itemListTitle}</div>
                            <Button type="button" size="sm" variant="outline" onClick={addLine}>
                                <Plus className="mr-1 h-4 w-4" />
                                Thêm dòng
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1880px] text-sm">
                                <thead className="text-muted-foreground bg-muted/30 border-b text-xs">
                                    <tr>
                                        <th className="w-12 px-3 py-2 text-center">STT</th>
                                        <th className="min-w-[420px] px-3 py-2 text-left">{productColumnLabel}</th>
                                        <th className="w-64 px-3 py-2 text-left">{isTransfer ? "Kho xuất" : "Kho"}</th>
                                        {isTransfer ? <th className="w-64 px-3 py-2 text-left">Kho nhập</th> : null}
                                        <th className="w-20 px-3 py-2 text-left">ĐVT</th>
                                        <th className="w-32 px-3 py-2 text-left">TK Nợ</th>
                                        <th className="w-32 px-3 py-2 text-left">TK Có</th>
                                        <th className="w-32 px-3 py-2 text-right">Số lượng</th>
                                        {!isInbound ? <th className="w-52 px-3 py-2 text-left">Lô xuất</th> : null}
                                        {isInbound ? <th className="w-36 px-3 py-2 text-left">Số lô</th> : null}
                                        {isInbound ? <th className="w-36 px-3 py-2 text-left">HSD</th> : null}
                                        {!isTransfer ? <th className="w-36 px-3 py-2 text-right">Đơn giá</th> : null}
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
                                                    onChange={(_value: any, option: any) => void handleProductChange(line, option)}
                                                    placeholder={isTransfer ? "Chọn hàng chuyển" : "Chọn sản phẩm"}
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
                                            <td className="px-3 py-2">
                                                <AsyncSelect
                                                    key={`warehouse-${line.id}-${physicalWarehouseId || "none"}`}
                                                    value={line.warehouse_id}
                                                    disabled={!physicalWarehouseId}
                                                    onChange={(value: any) => updateLine(line.id, {
                                                        warehouse_id: value || undefined,
                                                        lot_id: undefined,
                                                        lot_code: "",
                                                    })}
                                                    placeholder={physicalWarehouseId ? (isTransfer ? "Chọn kho xuất" : "Chọn kho") : "Chọn địa điểm kho trước"}
                                                    dataSource={{
                                                        getList: listWarehouses,
                                                        getById: getWarehouse,
                                                        params: { page: 1, size: 20, status: "ACTIVE", physical_warehouse_id: physicalWarehouseId },
                                                    }}
                                                    mapOption={(warehouse: any) => ({
                                                        value: warehouse.id,
                                                        label: warehouse.name,
                                                        raw: warehouse,
                                                    })}
                                                />
                                            </td>
                                            {isTransfer ? (
                                                <td className="px-3 py-2">
                                                    <AsyncSelect
                                                        key={`to-warehouse-${line.id}-${toPhysicalWarehouseId || "none"}`}
                                                        value={line.to_warehouse_id}
                                                        disabled={!toPhysicalWarehouseId}
                                                        onChange={(value: any) => updateLine(line.id, { to_warehouse_id: value || undefined })}
                                                        placeholder={toPhysicalWarehouseId ? "Chọn kho nhập" : "Chọn địa điểm kho nhập trước"}
                                                        dataSource={{
                                                            getList: listWarehouses,
                                                            getById: getWarehouse,
                                                            params: { page: 1, size: 20, status: "ACTIVE", physical_warehouse_id: toPhysicalWarehouseId },
                                                        }}
                                                        mapOption={(warehouse: any) => ({
                                                            value: warehouse.id,
                                                            label: warehouse.name,
                                                            raw: warehouse,
                                                        })}
                                                    />
                                                </td>
                                            ) : null}
                                            <td className="text-muted-foreground px-3 py-2">
                                                {line.unit || "-"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input
                                                    value={line.tk_no}
                                                    onChange={(event) => updateLine(line.id, { tk_no: event.target.value })}
                                                    placeholder={selectedVoucherType?.tk_no === PRODUCT_ACCOUNT_MARKER ? "Theo sản phẩm" : "TK Nợ"}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input
                                                    value={line.tk_co}
                                                    onChange={(event) => updateLine(line.id, { tk_co: event.target.value })}
                                                    placeholder={selectedVoucherType?.tk_co === PRODUCT_ACCOUNT_MARKER ? "Theo sản phẩm" : "TK Có"}
                                                />
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
                                            {!isInbound ? (
                                                <td className="px-3 py-2">
                                                    <PreferredLotButton
                                                        value={line.lot_code}
                                                        disabled={!line.product_id || !line.warehouse_id}
                                                        onChange={(lotNo) => updateLine(line.id, { lot_code: lotNo, lot_id: undefined })}
                                                    />
                                                </td>
                                            ) : null}
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
                                            {!isTransfer ? (
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
                                            ) : null}
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

function extractVoucherError(error: any) {
    const message = String(error?.message || "")
    const jsonStart = message.indexOf("{")
    if (jsonStart >= 0) {
        try {
            const parsed = JSON.parse(message.slice(jsonStart))
            return parsed?.msg || parsed?.message || null
        } catch {
            return null
        }
    }
    return message && message !== "Failed to fetch" ? message : null
}

function PreferredLotButton({
    value,
    disabled,
    onChange,
}: {
    value?: string
    disabled?: boolean
    onChange: (lotNo: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState(value || "")

    useEffect(() => {
        if (open) {
            setDraft(value || "")
        }
    }, [open, value])

    const save = () => {
        onChange(draft.trim())
        setOpen(false)
    }

    const resetAuto = () => {
        onChange("")
        setOpen(false)
    }

    return (
        <>
            <Button
                type="button"
                size="sm"
                variant={value ? "secondary" : "outline"}
                disabled={disabled}
                className="w-full justify-start"
                onClick={() => setOpen(true)}
            >
                <Settings2 className="mr-2 h-4 w-4" />
                {value || "Auto"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>Lô xuất ưu tiên</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Số lô xuất ưu tiên</Label>
                        <Input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="Bỏ trống để Auto FIFO"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="button" variant="outline" onClick={resetAuto}>
                            Auto
                        </Button>
                        <Button type="button" onClick={save}>
                            Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

