import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { DatePicker } from "@/components/date-picker"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { getPort, listPorts } from "@/api/purchasing/port"
import { getProduct } from "@/api/product"
import { listContractItems } from "@/api/purchasing/contract-item"
import { getSupplier, listSuppliers } from "@/api/purchasing/supplier"
import { deleteShipmentItem } from "@/api/purchasing/shipment_items"
import { useShipments } from "../../shipment/components/shipments-provider"
import { formatNumber, getPageNumbers } from "@/lib/utils"
import {
    Anchor,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    Container,
    Globe2,
    StickyNote,
    Warehouse,
} from "lucide-react"
import type { ShipmentItem } from "../data/schema"
import {
    SHIPMENT_STATUS_FILTER_OPTIONS,
    getShipmentStatusLabel,
    getShipmentStatusBadgeClass,
} from "../../shipment/data/shipment-status"

type Filters = {
    date_type?: DateFilterType
    date_from?: string
    date_to?: string
    product_ids?: string[]
    status?: string[]
    port_ids?: string[]
    supplier_ids?: string[]
}

type FilterIdList = string[]
type DateFilterType = "SIGNED_DATE" | "ETD" | "ETA"

const DATE_FILTER_OPTIONS: { value: DateFilterType; label: string }[] = [
    { value: "SIGNED_DATE", label: "Theo ngày ký hợp đồng" },
    { value: "ETD", label: "Theo ngày hàng đi" },
    { value: "ETA", label: "Theo ngày hàng về" },
]

type PortOptionSource = {
    id: string | number
    name: string
}

type SupplierOptionSource = {
    id: string | number
    name: string
    nation?: { name?: string }
}

