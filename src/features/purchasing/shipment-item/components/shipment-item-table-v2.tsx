import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { DatePicker } from "@/components/date-picker"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { listSuppliers, getSupplier } from "@/api/purchasing/supplier"
import { getPort, listPorts } from "@/api/purchasing/port"
import { getProduct, listProducts } from "@/api/product"
import { productOption, supplierOption } from "@/lib/option-mapper"
import { deleteShipmentItem } from "@/api/purchasing/shipment_items"
import { useShipments } from "../../shipment/components/shipments-provider"
import { formatCurrency, formatNumber, getPageNumbers } from "@/lib/utils"
import {
    Anchor,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Container,
    Search,
    StickyNote,
    Warehouse,
} from "lucide-react"
import type { ShipmentItem } from "../data/schema"

type Filters = {
    eta_from?: string
    eta_to?: string
    supplier_ids?: string[]
    product_ids?: string[]
    status?: string[]
    port_ids?: string[]
}

type FilterIdList = string[]

type PortOptionSource = {
    id: string | number
    name: string
}

type Props = {
    data: ShipmentItem[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: Filters

    onFiltersChange: (f: Filters) => void
}

export function ShipmentItemTableV2({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const totalAmount =
        data?.reduce((sum, i) => {
            const q = i.quantity ?? 0
            const d = i.defect_quantity ?? 0
            const real = Math.max(q - d, 0)
            const price =
                (i.unit_price ?? 0) +
                (i.packaging_price ?? 0) +
                (i.freight_price ?? 0)
            return sum + real * price
        }, 0) ?? 0

    const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            {/* TOOLBAR */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_minmax(420px,1.4fr)_minmax(260px,.95fr)_minmax(240px,.85fr)]">
                <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={keyword ?? ""}
                        onChange={(e) => onKeywordChange(e.target.value)}
                        placeholder="Tìm theo mã SP, tên SP..."
                        className="h-10 rounded-full pl-10"
                    />
                </div>

                <AsyncMultiSelect
                    className="min-w-0"
                    value={filters.product_ids}
                    onChange={(v: FilterIdList) => setFilter("product_ids", v)}
                    placeholder="Sản phẩm"
                    dataSource={{
                        getList: listProducts,
                        getById: getProduct,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={productOption}
                />

                <AsyncMultiSelect
                    className="min-w-0"
                    value={filters.supplier_ids}
                    onChange={(v: FilterIdList) => setFilter("supplier_ids", v)}
                    placeholder="Nhà cung cấp"
                    dataSource={{
                        getList: listSuppliers,
                        getById: getSupplier,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={supplierOption}
                />

                <AsyncMultiSelect
                    className="min-w-0"
                    value={filters.port_ids}
                    onChange={(v: FilterIdList) => setFilter("port_ids", v)}
                    placeholder="Cảng đến"
                    dataSource={{
                        getList: listPorts,
                        getById: getPort,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={(x: PortOptionSource) => ({ value: x.id, label: x.name })}
                />

                <DatePicker
                    className="min-w-0"
                    value={filters.eta_from}
                    onChange={(v) => setFilter("eta_from", v)}
                    placeholder="Ngày đi"
                />

                <DatePicker
                    className="min-w-0"
                    value={filters.eta_to}
                    onChange={(v) => setFilter("eta_to", v)}
                    placeholder="Ngày đến"
                />
            </div>

            {/* CARD LIST */}
            <div className="space-y-3">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                        Không có lô hàng nào.
                    </div>
                ) : (
                    data.map((item, index) => (
                        <ShipmentItemCard
                            key={item.id}
                            item={item}
                            index={pagination.pageIndex * pagination.pageSize + index + 1}
                        />
                    ))
                )}
            </div>

            {/* FOOTER */}
            <div className="flex flex-col items-stretch gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                    <span className="text-muted-foreground">Tổng tiền: </span>
                    <span className="font-semibold tabular-nums">
                        {formatCurrency(totalAmount)}
                    </span>
                </div>
                <SimplePagination
                    pageIndex={pagination.pageIndex}
                    pageCount={pageCount}
                    onChange={(idx) =>
                        onPaginationChange((p) =>
                            typeof p === "function" ? p : { ...p, pageIndex: idx },
                        )
                    }
                />
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

    const arrivedAtPort =
        !!shipment?.ata ||
        shipment?.status === "ARRIVED_PORT" ||
        shipment?.status === "IN_WAREHOUSE" ||
        shipment?.status === "DONE"

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index}
                </div>

                {/* shipment block */}
                <div className="w-[180px] shrink-0 space-y-1">
                    <ShipmentStatusBadge status={shipment?.status} />
                    <div className="text-xl font-bold tracking-tight">
                        {shipment?.code ?? `#${item.shipment_id ?? "-"}`}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Container className="h-3.5 w-3.5" />
                        {shipment?.container_no ? `${shipment.container_no}` : "— container"}
                    </div>
                </div>

                {/* product block */}
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-base font-semibold text-sky-600">
                        {item.product?.code ?? "—"}
                    </div>
                    <div className="text-sm">
                        {item.product?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        ĐVT: {item.product?.unit ?? "—"}
                    </div>
                </div>

                <CrudRowActions
                    row={item}
                    getId={(r) => r.shipment?.id || 0}
                    onEditById={(id) => openEditById(id as number)}
                    onDelete={(r) => deleteById(r.id)}
                />
            </div>

            {/* DETAIL GRID */}
            <div className="grid gap-x-6 gap-y-3 border-t bg-muted/10 px-5 py-4 md:grid-cols-2 lg:grid-cols-5">
                {/* LỊCH HÀNG */}
                <Cell label="LỊCH HÀNG">
                    <DotRow color="sky" label="Ngày đi" value={formatDate(shipment?.etd)} />
                    <DotRow color="emerald" label="Ngày đến" value={formatDate(shipment?.eta)} />
                    <DotRow color="amber" label="Về kho" value={formatDate(shipment?.warehouse_at)} />
                </Cell>

                {/* KHO / CẢNG */}
                <Cell label="KHO / CẢNG">
                    <IconRow icon={Warehouse} value={shipment?.warehouse?.name ?? "—"} />
                    <IconRow icon={Anchor} value={shipment?.destination_port?.name ?? "—"} />
                </Cell>

                {/* TÌNH TRẠNG CẬP CẢNG */}
                <Cell label="TÌNH TRẠNG CẬP CẢNG">
                    {arrivedAtPort ? (
                        <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
                        >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Đã cập cảng
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                        >
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            Chưa cập cảng
                        </Badge>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                        {arrivedAtPort
                            ? formatDate(shipment?.ata ?? shipment?.eta)
                            : shipment?.eta
                                ? `Dự kiến ${formatDate(shipment?.eta)}`
                                : "—"}
                    </div>
                </Cell>

                {/* SỐ LƯỢNG */}
                <Cell label="SỐ LƯỢNG">
                    <QtyRow label="Nhập" value={formatNumber(quantity)} />
                    <QtyRow label="Lỗi" value={formatNumber(defect)} tone={defect > 0 ? "warning" : "default"} />
                    <QtyRow label="Thực nhận" value={formatNumber(real)} tone="success" strong />
                </Cell>

                {/* GIÁ TRỊ */}
                <Cell label="GIÁ TRỊ" align="right">
                    <div className="text-right text-xl font-bold tabular-nums">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        ĐG: {formatCurrency(item.unit_price ?? 0)}
                    </div>
                </Cell>
            </div>

            {/* NOTE */}
            <div className="flex items-start gap-2 border-t px-5 py-3 text-xs">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Ghi chú
                </span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">
                    {item.note || "Chưa có ghi chú"}
                </span>
            </div>
        </div>
    )
}

function Cell({
    label,
    align,
    children,
}: {
    label: string
    align?: "left" | "right"
    children: React.ReactNode
}) {
    return (
        <div className={align === "right" ? "text-right" : ""}>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="space-y-1 text-sm">{children}</div>
        </div>
    )
}

function DotRow({
    color,
    label,
    value,
}: {
    color: "sky" | "emerald" | "amber"
    label: string
    value: string
}) {
    const dotClass =
        color === "emerald"
            ? "bg-emerald-500"
            : color === "amber"
                ? "bg-amber-500"
                : "bg-sky-500"

    return (
        <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            <span className="text-muted-foreground">{label}</span>
            <span className="ml-auto font-medium tabular-nums">{value}</span>
        </div>
    )
}

function IconRow({
    icon: Icon,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>
    value: string
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{value}</span>
        </div>
    )
}

function QtyRow({
    label,
    value,
    tone,
    strong,
}: {
    label: string
    value: string
    tone?: "success" | "warning" | "default"
    strong?: boolean
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
                ? "text-orange-600"
                : ""

    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`tabular-nums ${strong ? "font-semibold" : "font-medium"} ${valueClass}`}
            >
                {value}
            </span>
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
        <Badge variant="outline" className={`${className} text-xs`}>
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

function SimplePagination({
    pageIndex,
    pageCount,
    onChange,
}: {
    pageIndex: number
    pageCount: number
    onChange: (index: number) => void
}) {
    if (pageCount <= 1) return null

    const current = pageIndex + 1
    const pageNumbers = getPageNumbers(current, pageCount)

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={current === 1}
                onClick={() => onChange(0)}
            >
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={current === 1}
                onClick={() => onChange(current - 2)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((p, i) =>
                p === "..." ? (
                    <span key={`d-${i}`} className="px-1 text-sm text-muted-foreground">
                        ...
                    </span>
                ) : (
                    <Button
                        key={p}
                        variant={current === p ? "default" : "outline"}
                        className="h-8 min-w-8 px-2"
                        onClick={() => onChange((p as number) - 1)}
                    >
                        {p}
                    </Button>
                ),
            )}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={current === pageCount}
                onClick={() => onChange(current)}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={current === pageCount}
                onClick={() => onChange(pageCount - 1)}
            >
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
