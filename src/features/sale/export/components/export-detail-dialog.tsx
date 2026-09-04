import { useQuery } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"

import { getExport } from "@/api/sale/export"
import { DialogLoadingState } from "@/components/loading-state"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { formatNumber } from "@/lib/utils"
import type { Export, ExportItem } from "../data/schema"

export function ExportDetailDialog({
    open,
    id,
    onClose,
}: {
    open: boolean
    id?: number
    onClose: () => void
}) {
    const query = useQuery({
        queryKey: ["export-detail", id],
        queryFn: () => getExport(id!),
        enabled: open && !!id,
    })

    const data = query.data as Export | undefined
    const voucherNo = data?.inventory_voucher?.voucher_no
    const voucherHref = voucherNo
        ? `/inventory/vouchers?keyword=${encodeURIComponent(voucherNo)}`
        : data?.export_no
            ? `/inventory/vouchers?keyword=${encodeURIComponent(data.export_no)}`
            : null

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="flex max-h-[92vh] w-[min(96vw,1200px)] !max-w-none flex-col gap-0 overflow-hidden p-0 print:hidden">
                <DialogHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 px-5 py-3.5">
                    <DialogTitle className="text-base font-semibold">
                        Phiếu xuất bán
                        {data?.export_no ? (
                            <span className="ml-2 font-mono text-primary">
                                {data.export_no}
                            </span>
                        ) : null}
                    </DialogTitle>

                    {voucherHref ? (
                        <Button variant="outline" size="sm" asChild>
                            <a href={voucherHref} target="_blank" rel="noreferrer">
                                Chứng từ kho
                                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </a>
                        </Button>
                    ) : null}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {query.isLoading && <DialogLoadingState />}

                    {!query.isLoading && data ? (
                        <ExportAdminDetail data={data} />
                    ) : null}

                    {!query.isLoading && !data && !query.error ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Không tìm thấy phiếu xuất bán.
                        </div>
                    ) : null}

                    {query.error ? (
                        <div className="py-10 text-center text-sm text-red-500">
                            Lỗi tải dữ liệu.
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ExportAdminDetail({ data }: { data: Export }) {
    const items = data.items ?? []
    const customer = data.order?.customer
    const warehouse = resolveWarehouse(data)
    const physicalWarehouse = warehouse?.physical_warehouse
    const warehouseLabel = warehouse?.name || warehouse?.code || "-"
    const physicalWarehouseLabel = physicalWarehouse?.name || physicalWarehouse?.code || "-"
    const totalQuantity = items.reduce((total, item) => total + Number(item.quantity || 0), 0)

    return (
        <div className="space-y-5 p-1">
            <div className="grid gap-x-6 gap-y-3 rounded-lg border bg-muted/20 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Phiếu xuất bán" value={data.export_no || "-"} mono />
                <DetailItem label="Đơn hàng" value={data.order?.order_no || (data.order_id ? `#${data.order_id}` : "-")} mono />
                <DetailItem label="Phiếu kho" value={data.inventory_voucher?.voucher_no || "-"} mono />
                <DetailItem label="Ngày xuất" value={formatDate(data.export_date)} />
                <DetailItem label="Giờ xuất" value={formatTime(data.export_time)} />
                <DetailItem label="Trạng thái" value={data.status || "-"} />
                <DetailItem label="Khách hàng" value={customer?.name || "-"} />
                <DetailItem label="Mã khách hàng" value={customer?.code || "-"} mono />
                <DetailItem label="Địa điểm kho" value={physicalWarehouseLabel} />
                <DetailItem label="Kho xuất" value={warehouseLabel} />
                <DetailItem label="Phiếu giao" value={data.delivery?.delivery_no || (data.delivery_id ? `#${data.delivery_id}` : "-")} mono />
                <DetailItem label="Ghi chú" value={data.note || "-"} />
            </div>

            <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                        <tr>
                            <th className="w-14 px-3 py-2.5 text-center font-medium">STT</th>
                            <th className="px-3 py-2.5 text-left font-medium">Mã hàng</th>
                            <th className="px-3 py-2.5 text-left font-medium">Tên hàng hóa</th>
                            <th className="px-3 py-2.5 text-left font-medium">ĐVT</th>
                            <th className="px-3 py-2.5 text-right font-medium">Số lượng</th>
                            <th className="px-3 py-2.5 text-left font-medium">Kho xuất</th>
                            <th className="px-3 py-2.5 text-left font-medium">Lô</th>
                            <th className="px-3 py-2.5 text-left font-medium">Lý do chọn lô</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length ? items.map((item, index) => (
                            <ExportItemRow item={item} index={index} key={`${item.id}-${index}`} />
                        )) : (
                            <tr>
                                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                                    Chưa có dòng hàng hóa
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="border-t bg-muted/30">
                        <tr>
                            <td colSpan={4} className="px-3 py-2.5 text-right font-semibold">
                                Tổng số lượng
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                                {formatNumber(totalQuantity)}
                            </td>
                            <td colSpan={3} />
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )
}

function ExportItemRow({ item, index }: { item: ExportItem; index: number }) {
    return (
        <tr className="border-t">
            <td className="px-3 py-2 text-center">{index + 1}</td>
            <td className="px-3 py-2 font-mono text-xs">{item.product?.code || "-"}</td>
            <td className="px-3 py-2">{item.product?.name || "-"}</td>
            <td className="px-3 py-2">{item.product?.sale_unit_name || item.product?.unit || "-"}</td>
            <td className="px-3 py-2 text-right font-medium tabular-nums">
                {formatNumber(Number(item.quantity || 0))}
            </td>
            <td className="px-3 py-2">{formatWarehouse(item.warehouse)}</td>
            <td className="px-3 py-2 font-mono text-xs">{item.lot_no || item.lot_nos || item.lot_code || "-"}</td>
            <td className="px-3 py-2">{item.lot_selection_reason || "-"}</td>
        </tr>
    )
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="min-w-0">
            <div className="mb-1 text-xs text-muted-foreground">{label}</div>
            <div className={mono ? "truncate font-mono font-medium" : "break-words font-medium"}>
                {value}
            </div>
        </div>
    )
}

function resolveWarehouse(data: Export) {
    return data.warehouse ?? data.items?.find((item) => item.warehouse)?.warehouse
}

function formatWarehouse(warehouse?: ExportItem["warehouse"] | null) {
    if (!warehouse) return "-"
    return warehouse.code ? `${warehouse.code} - ${warehouse.name}` : warehouse.name || "-"
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