type ProductOptionSource = {
    id: string | number
    product_id?: string | number
    product?: {
        id?: string | number
        code?: string
        quote_name?: string
        name?: string
    }
    code?: string
    quote_name?: string
    name?: string
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
    const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-3">
            {/* TOOLBAR */}
            <div className="space-y-2">
                <div className="flex w-full flex-wrap items-center gap-2">
                    <SearchOnBlurInput
                        value={keyword}
                        onChange={onKeywordChange}
                        placeholder="Tìm theo mã SP, tên SP..."
                        wrapperClassName="relative h-10 min-w-[280px] flex-[1.2_1_0]"
                        className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                    />

                    <AsyncMultiSelect
                        className="h-10 min-w-[280px] flex-[1.8_1_0] border-slate-300 bg-white shadow-xs"
                        value={filters.product_ids}
                        onChange={(v: FilterIdList) => setFilter("product_ids", v)}
                        searchPlaceholder="Nhập tên sản phẩm..."
                        placeholder="Sản phẩm"
                        dataSource={{
                            getList: listContractItems,
                            getById: getProduct,
                            params: {
                                page: 1,
                                size: 20,
                            },
                        }}
                        mapOption={shipmentProductOption}
                        dedupeByLabel
                    />
                </div>

                <div className="flex w-full flex-wrap items-center gap-2">
                    <AsyncMultiSelect
                        className="h-10 min-w-[320px] flex-[1.5_1_0] border-slate-300 bg-white shadow-xs"
                        value={filters.supplier_ids}
                        onChange={(v: FilterIdList) => setFilter("supplier_ids", v)}
                        placeholder="Quốc gia / Nhà cung cấp"
                        searchPlaceholder="Tìm theo quốc gia hoặc nhà cung cấp..."
                        dataSource={{
                            getList: listSuppliers,
                            getById: getSupplier,
                            params: { page: 1, size: 20 },
                        }}
                        mapOption={(x: SupplierOptionSource) => ({
                            value: x.id,
                            label: x.nation?.name
                                ? `${x.nation.name} · ${x.name}`
                                : x.name,
                        })}
                    />

                    <AsyncMultiSelect
                        className="h-10 min-w-[170px] flex-1 border-slate-300 bg-white shadow-xs"
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

                    <StatusFilter
                        value={filters.status}
                        onChange={(v) => setFilter("status", v)}
                    />

                    <ShipmentDateSearch
                        value={{
                            date_type: filters.date_type,
                            date_from: filters.date_from,
                            date_to: filters.date_to,
                        }}
                        onSearch={(v) => onFiltersChange({ ...filters, ...v })}
                    />
                </div>
            </div>

            {/* CARD LIST */}
            <div className="space-y-2">
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
            <div className="flex flex-col items-stretch gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-end">
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

function ShipmentDateSearch({
    value,
    onSearch,
}: {
    value: Pick<Filters, "date_type" | "date_from" | "date_to">
    onSearch: (value: Pick<Filters, "date_type" | "date_from" | "date_to">) => void
}) {
    const [draft, setDraft] = useState({
        date_type: value.date_type ?? "ETA",
        date_from: value.date_from ?? "",
        date_to: value.date_to ?? "",
    })

    useEffect(() => {
        setDraft({
            date_type: value.date_type ?? "ETA",
            date_from: value.date_from ?? "",
            date_to: value.date_to ?? "",
        })
    }, [value.date_type, value.date_from, value.date_to])

    return (
        <div className="flex min-w-full flex-wrap items-center gap-2 lg:min-w-[680px] lg:flex-[2_1_0]">
            <Select
                value={draft.date_type}
                onValueChange={(next) =>
                    setDraft((prev) => ({
                        ...prev,
                        date_type: next as DateFilterType,
                    }))
                }
            >
                <SelectTrigger className="h-10 min-w-[230px] flex-1 border-slate-300 bg-white shadow-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {DATE_FILTER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <DatePicker
                className="min-w-[160px] flex-1 [&_button]:h-10"
                value={draft.date_from}
                onChange={(v) =>
                    setDraft((prev) => ({
                        ...prev,
                        date_from: v ?? "",
                    }))
                }
                placeholder="Từ ngày"
            />

            <DatePicker
                className="min-w-[160px] flex-1 [&_button]:h-10"
                value={draft.date_to}
                onChange={(v) =>
                    setDraft((prev) => ({
                        ...prev,
                        date_to: v ?? "",
                    }))
                }
                placeholder="Tới ngày"
            />

            <Button
                type="button"
                className="h-10 min-w-[104px] bg-teal-600 px-6 font-semibold text-white hover:bg-teal-700"
                onClick={() =>
                    onSearch({
                        date_type: draft.date_type,
                        date_from: draft.date_from || undefined,
                        date_to: draft.date_to || undefined,
                    })
                }
            >
                Tìm
            </Button>
        </div>
    )
}

function shipmentProductOption(x: ProductOptionSource) {
    const product = x.product ?? x
    const productId = x.product_id ?? product.id
    if (!productId) return null

    return {
        value: productId,
        // Shipment product filter displays products from contract items only,
        // falling back to products.name when quote_name is empty.
        label: product.quote_name || product.name || product.code || "",
        raw: x,
    }
}

function ShipmentItemCard({ item, index }: { item: ShipmentItem; index: number }) {
    const { openEditById } = useShipments()
    const { deleteById } = useCrudDelete(deleteShipmentItem, ["shipment-items"])

    const shipment = item.shipment
    const quantity = item.quantity ?? 0
    const defect = item.defect_quantity ?? 0
    const real = Math.max(quantity - defect, 0)
    const arrivedAtPort =
        !!shipment?.ata ||
        shipment?.status === "ARRIVED_PORT" ||
        shipment?.status === "IN_WAREHOUSE"

    return (
        <div className="overflow-hidden rounded-lg border border-[#d8d5c9] shadow-xs">
            {/* HEADER */}
            <div className="grid min-h-[108px] grid-cols-[48px_minmax(120px,180px)_minmax(260px,1fr)_56px] bg-[#fbfaf2] border-b border-[#d8d5c9]">
                <div className="flex items-center justify-center border-r border-[#d8d5c9] text-sm text-slate-600">
                    {index}
                </div>

                {/* shipment block */}
                <div className="space-y-1 border-r border-[#d8d5c9] px-5 py-4">
                    <ShipmentStatusBadge status={shipment?.status} />
                    <div className="text-lg font-bold leading-tight tracking-tight text-slate-900">
                        {shipment?.code ?? `#${item.shipment_id ?? "-"}`}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Container className="h-3.5 w-3.5" />
                        {shipment?.container_no ? `${shipment.container_no}` : "— container"}
                    </div>
                </div>

                {/* product block */}
                <div className="min-w-0 space-y-1 px-5 py-4">
                    <div className="truncate text-sm font-semibold text-sky-700">
                        {item.product?.code ?? "—"}
                    </div>
                    <div className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">
                        {item.product?.name ?? "—"}
                    </div>
                    <div className="text-xs text-slate-600">
                        ĐVT: {item.product?.unit ?? "—"}
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

            {/* DETAIL GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4">
                {/* LỊCH HÀNG */}
                <Cell label="LỊCH HÀNG">
                    <DotRow color="sky" label="Ngày đi" value={shipment?.etd || ''} />
                    <DotRow color="emerald" label="Ngày đến" value={shipment?.eta || ''} />
                    <DotRow color="amber" label="Về kho" value={shipment?.warehouse_at || ''} />
                </Cell>

                {/* KHO / CẢNG / QUỐC GIA */}
                <Cell label="KHO / CẢNG / QUỐC GIA">
                    <IconRow icon={Warehouse} value={shipment?.warehouse?.name ?? "—"} />
                    <IconRow icon={Anchor} value={shipment?.destination_port?.name ?? "—"} />
                    <IconRow
                        icon={Globe2}
                        value={
                            shipment?.supplier?.nation?.name
                                ? `${shipment.supplier.nation.name} · ${shipment.supplier.name}`
                                : shipment?.supplier?.name ?? "—"
                        }
                    />
                </Cell>

                {/* TÌNH TRẠNG CẬP CẢNG */}
                <Cell label="TÌNH TRẠNG CẬP CẢNG">
                    <Badge variant="outline" className={`${getShipmentStatusBadgeClass(shipment?.status)} border-emerald-200 bg-emerald-50 text-xs text-emerald-700`}>
                        {getShipmentStatusLabel(shipment?.status)}
                    </Badge>

                    <div className="mt-1 text-xs text-muted-foreground">
                        {arrivedAtPort
                            ? shipment?.ata ?? shipment?.eta
                            : shipment?.eta
                                ? `Dự kiến ${shipment?.eta || ''}`
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
                {/*<Cell label="GIÁ TRỊ" align="right">
                    <div className="text-right text-xl font-bold leading-tight tabular-nums text-slate-900">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                        ĐG: {formatCurrency(item.unit_price ?? 0)}
                    </div>
                </Cell>*/}
            </div>

            {/* NOTE */}
            <div className="flex items-center gap-2 bg-[#fbfaf2] border-t border-[#d8d5c9] px-5 py-2 text-xs">
                <StickyNote className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span className="font-semibold uppercase tracking-wide text-slate-600">
                    Ghi chú
                </span>
                <span className="text-slate-400">|</span>
                <span className="italic text-slate-500">
                    {item.note || "Chưa có ghi chú"}
                </span>
            </div>
        </div>
    )
}

function StatusFilter({
    value,
    onChange,
}: {
    value?: string[]
    onChange: (value?: string[]) => void
}) {
    const selected = value ?? []
    const selectedOptionCount = SHIPMENT_STATUS_FILTER_OPTIONS.filter((option) =>
        option.values.some((status) => selected.includes(status)),
    ).length

    const toggleStatus = (option: (typeof SHIPMENT_STATUS_FILTER_OPTIONS)[number]) => {
        const optionValues = option.values
        const isSelected = optionValues.some((status) => selected.includes(status))
        const next = isSelected
            ? selected.filter((item) => !optionValues.includes(item))
            : Array.from(new Set([...selected, ...optionValues]))

        onChange(next.length ? next : undefined)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 min-w-[145px] flex-1 justify-between rounded-md border-slate-300 bg-white px-3 shadow-xs"
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="truncate">
                            {selectedOptionCount ? `Trạng thái (${selectedOptionCount})` : "Trạng thái"}
                        </span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
                {SHIPMENT_STATUS_FILTER_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={option.values.some((status) => selected.includes(status))}
                        onCheckedChange={() => toggleStatus(option)}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
                {selected.length > 0 ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onChange(undefined)}>
                            Xóa bộ lọc trạng thái
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
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
        <div
            className={`min-h-[118px] border-b border-r border-[#d8d5c9] px-4 py-3 last:border-r-0 lg:border-b-0 ${align === "right" ? "text-right" : ""}`}
        >
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="space-y-1.5 text-sm">{children}</div>
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
        <div className="flex items-center gap-2 text-xs">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            <span className="text-slate-600">{label}</span>
            <span className="ml-auto font-bold tabular-nums text-slate-900">{value}</span>
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
        <div className="flex items-center gap-2 text-sm">
            <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span className="truncate text-slate-800">{value}</span>
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
        <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-slate-600">{label}</span>
            <span
                className={`tabular-nums ${strong ? "font-bold" : "font-semibold"} ${valueClass || "text-slate-900"}`}
            >
                {value}
            </span>
        </div>
    )
}

function ShipmentStatusBadge({ status }: { status?: string }) {
    return (
        <Badge variant="outline" className={`${getShipmentStatusBadgeClass(status)} h-5 rounded-sm px-2 text-[11px]`}>
            {getShipmentStatusLabel(status)}
        </Badge>
    )
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
