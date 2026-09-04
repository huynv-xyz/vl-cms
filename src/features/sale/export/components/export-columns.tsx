import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { ColumnDef, Row } from "@tanstack/react-table"
import { useLocation } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Printer } from "lucide-react"
import { toast } from "sonner"

import { getMyPermissions } from "@/api/auth/permission"
import { getVoucherPrintDetail, listVouchers, type InventoryVoucher, type InventoryVoucherPrintDetail } from "@/api/inventory/voucher"
import { getExport, updateExportStatus } from "@/api/sale/export"
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
import type { Export } from "../data/schema"
import { ExportDetailDialog } from "./export-detail-dialog"
import { ExportRowActions } from "./export-row-actions"
import { EXPORT_STATUSES, exportStatusLabel } from "./export-status"
import {
    WarehouseVoucherPrintDocument,
    WAREHOUSE_VOUCHER_PRINT_CSS,
} from "@/features/inventory/voucher/warehouse-voucher-print"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`

export function useExportColumns() {
    const queryClient = useQueryClient()
    const returnTo = useLocation({ select: (location) => location.href })
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canUpdateStatus = permissions.some(
        (p: any) =>
            p.module === "sales.exports" &&
            (p.action === "status.update" || p.action === "update")
    )
    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: ({ id, status, exportTime }: { id: number; status: string; exportTime?: string; orderId?: number }) =>
            updateExportStatus(id, status, exportTime),
        onError: (error: any) => {
            toast.error(error?.message || "Cập nhật trạng thái phiếu xuất thất bại")
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["exports"] })
            queryClient.invalidateQueries({ queryKey: ["deliveries"] })
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            if (variables?.orderId) {
                queryClient.invalidateQueries({ queryKey: ["order-detail", variables.orderId] })
            }
        },
    })

    const columns: ColumnDef<Export>[] = [
        {
            id: "print",
            header: "In phiếu",
            enableSorting: false,
            enableHiding: false,
            size: 76,
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <ExportPrintButton exportDoc={row.original} />
                </div>
            ),
            meta: {
                thClassName: `w-[76px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[76px] whitespace-nowrap ${centerCell}`,
            },
        },

        buildTextColumn<Export>({
            title: "Đơn hàng",
            width: 170,
            className: `w-[170px] ${centerCell}`,
            render: (row) => {
                if (!row.order_id) return <span className="text-muted-foreground">-</span>
                return (
                    <a
                        href={`/sales/orders/${row.order_id}?return_to=${encodeURIComponent(returnTo)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-full truncate font-mono text-sm font-medium text-primary hover:underline"
                        title={row.order?.order_no ?? `#${row.order_id}`}
                    >
                        {row.order?.order_no ?? `#${row.order_id}`}
                    </a>
                )
            },
        }),

        buildTextColumn<Export>({
            accessorKey: "export_no",
            title: "Phiếu xuất bán",
            width: 190,
            className: `w-[190px] ${centerCell}`,
            render: (row) => <ExportDetailButton exportDoc={row} />,
        }),

        buildTextColumn<Export>({
            title: "Phiếu kho",
            width: 180,
            className: `w-[180px] ${centerCell}`,
            render: (row) => <InventoryVoucherCell exportDoc={row} />,
        }),

        buildTextColumn<Export>({
            accessorKey: "export_date",
            title: "Ngày xuất",
            width: 120,
            className: `w-[120px] whitespace-nowrap ${centerCell}`,
            render: (row) => formatDate(row.export_date),
        }),

        buildTextColumn<Export>({
            accessorKey: "export_time",
            title: "Giờ xuất",
            width: 105,
            className: `w-[105px] whitespace-nowrap ${centerCell}`,
            render: (row) => formatTime(row.export_time),
        }),

        buildTextColumn<Export>({
            title: "Khách hàng",
            width: 320,
            className: `w-[320px] ${gridCell}`,
            render: (row) => {
                const customer = row.order?.customer
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

        buildTextColumn<Export>({
            title: "Kho",
            width: 260,
            className: `w-[260px] ${gridCell}`,
            render: (row) => <WarehouseCell exportDoc={row} />,
        }),

        {
            accessorKey: "status",
            header: "Trạng thái",
            size: 155,
            minSize: 135,
            cell: ({ row }) => {
                const status = row.original.status || "NEW"
                const allowedNext =
                    status === "NEW"
                        ? ["DONE", "CANCELLED"]
                        : status === "CANCELLED"
                            ? ["NEW"]
                            : []
                return (
                    <Select
                        value={status}
                        disabled={!canUpdateStatus || isPending || status === "DONE"}
                        onValueChange={(next) =>
                            changeStatus({
                                id: row.original.id,
                                status: next,
                                exportTime: normalizeTimeForInput(row.original.export_time) ?? currentTimeForInput(),
                                orderId: row.original.order_id,
                            })
                        }
                    >
                        <SelectTrigger className="mx-auto h-8 w-[130px]">
                            <SelectValue>{exportStatusLabel(status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {EXPORT_STATUSES.map((s) => (
                                <SelectItem
                                    key={s.value}
                                    value={s.value}
                                    disabled={s.value !== status && !allowedNext.includes(s.value)}
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
            cell: ({ row }: { row: Row<Export> }) => (
                <div className="flex items-center justify-center gap-2">
                    {row.original.status === "DONE" ? null : <ExportRowActions row={row} />}
                </div>
            ),
            meta: {
                thClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
                tdClassName: `w-[90px] whitespace-nowrap ${centerCell}`,
            },
        },
    ]

    return { columns }
}

function ExportDetailButton({ exportDoc }: { exportDoc: Export }) {
    const [open, setOpen] = useState(false)
    const label = exportDoc.export_no ?? `#${exportDoc.id}`

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
            <ExportDetailDialog
                open={open}
                id={exportDoc.id}
                onClose={() => setOpen(false)}
            />
        </>
    )
}

function ExportPrintButton({ exportDoc }: { exportDoc: Export }) {
    const [voucher, setVoucher] = useState<InventoryVoucherPrintDetail | null>(null)
    const [sourceDocument, setSourceDocument] = useState<Export | null>(null)
    const printMutation = useMutation({
        mutationFn: async () => {
            const [voucherId, exportDetail] = await Promise.all([
                resolveInventoryVoucherId(exportDoc),
                getExport(exportDoc.id),
            ])
            const voucherDetail = voucherId
                ? await getVoucherPrintDetail(voucherId)
                : buildSalesExportPrintVoucher(exportDetail)
            return { voucherDetail, exportDetail }
        },
        onSuccess: ({ voucherDetail, exportDetail }) => {
            setVoucher(voucherDetail)
            setSourceDocument(exportDetail)
            window.setTimeout(() => window.print(), 50)
        },
        onError: (error: any) => {
            toast.error(error?.message || "Không tải được phiếu in")
        },
    })

    useEffect(() => {
        if (!voucher) return
        const timer = window.setTimeout(() => {
            setVoucher(null)
            setSourceDocument(null)
        }, 1000)
        return () => window.clearTimeout(timer)
    }, [voucher])

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
            {voucher ? createPortal(
                <>
                    <style>{WAREHOUSE_VOUCHER_PRINT_CSS}</style>
                    <div id="warehouse-voucher-print" className="hidden">
                        <WarehouseVoucherPrintDocument voucher={voucher} sourceDocument={sourceDocument ?? undefined} />
                    </div>
                </>,
                document.body,
            ) : null}
        </>
    )
}

function InventoryVoucherCell({ exportDoc }: { exportDoc: Export }) {
    const fallbackQuery = useQuery({
        queryKey: ["sales-export-inventory-voucher", exportDoc.id, exportDoc.export_no],
        queryFn: () => findInventoryVoucherForExport(exportDoc),
        enabled: !exportDoc.inventory_voucher?.voucher_no && !!exportDoc.export_no,
        staleTime: 30_000,
    })
    const voucher = exportDoc.inventory_voucher?.voucher_no
        ? exportDoc.inventory_voucher
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

function WarehouseCell({ exportDoc }: { exportDoc: Export }) {
    const needsFallback = !exportDoc.warehouse && !exportDoc.items?.some((item) => item.warehouse)
    const fallbackQuery = useQuery({
        queryKey: ["sales-export-warehouse", exportDoc.id],
        queryFn: () => getExport(exportDoc.id),
        enabled: needsFallback,
        staleTime: 30_000,
    })
    const fallbackExport = fallbackQuery.data as Export | undefined
    const warehouse =
        exportDoc.warehouse ??
        exportDoc.items?.find((item) => item.warehouse)?.warehouse ??
        fallbackExport?.warehouse ??
        fallbackExport?.items?.find((item: any) => item.warehouse)?.warehouse
    const physicalWarehouse = warehouse?.physical_warehouse
    const physicalLabel = physicalWarehouse?.name || physicalWarehouse?.code || ""
    const warehouseLabel = warehouse?.name || warehouse?.code || ""

    if (!physicalLabel && !warehouseLabel) {
        return <span className="text-muted-foreground">-</span>
    }

    return (
        <div className="min-w-0">
            <div className="truncate text-sm font-medium" title={physicalLabel || "-"}>
                {physicalLabel || "-"}
            </div>
            <div className="truncate text-xs text-muted-foreground" title={warehouseLabel || "-"}>
                Kho xuất: {warehouseLabel || "-"}
            </div>
        </div>
    )
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const text = String(value)
    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`
    const viDashMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})/)
    if (viDashMatch) return `${viDashMatch[1]}/${viDashMatch[2]}/${viDashMatch[3]}`
    return text
}

function formatTime(value?: string | null) {
    if (!value) return "-"
    const text = String(value)
    const match = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!match) return text
    const hour = match[1].padStart(2, "0")
    const minute = match[2].padStart(2, "0")
    const second = match[3]?.padStart(2, "0")
    return second ? `${hour}:${minute}:${second}` : `${hour}:${minute}`
}

async function resolveInventoryVoucherId(exportDoc: Export) {
    if (exportDoc.inventory_voucher?.id) {
        return Number(exportDoc.inventory_voucher.id)
    }
    const voucher = await findInventoryVoucherForExport(exportDoc)
    return voucher?.id ? Number(voucher.id) : null
}

async function findInventoryVoucherForExport(exportDoc: Export): Promise<InventoryVoucher | null> {
    const result = await listVouchers({
        page: 1,
        size: 10,
        keyword: exportDoc.export_no,
        type: "SALES_EXPORT",
    })
    const items = result?.items ?? []
    return items.find((voucher) =>
        voucher.source_type === "SALES_EXPORT" && Number(voucher.source_id) === Number(exportDoc.id)
    ) ?? items.find((voucher) => voucher.source_document_no === exportDoc.export_no) ?? items[0] ?? null
}

function buildSalesExportPrintVoucher(exportDoc: Export): InventoryVoucherPrintDetail {
    const warehouse = exportDoc.warehouse ?? exportDoc.items?.find((item) => item.warehouse)?.warehouse ?? null
    const physicalWarehouse = warehouse?.physical_warehouse
    return {
        id: -exportDoc.id,
        voucher_no: exportDoc.inventory_voucher?.voucher_no || exportDoc.export_no,
        voucher_type_code: "SALES_EXPORT",
        posting_date: exportDoc.export_date,
        posting_time: exportDoc.export_time,
        document_date: exportDoc.export_date,
        document_time: exportDoc.export_time,
        status: "POSTED",
        source_type: "SALES_EXPORT",
        source_id: exportDoc.id,
        source_document_no: exportDoc.export_no,
        description: exportDoc.note || `Xuất bán hàng ${exportDoc.export_no}`,
        warehouse,
        physical_warehouse: physicalWarehouse
            ? {
                id: physicalWarehouse.id,
                code: physicalWarehouse.code,
                name: physicalWarehouse.name || physicalWarehouse.code || `#${physicalWarehouse.id}`,
            }
            : undefined,
        type: {
            code: "SALES_EXPORT",
            name: "Xuất kho bán hàng",
            direction: "O",
        },
        items: (exportDoc.items ?? []).map((item, index) => ({
            id: item.id ?? index + 1,
            voucher_id: -exportDoc.id,
            line_no: index + 1,
            direction: "O",
            product_id: item.product_id,
            warehouse_id: item.warehouse_id,
            lot_code: item.lot_no || item.lot_nos || item.lot_code,
            lot_selection_reason: item.lot_selection_reason,
            quantity: item.quantity,
            unit: item.product?.sale_unit_name || item.product?.unit,
            source_type: "SALES_EXPORT_ITEM",
            source_id: item.id,
            product: item.product,
            warehouse: item.warehouse ?? null,
            note: item.order_item?.description,
        })),
    }
}

function normalizeTimeForInput(value?: string | null) {
    if (!value) return null
    const match = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!match) return null
    const hour = match[1].padStart(2, "0")
    const minute = match[2].padStart(2, "0")
    const second = (match[3] ?? "00").padStart(2, "0")
    return `${hour}:${minute}:${second}`
}

function currentTimeForInput() {
    const now = new Date()
    const hour = String(now.getHours()).padStart(2, "0")
    const minute = String(now.getMinutes()).padStart(2, "0")
    const second = String(now.getSeconds()).padStart(2, "0")
    return `${hour}:${minute}:${second}`
}
