import { useMemo } from "react"
import { Link } from "@tanstack/react-router"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Factory,
    Filter,
    Inbox,
    Package,
    PackageCheck,
    Scale,
    Warehouse,
    type LucideIcon,
} from "lucide-react"

import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import type { Production, ProductionItem } from "../data/schema"
import { getProductionStatusMeta } from "./production-status"
import { ProductionRowActions } from "./production-row-actions"

type ProductionTableProps = {
    data: Production[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (value: string) => void

    filters: {
        product_id?: number
        warehouse_id?: number
        status?: string
        from_date?: string
        to_date?: string
    }

    onFiltersChange: (filters: {
        product_id?: number
        warehouse_id?: number
        status?: string
        from_date?: string
        to_date?: string
    }) => void
}

const controlClass = "h-11 min-h-11 rounded-md border-slate-300 bg-white shadow-xs"

export function ProductionTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductionTableProps) {
    const groupedRows = useMemo(() => groupByStatus(data || []), [data])
    const totalPlan = data.reduce(
        (sum, item) => sum + sumItems(item.items ?? [], "quantity_plan"),
        0
    )
    const totalDone = data.reduce(
        (sum, item) => sum + sumItems(item.items ?? [], "quantity_done"),
        0
    )
    const materialGenerated = data.filter((item) =>
        ["MATERIAL_GENERATED", "FIFO_ALLOCATED", "OUTPUT_RECEIVED", "DONE"].includes(
            String(item.status ?? "").toUpperCase()
        )
    ).length
    const shortageRows = data.reduce(
        (sum, item) =>
            sum +
            (item.items ?? []).reduce(
                (childSum, productionItem) =>
                    childSum +
                    (productionItem.materials ?? []).filter((m) => Number(m.shortage_quantity) > 0).length,
                0
            ),
        0
    )
    const missingBom = data.reduce(
        (sum, item) =>
            sum +
            (item.items ?? []).filter((productionItem) => !productionItem.bom_id || productionItem.check_status === "THIEU_BOM").length,
        0
    )
    const currentPage = pagination.pageIndex + 1

    const setFilter = (key: keyof ProductionTableProps["filters"], value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SummaryMetric
                    icon={Factory}
                    label="Số lệnh"
                    value={formatNumber(data.length)}
                    hint="Lệnh sản xuất đang hiển thị"
                    tone="primary"
                />
                <SummaryMetric
                    icon={Scale}
                    label="Tổng SL kế hoạch"
                    value={formatNumber(totalPlan)}
                    hint="Tổng số lượng cần sản xuất"
                    tone="info"
                />
                <SummaryMetric
                    icon={PackageCheck}
                    label="Tổng SL nhập TP"
                    value={formatNumber(totalDone)}
                    hint={`${formatNumber(materialGenerated)} lệnh đã sinh vật tư`}
                    tone="success"
                />
                <SummaryMetric
                    icon={shortageRows || missingBom ? AlertTriangle : CheckCircle2}
                    label="Cảnh báo"
                    value={formatNumber(shortageRows + missingBom)}
                    hint={shortageRows || missingBom ? `${formatNumber(shortageRows)} thiếu tồn · ${formatNumber(missingBom)} thiếu BOM` : "Không có cảnh báo"}
                    tone={shortageRows || missingBom ? "warn" : "muted"}
                />
            </div>

            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="space-y-4 border-b py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Lệnh sản xuất đã ghi nhận</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formatNumber(data.length)} dòng
                                </Badge>
                            </div>
                            <CardDescription className="mt-1">
                                Theo dõi thành phẩm, kho nhập, tiến độ FIFO và cảnh báo thiếu vật tư.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit font-mono">
                            Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                        </Badge>
                    </div>

                    <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5" />
                            Bộ lọc lệnh sản xuất
                        </div>

                        <div className="space-y-2">
                            <div className="flex w-full flex-wrap items-center gap-2">
                                <SearchOnBlurInput
                                    value={keyword}
                                    onChange={onKeywordChange}
                                    placeholder="Tìm mã lệnh, mã hàng, tên thành phẩm..."
                                    wrapperClassName="relative h-11 min-w-[320px] flex-[1.2_1_0]"
                                    className={cn(controlClass, "pl-10")}
                                />

                                <AsyncSelect
                                    className={cn(controlClass, "min-w-[320px] flex-[1.8_1_0] py-0")}
                                    value={filters.product_id}
                                    onChange={(value: any) => setFilter("product_id", value || undefined)}
                                    placeholder="Sản phẩm"
                                    dataSource={{
                                        getList: listProducts,
                                        getById: getProduct,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={(product: any) => ({
                                        value: product.id,
                                        label: `${product.code} - ${product.name}`,
                                    })}
                                />
                            </div>

                            <div className="flex w-full flex-wrap items-center gap-2">
                                <AsyncSelect
                                    className={cn(controlClass, "min-w-[220px] flex-1 py-0")}
                                    value={filters.warehouse_id}
                                    onChange={(value: any) => setFilter("warehouse_id", value || undefined)}
                                    placeholder="Kho nhập"
                                    dataSource={{
                                        getList: listWarehouses,
                                        getById: getWarehouse,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={(warehouse: any) => ({
                                        value: warehouse.id,
                                        label: warehouse.name,
                                    })}
                                />

                                <Select
                                    value={filters.status ?? "ALL"}
                                    onValueChange={(value) => setFilter("status", value === "ALL" ? undefined : value)}
                                >
                                    <SelectTrigger className={cn(controlClass, "min-w-[200px] flex-1")}>
                                        <SelectValue placeholder="Trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="DRAFT">Nháp</SelectItem>
                                        <SelectItem value="PLANNED">Kế hoạch</SelectItem>
                                        <SelectItem value="MATERIAL_GENERATED">Đã sinh vật tư</SelectItem>
                                        <SelectItem value="FIFO_ALLOCATED">Đã chạy FIFO</SelectItem>
                                        <SelectItem value="OUTPUT_RECEIVED">Đã nhập TP</SelectItem>
                                        <SelectItem value="DONE">Hoàn tất</SelectItem>
                                        <SelectItem value="CANCELLED">Huỷ</SelectItem>
                                    </SelectContent>
                                </Select>

                                <DatePicker
                                    className={cn(
                                        "h-11 min-w-[160px] flex-1",
                                        "[&_button]:h-11 [&_button]:min-h-11 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                    )}
                                    value={filters.from_date}
                                    onChange={(value) => setFilter("from_date", value || undefined)}
                                    placeholder="Từ ngày"
                                />

                                <DatePicker
                                    className={cn(
                                        "h-11 min-w-[160px] flex-1",
                                        "[&_button]:h-11 [&_button]:min-h-11 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                    )}
                                    value={filters.to_date}
                                    onChange={(value) => setFilter("to_date", value || undefined)}
                                    placeholder="Đến ngày"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-6 py-3 text-sm">
                    <Badge variant="secondary" className="font-mono">
                        {formatNumber(groupedRows.length)} trạng thái
                    </Badge>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                        Trang hiện tại có {formatNumber(data.length)} lệnh sản xuất
                    </span>
                </div>

                <div className="space-y-6 p-6">
                    {groupedRows.map((group) => (
                        <section key={group.key} className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", group.iconClassName)}>
                                        <Factory className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold leading-tight">{group.label}</h3>
                                        <p className="text-muted-foreground text-xs">
                                            {formatNumber(group.items.length)} lệnh sản xuất
                                        </p>
                                    </div>
                                </div>
                                <GroupSummary rows={group.items} />
                            </div>

                            <div className="space-y-3">
                                {group.items.map((item, index) => (
                                    <ProductionItemCard
                                        key={item.id}
                                        index={index + 1}
                                        production={item}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}

                    {!data.length && (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                            <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-xl">
                                <Inbox className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-semibold">Không tìm thấy lệnh sản xuất</div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                    Thử đổi từ khóa, sản phẩm, kho hoặc khoảng ngày.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-muted/30 border-t px-6 py-4">
                    <CardPagination
                        pageIndex={pagination.pageIndex}
                        pageCount={pageCount}
                        onPageChange={setPageIndex}
                        className="px-0"
                    />
                </div>
            </Card>
        </div>
    )
}

function ProductionItemCard({ index, production }: { index: number; production: Production }) {
    const items = production.items ?? []
    const meta = getProductionStatusMeta(production.status)
    const plan = totalItemValue(items, "quantity_plan")
    const done = totalItemValue(items, "quantity_done")
    const unit = getCommonUnit(items)
    const percent = plan > 0 ? Math.min(100, Math.round((done / plan) * 100)) : 0
    const shortage = countShortageRows(production)
    const missingBom = countMissingBom(production)
    const totalCost = totalItemValue(items, "total_cost")

    return (
        <div
            className={cn(
                "group bg-card overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md",
                (shortage > 0 || missingBom > 0) && "border-destructive/30"
            )}
        >
            <div className="bg-muted/30 grid border-b lg:grid-cols-[56px_minmax(300px,1.4fr)_minmax(220px,0.9fr)_72px]">
                <div className="bg-muted/50 text-muted-foreground flex items-center justify-center border-b font-mono text-sm font-semibold tabular-nums lg:border-b-0 lg:border-r">
                    #{index}
                </div>
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/production/orders/$id"
                            params={{ id: String(production.id) }}
                            className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold hover:underline"
                        >
                            {production.production_no || `Lệnh #${production.id}`}
                        </Link>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Ngày lệnh {formatDate(production.production_date)}
                        </span>
                        {production.costing_period ? <span>Kỳ giá thành {production.costing_period}</span> : null}
                    </div>
                    {production.note ? (
                        <div className="text-muted-foreground mt-2 line-clamp-2 text-sm">{production.note}</div>
                    ) : null}
                </div>
                <div className="border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Bước xử lý</div>
                    <div className="mt-1 text-sm font-semibold">{meta.next}</div>
                    <div className="text-muted-foreground mt-2 text-xs">
                        {formatNumber(items.length)} thành phẩm trong lệnh
                    </div>
                </div>
                <div className="flex items-center justify-center p-3">
                    <ProductionRowActions row={{ original: production } as any} />
                </div>
            </div>

            <div className="grid divide-y lg:grid-cols-5 lg:divide-x lg:divide-y-0">
                <InfoBlock title="Thành phẩm" icon={Package} className="lg:col-span-2">
                    <FinishedProducts items={items} />
                </InfoBlock>

                <InfoBlock title="Kho nhập" icon={Warehouse}>
                    <Warehouses items={items} />
                </InfoBlock>

                <InfoBlock title="Sản lượng" icon={Scale}>
                    <div className="space-y-1.5">
                        <QuantityLine label="Kế hoạch" value={plan} unit={unit} />
                        <QuantityLine label="Nhập TP" value={done} unit={unit} strong />
                        <div className="h-1.5 rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="text-muted-foreground text-xs">Hoàn thành {formatNumber(percent)}%</div>
                    </div>
                </InfoBlock>

                <InfoBlock title="Giá thành / cảnh báo" icon={shortage || missingBom ? AlertTriangle : CheckCircle2}>
                    <div className="text-lg font-bold tabular-nums">{formatCurrency(totalCost)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        {formatCurrency(avgUnitCost(items))}/ĐV
                    </div>
                    <Separator className="my-2" />
                    <Warnings missingBom={missingBom} shortage={shortage} production={production} />
                </InfoBlock>
            </div>
        </div>
    )
}

function FinishedProducts({ items }: { items: ProductionItem[] }) {
    if (!items.length) {
        return <div className="text-muted-foreground text-sm">Chưa có thành phẩm</div>
    }

    return (
        <div className="space-y-2">
            {items.slice(0, 3).map((item) => (
                <div key={item.id} className="min-w-0 leading-tight">
                    <div className="font-semibold">{item.product?.code || `#${item.product_id}`}</div>
                    <div className="text-muted-foreground mt-1 line-clamp-2 text-sm">{item.product?.name || "-"}</div>
                </div>
            ))}
            {items.length > 3 ? (
                <Badge variant="outline" className="text-xs">
                    +{formatNumber(items.length - 3)} thành phẩm
                </Badge>
            ) : null}
        </div>
    )
}

function Warehouses({ items }: { items: ProductionItem[] }) {
    const warehouses = Array.from(
        new Set(
            items
                .map((item) => item.warehouse?.name || (item.warehouse_id ? `Kho #${item.warehouse_id}` : ""))
                .filter(Boolean)
        )
    )

    if (!warehouses.length) return <div className="text-muted-foreground text-sm">Chưa chọn kho</div>

    return (
        <div className="space-y-1.5">
            {warehouses.slice(0, 3).map((name) => (
                <div key={name} className="text-sm font-semibold">
                    {name}
                </div>
            ))}
            {warehouses.length > 3 ? (
                <div className="text-muted-foreground text-xs">+{formatNumber(warehouses.length - 3)} kho khác</div>
            ) : null}
        </div>
    )
}

function Warnings({
    missingBom,
    shortage,
    production,
}: {
    missingBom: number
    shortage: number
    production: Production
}) {
    const openWarnings = (production.warnings ?? []).filter((warning) => !warning.resolved_at)

    if (!missingBom && !shortage && !openWarnings.length) {
        return <Badge variant="secondary">Ổn</Badge>
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {missingBom > 0 ? <Badge variant="destructive">{formatNumber(missingBom)} thiếu BOM</Badge> : null}
            {shortage > 0 ? <Badge variant="destructive">{formatNumber(shortage)} thiếu tồn</Badge> : null}
            {openWarnings.length > 0 ? <Badge variant="outline">{formatNumber(openWarnings.length)} cảnh báo</Badge> : null}
        </div>
    )
}

function InfoBlock({
    title,
    icon: Icon,
    children,
    className,
}: {
    title: string
    icon: LucideIcon
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("min-w-0 p-4", className)}>
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                <Icon className="h-3.5 w-3.5" />
                {title}
            </div>
            {children}
        </div>
    )
}

function QuantityLine({
    label,
    value,
    unit,
    strong,
}: {
    label: string
    value: number
    unit?: string
    strong?: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn("tabular-nums", strong ? "font-bold text-emerald-700 dark:text-emerald-400" : "font-semibold")}>
                {formatNumber(value)}{unit ? ` ${unit}` : ""}
            </span>
        </div>
    )
}

function SummaryMetric({
    icon: Icon,
    label,
    value,
    hint,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    hint: string
    tone?: "primary" | "success" | "info" | "warn" | "muted"
}) {
    const toneClass =
        tone === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : tone === "info"
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : tone === "warn"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : tone === "primary"
                        ? "bg-primary/10 text-primary border-primary/10"
                        : "bg-muted text-muted-foreground border-transparent"

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", toneClass)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-muted-foreground text-sm font-semibold">{label}</div>
                    <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
                    <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">{hint}</div>
                </div>
            </div>
        </div>
    )
}

function GroupSummary({ rows }: { rows: Production[] }) {
    const plan = rows.reduce((sum, row) => sum + sumItems(row.items ?? [], "quantity_plan"), 0)
    const done = rows.reduce((sum, row) => sum + sumItems(row.items ?? [], "quantity_done"), 0)

    return (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
                KH: <b className="text-foreground">{formatNumber(plan)}</b>
            </span>
            <span>
                Nhập TP: <b className="text-foreground">{formatNumber(done)}</b>
            </span>
        </div>
    )
}

function groupByStatus(rows: Production[]) {
    const map = new Map<string, Production[]>()

    for (const row of rows) {
        const key = String(row.status || "UNKNOWN").toUpperCase()
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(row)
    }

    return Array.from(map.entries()).map(([key, items]) => {
        const meta = getProductionStatusMeta(key)
        return {
            key,
            label: meta.label,
            iconClassName: key === "CANCELLED"
                ? "bg-destructive/10 text-destructive"
                : key === "DONE" || key === "OUTPUT_RECEIVED"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-primary/10 text-primary",
            items,
        }
    })
}

function countShortageRows(production: Production) {
    return (production.items ?? []).reduce(
        (sum, item) => sum + (item.materials ?? []).filter((material) => Number(material.shortage_quantity) > 0).length,
        0
    )
}

function countMissingBom(production: Production) {
    return (production.items ?? []).filter((item) => !item.bom_id || item.check_status === "THIEU_BOM").length
}

function sumItems(items: Production["items"], key: keyof NonNullable<Production["items"]>[number]) {
    return (items ?? []).reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

function totalItemValue(items: ProductionItem[], key: keyof ProductionItem) {
    return items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

function avgUnitCost(items: ProductionItem[]) {
    const done = totalItemValue(items, "quantity_done")
    if (done <= 0) return undefined
    return totalItemValue(items, "total_cost") / done
}

function getCommonUnit(items: ProductionItem[]) {
    const units = Array.from(
        new Set(items.map((item) => item.product?.unit).filter(Boolean))
    )
    return units.length === 1 ? units[0] : ""
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}
