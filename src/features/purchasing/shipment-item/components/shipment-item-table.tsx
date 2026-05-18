import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { deleteShipmentItem } from "@/api/purchasing/shipment_items"
import { CalendarDays, MapPin, Package, Search, Truck } from "lucide-react"
import { useShipments } from "../../shipment/components/shipments-provider"
import type { ShipmentItem } from "../data/schema"

type Props = {
    data: ShipmentItem[]
    keyword: string
    onKeywordChange: (v: string) => void
}

export function ShipmentItemTable({ data, keyword, onKeywordChange }: Props) {
    const totalQuantity = data?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0
    const totalDefect = data?.reduce((sum, i) => sum + (i.defect_quantity ?? 0), 0) ?? 0
    const totalReal = data?.reduce((sum, i) => {
        const q = i.quantity ?? 0
        const d = i.defect_quantity ?? 0
        return sum + Math.max(q - d, 0)
    }, 0) ?? 0
    const totalAmount = data?.reduce((sum, i) => {
        const q = i.quantity ?? 0
        const d = i.defect_quantity ?? 0
        const real = Math.max(q - d, 0)
        const price =
            (i.unit_price ?? 0) +
            (i.packaging_price ?? 0) +
            (i.freight_price ?? 0)
        return sum + real * price
    }, 0) ?? 0

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                <Summary label="DÒNG" value={formatNumber(data.length)} />
                <Summary label="TỔNG SL NHẬP" value={formatNumber(totalQuantity)} />
                <Summary label="LỖI" value={formatNumber(totalDefect)} tone="warning" />
                <Summary label="THỰC NHẬN" value={formatNumber(totalReal)} tone="success" />
                <Summary label="TỔNG TIỀN" value={formatCurrency(totalAmount)} />
            </div>

            <div className="relative w-full max-w-[240px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                    value={keyword ?? ""}
                    onChange={(e) => onKeywordChange?.(e.target.value)}
                    placeholder="Tìm theo mã SP, tên SP..."
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />
            </div>

            <div className="space-y-2">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                        Chưa có lô hàng nào trong hợp đồng.
                    </div>
                ) : (
                    data.map((item, index) => (
                        <ShipmentItemCard key={item.id} item={item} index={index + 1} />
                    ))
                )}
            </div>
        </div>
    )
}

