import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { listAppLookups } from "@/api/app-lookup"
import { createAndPostVoucher, listVoucherTypes, type CreateVoucherRequest, type InventoryVoucherType, type VoucherTypeCode } from "@/api/inventory/voucher"
import { listInventoryLotRecords } from "@/api/inventory/lot"
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

type VoucherMode = "in" | "out" | "transfer" | "repack" | "conversion"

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
    direction?: "I" | "O"
    item_role?: "SOURCE" | "TARGET" | "PACKAGING"
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

function createEmptyLine(direction?: "I" | "O", itemRole?: VoucherLine["item_role"]): VoucherLine {
    return {
        id: createId(),
        quantity: "",
        unit_price: "",
        lot_code: "",
        expiry_date: "",
        tk_no: "",
        tk_co: "",
        note: "",
        direction,
        item_role: itemRole || (direction === "I" ? "TARGET" : direction === "O" ? "SOURCE" : undefined),
    }
}

function createPairedLines(): VoucherLine[] {
    return [createEmptyLine("O", "SOURCE"), createEmptyLine("I", "TARGET")]
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
    const isPaired = mode === "repack" || mode === "conversion"
    const { data: voucherTypes = [], isLoading: isLoadingTypes } = useQuery({
        queryKey: ["inventory-voucher-types", isInbound || isPaired ? "I" : "O", mode],
        queryFn: () => listVoucherTypes(isInbound || isPaired ? "I" : "O", 1, 1),
        enabled: open,
    })
    const selectableVoucherTypes = useMemo(
        () => voucherTypes.filter((type) => {
            if (isTransfer) return type.code === "TRANSFER_EXPORT"
            if (isPaired) return type.code === "OTHER_INBOUND"
            return mode !== "out" || type.code !== "TRANSFER_EXPORT"
        }),
        [isPaired, isTransfer, mode, voucherTypes],
    )
    const [voucherType, setVoucherType] = useState<VoucherTypeCode | "">("")
    const [operationCode, setOperationCode] = useState("")
    const [postingDate, setPostingDate] = useState(today())
    const [physicalWarehouseId, setPhysicalWarehouseId] = useState<number | undefined>()
    const [toPhysicalWarehouseId, setToPhysicalWarehouseId] = useState<number | undefined>()
    const [description, setDescription] = useState("")
    const [lines, setLines] = useState<VoucherLine[]>(isPaired ? createPairedLines() : [createEmptyLine()])

    const title = mode === "repack" ? "Tạo phiếu sang bao" : mode === "conversion" ? "Tạo phiếu chuyển mã" : isTransfer ? "Tạo phiếu chuyển kho" : isInbound ? "Tạo phiếu nhập kho" : "Tạo phiếu xuất kho"
    const Icon = isTransfer ? ArrowLeftRight : isInbound ? ArrowDownLeft : ArrowUpRight
    const warehouseLabel = isTransfer ? "Địa điểm kho xuất" : "Địa điểm kho"
    const warehousePlaceholder = isTransfer ? "Chọn địa điểm kho xuất" : "Chọn địa điểm kho"
    const descriptionLabel = isTransfer ? "Diễn giải" : "Ghi chú"
    const descriptionPlaceholder = mode === "repack" ? "Diễn giải nghiệp vụ sang bao" : mode === "conversion" ? "Diễn giải nghiệp vụ chuyển mã" : isTransfer ? "Diễn giải phiếu chuyển kho" : "Ghi chú chung của phiếu"
    const itemListTitle = mode === "repack" ? "Hàng nguồn, bao bì và thành phẩm đầu ra" : mode === "conversion" ? "Mã nguồn và mã đích" : isTransfer ? "Danh sách hàng chuyển" : "Danh sách sản phẩm"
    const productColumnLabel = isTransfer ? "Hàng hóa" : "Sản phẩm"
    const selectedVoucherType = useMemo(
        () => selectableVoucherTypes.find((type) => type.code === voucherType),
        [selectableVoucherTypes, voucherType],
    )
    const operationLookupType = isPaired ? "" : voucherType === "OTHER_INBOUND"
        ? "INVENTORY_OTHER_IN_OPERATION"
        : voucherType === "OTHER_EXPORT"
            ? "INVENTORY_OTHER_OUT_OPERATION"
            : ""
    const operationQuery = useQuery({
        queryKey: ["inventory-voucher-operations", operationLookupType],
        queryFn: () => listAppLookups({
            page: 1,
            size: 100,
            type_code: operationLookupType,
            status: "ACTIVE",
        }),
        enabled: open && Boolean(operationLookupType),
    })
    const operationOptions = operationQuery.data?.items ?? []
    useEffect(() => {
        if (!open) return
        setVoucherType(isTransfer ? "TRANSFER_EXPORT" : isPaired ? "OTHER_INBOUND" : "")
        setOperationCode(isPaired ? (mode === "repack" ? "REPACK" : "PRODUCT_CONVERSION") : "")
        setToPhysicalWarehouseId(undefined)
        setLines(isPaired ? createPairedLines() : [createEmptyLine()])
    }, [isPaired, isTransfer, mode, open])

    useEffect(() => {
        if (!open || isTransfer || isPaired || voucherType || !selectableVoucherTypes.length) return
        setVoucherType(selectableVoucherTypes[0].code as VoucherTypeCode)
    }, [isPaired, isTransfer, open, selectableVoucherTypes, voucherType])

    useEffect(() => {
        if (!operationLookupType) {
            setOperationCode("")
            return
        }
        if (!operationOptions.length) return
        setOperationCode((current) => operationOptions.some((item) => item.code === current)
            ? current
            : operationOptions.find((item) => item.code === "GENERAL")?.code || operationOptions[0].code)
    }, [operationLookupType, operationOptions])

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
            try {
                return await createAndPostVoucher(payload)
            } catch (error: any) {
                console.error("[inventory voucher] create and post failed", { payload, error })
                throw error
            }
        },
        onSuccess: async () => {
            toast.success(isPaired ? `Đã tạo phiếu ${mode === "repack" ? "sang bao" : "chuyển mã"}` : isTransfer ? "Đã tạo phiếu chuyển kho" : isInbound ? "Đã tạo phiếu nhập kho" : "Đã tạo phiếu xuất kho")
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

    const addLine = (direction?: "I" | "O", itemRole?: VoucherLine["item_role"]) => {
        setLines((current) => [...current, createEmptyLine(direction, itemRole)])
    }

    const removeLine = (id: string) => {
        setLines((current) => current.some((line) => line.id === id && line.direction === "I")
            ? current
            : current.filter((line) => line.id !== id))
    }

    const resetForm = () => {
        setVoucherType((selectableVoucherTypes[0]?.code as VoucherTypeCode) || "")
        setOperationCode(isPaired ? (mode === "repack" ? "REPACK" : "PRODUCT_CONVERSION") : "")
        setPostingDate(today())
        setPhysicalWarehouseId(undefined)
        setToPhysicalWarehouseId(undefined)
        setDescription("")
        setLines(isPaired ? createPairedLines() : [createEmptyLine()])
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
        if (operationLookupType && !operationCode) {
            throw new Error("Chọn nghiệp vụ nhập/xuất kho khác")
        }
        if (!validLines.length) {
            throw new Error("Thêm ít nhất 1 dòng sản phẩm có số lượng")
        }
        const partialLine = lines.find((line) => Boolean(line.product_id) !== (Number(line.quantity) > 0))
        if (partialLine) {
            throw new Error("Mỗi dòng phải có đủ sản phẩm và số lượng lớn hơn 0")
        }
        if (isPaired) {
            const sourceLines = validLines.filter((line) => line.direction === "O")
            const targetLines = validLines.filter((line) => line.direction === "I")
            if (!sourceLines.length) {
                throw new Error(mode === "repack" ? "Sang bao phải có ít nhất một hàng nguồn" : "Chuyển mã phải có ít nhất một mã nguồn")
            }
            if (targetLines.length !== 1) {
                throw new Error(mode === "repack" ? "Sang bao chỉ được có một thành phẩm đầu ra" : "Chuyển mã chỉ được có một mã đích")
            }
            if (mode === "conversion") {
                const sourceQuantity = sourceLines.reduce((sum, line) => sum + Number(line.quantity), 0)
                const targetQuantity = targetLines.reduce((sum, line) => sum + Number(line.quantity), 0)
                if (Math.abs(sourceQuantity - targetQuantity) > 0.0005) {
                    throw new Error("Chuyển mã phải giữ nguyên tổng số lượng xuất và nhập")
                }
                if (sourceLines.some((line) => line.product_id === targetLines[0].product_id)) {
                    throw new Error("Mã đích phải khác mã nguồn")
                }
            } else if (!sourceLines.some((line) => line.item_role === "SOURCE")) {
                throw new Error("Sang bao phải có ít nhất một dòng Hàng nguồn; các dòng còn lại có thể là Bao bì")
            }
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
            operation_code: isPaired ? (mode === "repack" ? "REPACK" : "PRODUCT_CONVERSION") : operationLookupType ? operationCode : undefined,
            posting_date: postingDate,
            document_date: postingDate,
            physical_warehouse_id: !isTransfer ? physicalWarehouseId : undefined,
            from_physical_warehouse_id: isTransfer ? physicalWarehouseId : undefined,
            to_physical_warehouse_id: isTransfer ? toPhysicalWarehouseId : undefined,
            description: description.trim() || undefined,
            source_type: isPaired ? (mode === "repack" ? "REPACK" : "PRODUCT_CONVERSION") : isTransfer ? "TRANSFER_EXPORT" : voucherType,
            items: validLines.map((line, index) => {
                const quantity = Number(line.quantity)
                const lineInbound = isPaired ? line.direction === "I" : isInbound
                const unitPrice = isTransfer || isPaired ? 0 : Number(line.unit_price || 0)

                return {
                    line_no: index + 1,
                    direction: isPaired ? line.direction : undefined,
                    item_role: isPaired ? line.item_role : undefined,
                    movement_group: isPaired ? "MAIN" : undefined,
                    product_id: Number(line.product_id),
                    warehouse_id: Number(line.warehouse_id),
                    to_warehouse_id: isTransfer && line.to_warehouse_id ? Number(line.to_warehouse_id) : undefined,
                    lot_id: !lineInbound && line.lot_id ? Number(line.lot_id) : undefined,
                    quantity,
                    unit: line.unit,
                    unit_price: unitPrice,
                    amount: quantity * unitPrice,
                    lot_code: line.lot_code.trim() ? line.lot_code.trim() : undefined,
                    expiry_date: lineInbound && line.expiry_date ? line.expiry_date : undefined,
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
                    <div className="grid gap-3 xl:grid-cols-4">
                        {!isTransfer && !isPaired ? (
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

                        {operationLookupType ? (
                            <div className="min-w-0 space-y-1.5">
                                <Label>Nghiệp vụ</Label>
                                <Select value={operationCode} onValueChange={setOperationCode}>
                                    <SelectTrigger className="w-full min-w-0">
                                        <SelectValue placeholder={operationQuery.isLoading ? "Đang tải..." : "Chọn nghiệp vụ"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {operationOptions.map((item) => (
                                            <SelectItem key={item.code} value={item.code}>
                                                {item.name}
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

                        <div className="space-y-1.5 xl:col-span-4">
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
                            {isPaired ? (
                                <div className="flex items-center gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => addLine("O", "SOURCE")}>
                                        <ArrowUpRight className="mr-1 h-4 w-4 text-rose-600" />
                                        {mode === "repack" ? "Thêm hàng nguồn / bao bì" : "Thêm mã nguồn"}
                                    </Button>
                                </div>
                            ) : (
                                <Button type="button" size="sm" variant="outline" onClick={() => addLine()}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Thêm dòng
                                </Button>
                            )}
                        </div>
                        {isPaired ? (
                            <div className="text-muted-foreground border-b bg-slate-50 px-3 py-2 text-xs">
                                {mode === "repack"
                                    ? "Chỉ có một thành phẩm đầu ra. Giá trị thành phẩm bằng tổng giá trị hàng nguồn và bao bì đã xuất."
                                    : "Chỉ có một mã đích. Tổng số lượng mã nguồn phải bằng số lượng mã đích; giá trị mã đích được dẫn từ các dòng xuất."}
                            </div>
                        ) : null}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[2020px] text-sm">
                                <thead className="text-muted-foreground bg-muted/30 border-b text-xs">
                                    <tr>
                                        <th className="w-12 px-3 py-2 text-center">STT</th>
                                        {isPaired ? <th className="w-32 px-3 py-2 text-left">Vai trò</th> : null}
                                        <th className="min-w-[560px] px-3 py-2 text-left">{productColumnLabel}</th>
                                        <th className="w-64 px-3 py-2 text-left">{isTransfer ? "Kho xuất" : "Kho"}</th>
                                        {isTransfer ? <th className="w-64 px-3 py-2 text-left">Kho nhập</th> : null}
                                        <th className="w-20 px-3 py-2 text-left">ĐVT</th>
                                        <th className="w-32 px-3 py-2 text-left">TK Nợ</th>
                                        <th className="w-32 px-3 py-2 text-left">TK Có</th>
                                        <th className="w-32 px-3 py-2 text-right">Số lượng</th>
                                        {isPaired ? <th className="w-52 px-3 py-2 text-left">Số lô</th> : !isInbound ? <th className="w-52 px-3 py-2 text-left">Lô xuất</th> : null}
                                        {!isPaired && isInbound ? <th className="w-36 px-3 py-2 text-left">Số lô</th> : null}
                                        {isInbound || isPaired ? <th className="w-36 px-3 py-2 text-left">HSD</th> : null}
                                        {!isTransfer && !isPaired ? <th className="w-36 px-3 py-2 text-right">Đơn giá</th> : null}
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
                                            {isPaired ? (
                                                <td className="px-3 py-2">
                                                    {mode === "repack" && line.direction === "O" ? (
                                                        <Select
                                                            value={line.item_role || "SOURCE"}
                                                            onValueChange={(value) => updateLine(line.id, { item_role: value as VoucherLine["item_role"] })}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="SOURCE">Hàng nguồn</SelectItem>
                                                                <SelectItem value="PACKAGING">Bao bì</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className={cn(
                                                            "inline-flex rounded px-2 py-1 text-xs font-medium",
                                                            line.direction === "O" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
                                                        )}>
                                                            {line.direction === "O"
                                                                ? "Mã nguồn"
                                                                : mode === "repack" ? "Thành phẩm đầu ra" : "Mã đích"}
                                                        </span>
                                                    )}
                                                </td>
                                            ) : null}
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
                                            {(!isInbound && (!isPaired || line.direction === "O")) ? (
                                                <td className="px-3 py-2">
                                                    <PreferredLotSelector
                                                        productId={line.product_id}
                                                        warehouseId={line.warehouse_id}
                                                        lotId={line.lot_id}
                                                        lotCode={line.lot_code}
                                                        disabled={!line.product_id || !line.warehouse_id}
                                                        onChange={(lotNo, lotId) => updateLine(line.id, { lot_code: lotNo || "", lot_id: lotId })}
                                                    />
                                                </td>
                                            ) : null}
                                            {(isInbound || (isPaired && line.direction === "I")) ? (
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={line.lot_code}
                                                        onChange={(event) => updateLine(line.id, { lot_code: event.target.value })}
                                                        placeholder="Tự sinh nếu trống"
                                                    />
                                                </td>
                                            ) : null}
                                            {(isInbound || isPaired) ? (
                                                <td className="px-3 py-2">
                                                    {!isPaired || line.direction === "I" ? (
                                                        <Input
                                                            type="date"
                                                            value={line.expiry_date}
                                                            onChange={(event) => updateLine(line.id, { expiry_date: event.target.value })}
                                                        />
                                                    ) : null}
                                                </td>
                                            ) : null}
                                            {!isTransfer && !isPaired ? (
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
                                                    disabled={line.direction === "I" || lines.filter((row) => row.direction === "O").length <= 1}
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

function PreferredLotSelector({
    productId,
    warehouseId,
    lotId,
    lotCode,
    disabled,
    onChange,
}: {
    productId?: number
    warehouseId?: number
    lotId?: number
    lotCode?: string
    disabled?: boolean
    onChange: (lotNo?: string, lotId?: number) => void
}) {
    const { data, isLoading } = useQuery({
        queryKey: ["inventory-voucher-lots", productId, warehouseId],
        enabled: Boolean(productId && warehouseId && !disabled),
        queryFn: () =>
            listInventoryLotRecords({
                page: 1,
                size: 50,
                product_id: Number(productId),
                warehouse_id: Number(warehouseId),
                only_remaining: true,
            }),
        staleTime: 30_000,
    })
    const lots = getPagedItems(data)
    const selected = lotId ? `LOT:${lotId}` : lotCode ? `CODE:${lotCode}` : "AUTO"
    const selectedLotInOptions = lotId
        ? lots.some((lot: any) => Number(lot.id) === Number(lotId))
        : false

    return (
        <Select
            value={selected}
            disabled={disabled}
            onValueChange={(value) => {
                if (value === "AUTO") {
                    onChange(undefined, undefined)
                    return
                }
                if (value.startsWith("LOT:")) {
                    const nextLotId = Number(value.slice(4))
                    const lot = lots.find((item: any) => Number(item.id) === nextLotId)
                    onChange(lot?.lot_no ? String(lot.lot_no) : undefined, nextLotId)
                    return
                }
                if (value.startsWith("CODE:")) {
                    onChange(value.slice(5), undefined)
                }
            }}
        >
            <SelectTrigger className="h-9 min-w-[190px]">
                <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="AUTO">
                    <span className="inline-flex items-center gap-1.5">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Auto
                    </span>
                </SelectItem>
                {isLoading ? <SelectItem value="LOADING" disabled>Đang tải...</SelectItem> : null}
                {lotCode && !lotId ? <SelectItem value={`CODE:${lotCode}`}>{lotCode}</SelectItem> : null}
                {lotId && !selectedLotInOptions && lotCode ? <SelectItem value={`LOT:${lotId}`}>{lotCode}</SelectItem> : null}
                {lots.map((lot: any) => {
                    const nextLotNo = String(lot.lot_no || "")
                    if (!nextLotNo) return null
                    return (
                        <SelectItem key={`${lot.id}-${nextLotNo}`} value={`LOT:${lot.id}`}>
                            {nextLotNo} - còn {formatNumber(resolveLotRemaining(lot))}
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}

function resolveLotRemaining(lot: any) {
    return lot?.quantity_remaining ?? lot?.closing_quantity ?? lot?.total_quantity ?? 0
}

function getPagedItems(data: any) {
    return data?.items ?? data?.data?.items ?? []
}

function formatNumber(value: unknown) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(Number(value || 0))
}

