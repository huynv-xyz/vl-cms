import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ExternalLink, Pencil, Printer } from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import { getVoucherPrintDetail, listVouchers, type InventoryVoucher, type InventoryVoucherPrintDetail } from "@/api/inventory/voucher"
import { getReturn, updateReturnStatus } from "@/api/sale/return"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { WarehouseVoucherPrintDocument, WAREHOUSE_VOUCHER_PRINT_CSS } from "@/features/inventory/voucher/warehouse-voucher-print"
import { useUpdateStatus } from "@/hooks/use-update-status"
import type { Return, ReturnItem } from "../data/schema"
import { ReturnDetailDialog } from "./return-detail-dialog"
import { ReturnRowActions } from "./return-row-actions"
import { ReturnUnitPriceCorrectionDialog } from "./return-unit-price-correction-dialog"
import { RETURN_STATUSES, returnStatusLabel } from "./return-status"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`

export function useReturnColumns() {
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canChangeDoneStatus = permissions.some(
        (p: any) => p.module === "sales.returns" && p.action === "status.after-done"
    )
    const canUpdateReturn = permissions.some(
        (p: any) => p.module === "sales.returns" && p.action === "update"
    )
    const canUpdateReturnStatus = permissions.some(
        (p: any) =>
            p.module === "sales.returns" &&
            (p.action === "status.update" || p.action === "update")
    )
    const canCorrectReturnPrice = permissions.some(
        (p: any) => p.module === "sales.returns" && p.action === "price.change"
    )

    const [priceCorrectionReturn, setPriceCorrectionReturn] = useState<Return | null>(null)

    const mutation = useUpdateStatus<Return>({
        queryKey: ["returns"],
        mutationFn: updateReturnStatus,
        getId: (x) => x.id,
    })

    const columns: ColumnDef<Return>[] = [
        {
            id: "print",
            header: "In phiếu",
            enableSorting: false,
            enableHiding: false,
            size: 76,
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <ReturnPrintButton returnDoc={row.original} />
                </div>
            ),
            meta: {
                thClassName: `w-[76px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[76px] whitespace-nowrap ${centerCell}`,
            },
        },

        buildTextColumn<Return>({
            title: "Đơn hàng / Phiếu xuất bán",
            width: 210,
            className: `w-[210px] ${centerCell}`,
            render: (row) => {
                const orderLabel = row.order?.order_no ?? (row.order_id ? `#${row.order_id}` : "")
                const exportLabel = row.export?.export_no ?? (row.export_id ? `#${row.export_id}` : "")
                if (!orderLabel && !exportLabel) return <span className="text-muted-foreground">-</span>
                return (
                    <div className="min-w-0 text-left">
                        {orderLabel ? (
                            <a
                                href={`/sales/orders/${row.order_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block max-w-full truncate font-mono text-sm font-medium text-primary hover:underline"
                                title={`Đơn hàng ${orderLabel}`}
                                onClick={(event) => event.stopPropagation()}
                            >
                                {orderLabel}
                            </a>
                        ) : (
                            <div className="text-muted-foreground">-</div>
                        )}
                        {exportLabel ? (
                            <a
                                href={`/sales/exports?keyword=${encodeURIComponent(exportLabel)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-0.5 block max-w-full truncate font-mono text-xs text-muted-foreground hover:text-primary hover:underline"
                                title={`Phiếu xuất bán ${exportLabel}`}
                                onClick={(event) => event.stopPropagation()}
                            >
                                Phiếu xuất bán: {exportLabel}
                            </a>
                        ) : (
                            <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                Phiếu xuất bán: -
                            </div>
                        )}
                    </div>
                )
            },
        }),

        buildTextColumn<Return>({
            accessorKey: "return_no",
            title: "Phiếu trả",
            width: 190,
            className: `w-[190px] ${centerCell}`,
            render: (row) => <ReturnDetailButton returnDoc={row} />,
        }),

        buildTextColumn<Return>({
            title: "Phiếu kho",
            width: 180,
            className: `w-[180px] ${centerCell}`,
            render: (row) => <InventoryVoucherCell returnDoc={row} />,
        }),

        buildTextColumn<Return>({
            title: "Ngày trả",
            width: 120,
            className: `w-[120px] whitespace-nowrap ${centerCell}`,
            render: (row) => formatDate(getReturnDocumentDate(row)),
        }),

        buildTextColumn<Return>({
            title: "Giờ trả",
            width: 105,
            className: `w-[105px] whitespace-nowrap ${centerCell}`,
            render: (row) => formatTime(getReturnDocumentTime(row)),
        }),

        buildTextColumn<Return>({
            title: "Khách hàng",
            width: 320,
            className: `w-[320px] ${gridCell}`,
            render: (row) => {
                const customer = row.customer ?? row.order?.customer
                return (
                    <div className="min-w-0">
                        <div className="truncate text-sm font-medium" title={customer?.name || ""}>
                            {customer?.name || "-"}
                        </div>
                        {customer?.code ? (
                            <div className="truncate font-mono text-xs text-muted-foreground">
                                {customer.code}
                            </div>
                        ) : null}
                    </div>
                )
            },
        }),

        buildTextColumn<Return>({
            accessorKey: "reason",
            title: "Lý do",
            width: 300,
            className: `w-[300px] ${gridCell}`,
            render: (row) => (
                <span className="block max-w-full truncate text-sm" title={row.reason || ""}>
                    {row.reason || "-"}
                </span>
            ),
        }),

        {
            accessorKey: "status",
            header: "Trạng thái",
            size: 155,
            minSize: 135,
            cell: ({ row }) => {
                const status = row.original.status
                const canChangeThisStatus =
                    status === "DONE" ? canChangeDoneStatus : canUpdateReturnStatus

                return (
                    <Select
                        value={status}
                        onValueChange={(value) =>
                            mutation.mutate({
                                id: row.original.id,
                                status: value,
                            })
                        }
                        disabled={mutation.isPending || !canChangeThisStatus}
                    >
                        <SelectTrigger className="mx-auto h-8 w-[130px]">
                            <SelectValue>{returnStatusLabel(status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {RETURN_STATUSES.map((s) => (
                                <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    disabled={!canChangeThisStatus}
                                >
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            },
            meta: {
                thClassName: `w-[155px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[155px] whitespace-nowrap ${centerCell}`,
            },
        },

        {
            id: "actions",
            header: "Thao tác",
            enableSorting: false,
            enableHiding: false,
            size: 90,
            cell: ({ row }: { row: Row<Return> }) => (
                <div className="flex items-center justify-center gap-2">
                    {row.original.status === "DONE" ? (
                        canCorrectReturnPrice && isManualDoneWithoutExport(row.original) ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                title="Sửa giá phiếu trả"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setPriceCorrectionReturn(row.original)
                                }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        ) : null
                    ) : (
                        canUpdateReturn ? <ReturnRowActions row={row} /> : null
                    )}
                </div>
            ),
            meta: {
                thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            },
        },
    ]

    return {
        columns,
        dialog: (
            <ReturnUnitPriceCorrectionDialog
                open={!!priceCorrectionReturn}
                returnData={priceCorrectionReturn}
                onOpenChange={(open) => {
                    if (!open) setPriceCorrectionReturn(null)
                }}
            />
        ),
    }
}

function ReturnDetailButton({ returnDoc }: { returnDoc: Return }) {
    const [open, setOpen] = useState(false)
    const label = returnDoc.return_no ?? `#${returnDoc.id}`

    return (
        <>
            <button
                type="button"
                className="block max-w-full truncate font-mono text-sm font-semibold text-primary hover:underline"
                title={label}
                onClick={(event) => {
                    event.stopPropagation()
                    setOpen(true)
                }}
            >
                {label}
            </button>
            <ReturnDetailDialog
                open={open}
                id={returnDoc.id}
                onClose={() => setOpen(false)}
            />
        </>
    )
}

function ReturnPrintButton({ returnDoc }: { returnDoc: Return }) {
    const [voucher, setVoucher] = useState<InventoryVoucherPrintDetail | null>(null)
    const [sourceDocument, setSourceDocument] = useState<Return | null>(null)
    const [printRequested, setPrintRequested] = useState(false)
    const printMutation = useMutation({
        mutationFn: async () => {
            const [voucherId, returnDetail] = await Promise.all([
                resolveInventoryVoucherId(returnDoc),
                getReturn(returnDoc.id),
            ])
            const voucherDetail = voucherId
                ? await getVoucherPrintDetail(voucherId)
                : buildSalesReturnPrintVoucher(returnDetail)
            return { voucherDetail, returnDetail }
        },
        onSuccess: ({ voucherDetail, returnDetail }) => {
            setVoucher(voucherDetail)
            setSourceDocument(returnDetail)
            setPrintRequested(true)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không tải được phiếu in")
        },
    })

    useEffect(() => {
        if (!voucher) return
        const clearPrintData = () => {
            setVoucher(null)
            setSourceDocument(null)
            setPrintRequested(false)
        }
        window.addEventListener("afterprint", clearPrintData, { once: true })
        const timer = window.setTimeout(() => {
            clearPrintData()
        }, 30_000)
        return () => {
            window.removeEventListener("afterprint", clearPrintData)
            window.clearTimeout(timer)
        }
    }, [voucher])

    useEffect(() => {
        if (!printRequested || !voucher || !sourceDocument) return
        const frame = window.requestAnimationFrame(() => {
            window.setTimeout(() => window.print(), 150)
        })
        return () => window.cancelAnimationFrame(frame)
    }, [printRequested, sourceDocument, voucher])

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label="In phiếu"
                        disabled={printMutation.isPending}
                        onClick={(event) => {
                            event.stopPropagation()
                            printMutation.mutate()
                        }}
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>In phiếu</TooltipContent>
            </Tooltip>
            <style>{WAREHOUSE_VOUCHER_PRINT_CSS}</style>
            {voucher ? createPortal(
                <div id="warehouse-voucher-print" className="hidden">
                    <WarehouseVoucherPrintDocument voucher={voucher} sourceDocument={sourceDocument ?? undefined} />
                </div>,
                document.body,
            ) : null}
        </>
    )
}

function InventoryVoucherCell({ returnDoc }: { returnDoc: Return }) {
    const fallbackQuery = useQuery({
        queryKey: ["sales-return-inventory-voucher", returnDoc.id, returnDoc.return_no],
        queryFn: () => findInventoryVoucherForReturn(returnDoc),
        enabled: !(returnDoc as any).inventory_voucher?.voucher_no && !!returnDoc.return_no,
        staleTime: 30_000,
    })
    const voucher = (returnDoc as any).inventory_voucher?.voucher_no
        ? (returnDoc as any).inventory_voucher as InventoryVoucher
        : fallbackQuery.data

    if (fallbackQuery.isLoading) {
        return <span className="text-muted-foreground">Đang tải...</span>
    }
    if (!voucher?.voucher_no) {
        return <span className="text-muted-foreground">-</span>
    }

    return (
        <a
            href={`/inventory/vouchers?keyword=${encodeURIComponent(voucher.voucher_no)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center justify-center gap-1 font-mono text-sm font-medium text-primary hover:underline"
            title={voucher.voucher_no}
            onClick={(event) => event.stopPropagation()}
        >
            <span className="truncate">{voucher.voucher_no}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
    )
}

function isManualDoneWithoutExport(row: Return) {
    return row.status === "DONE" && row.return_type === "MANUAL" && !row.export_id
}

function formatDate(value?: string | number[] | null) {
    const parts = parseDateParts(value)
    return parts ? `${parts.day}/${parts.month}/${parts.year}` : "-"
}

function formatTime(value?: string | number[] | null) {
    if (!value) return "-"
    if (Array.isArray(value)) {
        const hour = value[3]
        const minute = value[4]
        const second = value[5]
        if (hour == null || minute == null) return "-"
        const text = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
        return second == null ? text : `${text}:${String(second).padStart(2, "0")}`
    }
    const text = String(value)
    const timeMatch = text.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?/)
        ?? text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!timeMatch) return "-"
    const hour = timeMatch[1].padStart(2, "0")
    const minute = timeMatch[2].padStart(2, "0")
    const second = timeMatch[3]?.padStart(2, "0")
    return second ? `${hour}:${minute}:${second}` : `${hour}:${minute}`
}

function getReturnVoucher(returnDoc: Return): InventoryVoucher | null {
    return ((returnDoc as any).inventory_voucher ?? null) as InventoryVoucher | null
}

function getReturnDocumentDate(returnDoc: Return) {
    const voucher = getReturnVoucher(returnDoc)
    return voucher?.document_date || voucher?.posting_date || returnDoc.return_date || returnDoc.created_at
}

function getReturnDocumentTime(returnDoc: Return) {
    const voucher = getReturnVoucher(returnDoc)
    return voucher?.document_time || voucher?.posting_time || (returnDoc as any).return_time || returnDoc.created_at
}

function parseDateParts(value?: string | number[] | null) {
    if (!value) return null
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return null
        return {
            day: String(day).padStart(2, "0"),
            month: String(month).padStart(2, "0"),
            year: String(year),
        }
    }
    const text = String(value)
    const [datePart] = text.split("T")
    const normalized = datePart.includes(" ") ? datePart.split(" ")[0] : datePart
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoMatch) return { day: isoMatch[3], month: isoMatch[2], year: isoMatch[1] }
    const viDashMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (viDashMatch) return { day: viDashMatch[1], month: viDashMatch[2], year: viDashMatch[3] }
    const viSlashMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (viSlashMatch) return { day: viSlashMatch[1], month: viSlashMatch[2], year: viSlashMatch[3] }
    return null
}

async function resolveInventoryVoucherId(returnDoc: Return) {
    const existingVoucher = (returnDoc as any).inventory_voucher
    if (existingVoucher?.id) {
        return Number(existingVoucher.id)
    }
    const voucher = await findInventoryVoucherForReturn(returnDoc)
    return voucher?.id ? Number(voucher.id) : null
}

async function findInventoryVoucherForReturn(returnDoc: Return): Promise<InventoryVoucher | null> {
    const result = await listVouchers({
        page: 1,
        size: 10,
        keyword: returnDoc.return_no,
        type: "SALES_RETURN",
    })
    const items = result?.items ?? []
    return items.find((voucher) =>
        voucher.source_type === "SALES_RETURN" && Number(voucher.source_id) === Number(returnDoc.id)
    ) ?? items.find((voucher) => voucher.source_document_no === returnDoc.return_no) ?? items[0] ?? null
}

function buildSalesReturnPrintVoucher(returnDoc: Return): InventoryVoucherPrintDetail {
    const warehouse = returnDoc.items?.find((item) => item.warehouse)?.warehouse ?? null
    const documentDate = getReturnDocumentDate(returnDoc)
    const documentTime = getReturnDocumentTime(returnDoc)
    return {
        id: -returnDoc.id,
        voucher_no: (returnDoc as any).inventory_voucher?.voucher_no || returnDoc.return_no,
        voucher_type_code: "SALES_RETURN",
        posting_date: stringDatePart(documentDate),
        posting_time: formatTime(documentTime),
        document_date: stringDatePart(documentDate),
        document_time: formatTime(documentTime),
        status: "POSTED",
        source_type: "SALES_RETURN",
        source_id: returnDoc.id,
        source_document_no: returnDoc.return_no,
        description: returnDoc.reason || "Nhập kho hàng trả lại",
        warehouse,
        physical_warehouse: warehouse?.physical_warehouse
            ? {
                id: warehouse.physical_warehouse.id,
                code: warehouse.physical_warehouse.code,
                name: warehouse.physical_warehouse.name || warehouse.physical_warehouse.code || `#${warehouse.physical_warehouse.id}`,
            }
            : undefined,
        type: {
            code: "SALES_RETURN",
            name: "Nhập trả hàng",
            direction: "I",
        },
        items: (returnDoc.items ?? []).map((item, index) => ({
            id: item.id ?? index + 1,
            voucher_id: -returnDoc.id,
            line_no: index + 1,
            direction: "I",
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            quantity: item.quantity,
            unit: item.product?.unit,
            source_type: "SALES_RETURN_ITEM",
            source_id: item.id,
            product: item.product,
            warehouse: item.warehouse ?? null,
            note: item.note,
        })),
    }
}

function stringDatePart(value?: string | number[] | null) {
    if (!value) return undefined
    if (Array.isArray(value)) {
        const parts = parseDateParts(value)
        return parts ? `${parts.year}-${parts.month}-${parts.day}` : undefined
    }
    return String(value).split("T")[0].split(" ")[0]
}