function ShipmentItemCard({ item, index }: { item: ShipmentItem; index: number }) {
    const { openEditById } = useShipments()
    const { deleteById } = useCrudDelete(deleteShipmentItem, ["shipment-items"])

    const shipment = item.shipment
    const quantity = item.quantity ?? 0
    const defect = item.defect_quantity ?? 0
    const real = Math.max(quantity - defect, 0)
    const unitPrice =
        (item.unit_price ?? 0) +
        (item.packaging_price ?? 0) +
        (item.freight_price ?? 0)
    const totalAmount = real * unitPrice

    return (
        <div className="overflow-hidden rounded-lg border border-[#d8d5c9] bg-[#fbfaf2] shadow-xs">
            {/* HEADER */}
            <div className="grid min-h-[76px] grid-cols-[44px_minmax(260px,1fr)_58px] border-b border-[#d8d5c9]">
                <div className="flex items-start justify-center border-r border-[#d8d5c9] pt-4 text-sm text-slate-600">
                    {index}
                </div>
                <div className="min-w-0 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-sky-700">
                            {shipment?.code ?? `#${item.shipment_id ?? "-"}`}
                        </span>
                        <ShipmentStatusBadge status={shipment?.status} />
                    </div>
                    <div className="line-clamp-2 text-sm text-slate-700 font-semibold">
                        {item.product?.code ? `${item.product.code} · ` : ""}
                        {item.product?.name ?? "-"}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" />
                            Container: {shipment?.container_no || "—"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            ĐVT: {item.product?.unit ?? "—"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-center border-l border-[#d8d5c9]">
                    <CrudRowActions
                        row={item}
                        getId={(r) => r.shipment?.id || 0}
                        onEditById={(id) => openEditById(id as number)}
                        onDelete={(r) => deleteById(r.id)}
                    />
                </div>
            </div>

            {/* QUANTITY GRID */}
            <div className="grid border-b border-[#d8d5c9] bg-white md:grid-cols-3">
                <QtyBox
                    label="NHẬP"
                    value={formatNumber(quantity)}
                    unit={item.product?.unit}
                />
                <QtyBox
                    label="LỖI"
                    value={formatNumber(defect)}
                    unit={item.product?.unit}
                    tone={defect > 0 ? "warning" : "default"}
                />
                <QtyBox
                    label="THỰC NHẬN"
                    value={formatNumber(real)}
                    unit={item.product?.unit}
                    tone="success"
                />
            </div>

            {/* DETAIL GRID */}
            <div className="grid bg-white md:grid-cols-[1fr_1fr_1.25fr]">
                {/* LỊCH HÀNG */}
                <DetailBox label="LỊCH HÀNG" icon={CalendarDays}>
                    <DetailRow label="Ngày đi" value={formatDate(shipment?.etd)} />
                    <DetailRow label="Ngày đến" value={formatDate(shipment?.eta)} />
                    <DetailRow label="Về kho" value={formatDate(shipment?.warehouse_at)} />
                </DetailBox>

                {/* KHO/CẢNG */}
                <DetailBox label="KHO / CẢNG" icon={MapPin}>
                    <DetailRow label="Kho" value={shipment?.warehouse?.name ?? "—"} />
                    <DetailRow
                        label="Cảng đến"
                        value={shipment?.destination_port?.name ?? "—"}
                    />
                </DetailBox>

                {/* THÀNH TIỀN */}
                <div className="bg-[#f4f3ec] px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        THÀNH TIỀN
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-tight text-slate-950 tabular-nums">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-700">
                        <DetailRow
                            label="Đơn giá"
                            value={formatCurrency(item.unit_price ?? 0)}
                        />
                        <DetailRow
                            label="Bao bì"
                            value={formatCurrency(item.packaging_price ?? 0)}
                        />
                        <DetailRow
                            label="Vận chuyển"
                            value={formatCurrency(item.freight_price ?? 0)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ShipmentStatusBadge({ status }: { status?: string }) {
    const className =
        status === "DONE"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "IN_WAREHOUSE"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status === "IN_TRANSIT"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : status === "ARRIVED_PORT"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : status === "CANCELLED"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"

    return (
        <Badge variant="outline" className={`${className} h-5 rounded-sm px-2 text-[11px]`}>
            {formatStatus(status)}
        </Badge>
    )
}

function formatStatus(status?: string) {
    switch (status) {
        case "IN_TRANSIT":
            return "Đang vận chuyển"
        case "ARRIVED_PORT":
            return "Đến cảng"
        case "IN_WAREHOUSE":
            return "Về kho"
        case "DONE":
            return "Hoàn tất"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return status || "—"
    }
}

function formatDate(value?: string) {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}

function Summary({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "success" | "warning"
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
                ? "text-orange-600"
                : "text-foreground"

    return (
        <div className="min-w-0 rounded-md bg-[#f4f3ec] px-4 py-3">
            <div className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className={`mt-1 truncate text-lg font-bold leading-tight tabular-nums ${valueClass}`}>
                {value}
            </div>
        </div>
    )
}

function QtyBox({
    label,
    value,
    unit,
    tone,
}: {
    label: string
    value: string
    unit?: string
    tone?: "success" | "warning" | "default"
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
                ? "text-orange-600"
                : "text-foreground"

    return (
        <div className="border-r border-[#d8d5c9] px-4 py-3 last:border-r-0">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className={`mt-1 text-xl font-bold leading-tight tabular-nums ${valueClass}`}>
                {value}
            </div>
            {unit ? (
                <div className="mt-0.5 text-xs text-slate-600">{unit}</div>
            ) : null}
            <div className="mt-2 h-1 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone === "warning" ? "bg-orange-500" : "bg-emerald-600"}`} />
            </div>
        </div>
    )
}

function DetailBox({
    label,
    icon: Icon,
    children,
}: {
    label: string
    icon?: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) {
    return (
        <div className="border-r border-[#d8d5c9] px-4 py-3 last:border-r-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {label}
            </div>
            <div className="mt-2 space-y-1 text-sm">{children}</div>
        </div>
    )
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-slate-600">{label}</span>
            <span className="font-semibold tabular-nums text-slate-950">{value}</span>
        </div>
    )
}
