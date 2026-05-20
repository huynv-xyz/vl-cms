import { useMemo } from "react"
import type { PaginationState, OnChangeFn } from "@tanstack/react-table"
import {
    AlertTriangle,
    Boxes,
    Filter,
    Inbox,
    Layers,
    Package,
    PackageCheck,
    Tag,
    Warehouse,
    type LucideIcon,
} from "lucide-react"

import type { InventorySummary } from "../data/schema"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"

type Props = {
    data: InventorySummary[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: {
        product_id?: number
        warehouse_id?: number
    }

    onFiltersChange: (f: {
        product_id?: number
        warehouse_id?: number
    }) => void
}

type WarehouseGroup = {
    key: string
    label: string
    sub?: string
    items: InventorySummary[]
}

const controlClass = "h-11 min-h-11 rounded-md border-slate-300 bg-white shadow-xs"

export function SummaryTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const totalQuantity = sum(data, "total_quantity")
    const totalValue = sum(data, "total_value")
    const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0
    const warehouseCount = new Set(data.map((row) => row.warehouse_id).filter(Boolean)).size
    const productCount = new Set(data.map((row) => row.product_id).filter(Boolean)).size
    const missingCostCount = data.filter((row) => Number(row.total_quantity || 0) > 0 && Number(row.total_value || 0) <= 0).length
    const groupedRows = useMemo(() => groupByWarehouse(data), [data])

    const currentPage = pagination.pageIndex + 1

    const setFilter = (key: keyof Props["filters"], value: any) => {
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
                    icon={Boxes}
                    label="Tổng tồn"
                    value={formatNumber(totalQuantity)}
                    hint="Số lượng của các dòng đang hiển thị"
                    tone="success"
                />
                <SummaryMetric
                    icon={Warehouse}
                    label="Tổng giá trị"
                    value={formatCurrency(totalValue)}
                    hint="Tổng tiền tồn kho"
                    tone="primary"
                />
                <SummaryMetric
                    icon={Tag}
                    label="Giá vốn bình quân"
                    value={formatCurrency(avgCost)}
                    hint="Tổng giá trị / tổng tồn"
                    tone="info"
                />
                <SummaryMetric
                    icon={missingCostCount ? AlertTriangle : PackageCheck}
                    label="Phạm vi"
                    value={`${formatNumber(productCount)} SP · ${formatNumber(warehouseCount)} kho`}
                    hint={missingCostCount ? `${formatNumber(missingCostCount)} dòng thiếu giá vốn` : "Theo bộ lọc hiện tại"}
                    tone={missingCostCount ? "warn" : "muted"}
                />
            </div>

            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="space-y-4 border-b py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Tồn kho đã ghi nhận</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formatNumber(data.length)} dòng
                                </Badge>
                            </div>
                            <CardDescription className="mt-1">
                                Xem tồn kho theo kho, sản phẩm, số lượng và giá trị tồn.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit font-mono">
                            Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                        </Badge>
                    </div>

                    <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5" />
                            Bộ lọc tồn kho
                        </div>

                        <div className="space-y-2">
                            <div className="flex w-full flex-wrap items-center gap-2">
                                <SearchOnBlurInput
                                    value={keyword}
                                    onChange={onKeywordChange}
                                    placeholder="Tìm theo mã hoặc tên sản phẩm..."
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
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: `${x.code} - ${x.name}`,
                                    })}
                                />
                            </div>

                            <div className="flex w-full flex-wrap items-center gap-2">
                                <AsyncSelect
                                    className={cn(controlClass, "min-w-[260px] flex-1 py-0")}
                                    value={filters.warehouse_id}
                                    onChange={(value: any) => setFilter("warehouse_id", value || undefined)}
                                    placeholder="Kho hàng"
                                    dataSource={{
                                        getList: listWarehouses,
                                        getById: getWarehouse,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: x.name,
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-6 py-3 text-sm">
                    <Badge variant="secondary" className="font-mono">
                        {formatNumber(groupedRows.length)} kho
                    </Badge>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                        Trang hiện tại có {formatNumber(data.length)} dòng tồn kho
                    </span>
                </div>

                <div className="space-y-6 p-6">
                    {groupedRows.map((group) => (
                        <section key={group.key} className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                                        <Warehouse className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold leading-tight">{group.label}</h3>
                                        <p className="text-muted-foreground text-xs">
                                            {group.sub ? `${group.sub} · ` : ""}
                                            {formatNumber(group.items.length)} dòng tồn
                                        </p>
                                    </div>
                                </div>
                                <GroupSummary rows={group.items} />
                            </div>

                            <div className="space-y-3">
                                {group.items.map((item, index) => (
                                    <InventoryItemCard
                                        key={`${item.warehouse_id}-${item.product_id}-${item.id ?? index}`}
                                        index={index + 1}
                                        item={item}
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
                                <div className="font-semibold">Không tìm thấy dòng tồn kho</div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                    Thử đổi từ khóa, sản phẩm hoặc kho hàng.
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

function InventoryItemCard({ index, item }: { index: number; item: InventorySummary }) {
    const quantity = Number(item.total_quantity ?? 0)
    const value = Number(item.total_value ?? 0)
    const avgCost = quantity > 0 ? value / quantity : 0
    const status = getInventoryStatus(item)
    const product = item.product

    return (
        <div
            className={cn(
                "group bg-card overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md",
                status.tone === "bad" && "border-destructive/30",
                status.tone === "warn" && "border-amber-300/70"
            )}
        >
            <div className="bg-muted/30 grid border-b lg:grid-cols-[56px_minmax(280px,1.4fr)_minmax(180px,0.8fr)]">
                <div className="bg-muted/50 text-muted-foreground flex items-center justify-center border-b font-mono text-sm font-semibold tabular-nums lg:border-b-0 lg:border-r">
                    #{index}
                </div>
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {product?.code ?? item.product_id}
                        </span>
                    </div>
                    <div className="mt-2 text-base font-bold leading-snug">
                        {product?.name ?? "-"}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        ĐVT: <span className="font-medium">{product?.unit || "đơn vị"}</span>
                    </div>
                </div>
                <div className="p-4">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Kho hàng</div>
                    <div className="mt-1 text-sm font-semibold">{item.warehouse?.name ?? "-"}</div>
                    <div className="text-muted-foreground mt-2 text-xs">Mã kho: {item.warehouse_id ?? "-"}</div>
                </div>
            </div>

            <div className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                <InfoBlock title="Số lượng tồn" icon={Boxes}>
                    <div className="text-xl font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
                        {formatNumber(quantity)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">{product?.unit || "đơn vị"}</div>
                </InfoBlock>

                <InfoBlock title="Giá trị tồn" icon={Warehouse}>
                    <div className="text-xl font-bold tabular-nums">{formatCurrency(value)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">VNĐ</div>
                </InfoBlock>

                <InfoBlock title="Giá vốn bình quân" icon={Tag}>
                    <div className="text-xl font-bold tabular-nums">{formatCurrency(avgCost)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Giá trị / số lượng</div>
                </InfoBlock>

                <InfoBlock title="Tình trạng" icon={status.icon}>
                    <div className={cn("text-xl font-bold", status.textClassName)}>{status.label}</div>
                    <div className="text-muted-foreground mt-1 text-xs">{status.description}</div>
                </InfoBlock>
            </div>
        </div>
    )
}

function InfoBlock({
    title,
    icon: Icon,
    children,
}: {
    title: string
    icon: LucideIcon
    children: React.ReactNode
}) {
    return (
        <div className="p-4">
            <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <Icon className="h-3 w-3" />
                {title}
            </div>
            <div>{children}</div>
        </div>
    )
}

function GroupSummary({ rows }: { rows: InventorySummary[] }) {
    const quantity = sum(rows, "total_quantity")
    const value = sum(rows, "total_value")

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="text-emerald-700">
                Tồn {formatNumber(quantity)}
            </Badge>
            <Badge variant="secondary">
                Giá trị {formatCurrency(value)}
            </Badge>
        </div>
    )
}

function SummaryMetric({
    icon: Icon,
    label,
    value,
    hint,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
    hint: string
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]

    return (
        <Card className={cn("gap-0 py-4 shadow-sm transition-shadow hover:shadow-md", styles.ring)}>
            <CardContent className="flex items-center gap-3 px-4">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", styles.iconBg)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate text-[11px] font-semibold uppercase tracking-wider">
                        {label}
                    </div>
                    <div className={cn("mt-1 truncate text-xl font-bold tabular-nums", styles.value)}>
                        {value}
                    </div>
                    <div className="text-muted-foreground mt-1 truncate text-xs">{hint}</div>
                </div>
            </CardContent>
        </Card>
    )
}

const SUMMARY_TONES = {
    info: {
        ring: "border-blue-200/60 dark:border-blue-900/40",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        value: "",
    },
    primary: {
        ring: "border-primary/20 bg-primary/[0.02]",
        iconBg: "bg-primary/10 text-primary",
        value: "text-primary",
    },
    success: {
        ring: "border-emerald-200/60 dark:border-emerald-900/40",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        value: "text-emerald-700 dark:text-emerald-400",
    },
    warn: {
        ring: "border-amber-300/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20",
        iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        value: "text-amber-700 dark:text-amber-400",
    },
    muted: {
        ring: "border-border/60",
        iconBg: "bg-muted text-muted-foreground",
        value: "text-muted-foreground",
    },
} as const

function getInventoryStatus(row: InventorySummary) {
    const quantity = Number(row.total_quantity ?? 0)
    const value = Number(row.total_value ?? 0)

    if (quantity <= 0) {
        return {
            label: "Hết tồn",
            description: "Số lượng tồn bằng 0 hoặc âm",
            icon: Inbox,
            tone: "muted",
            variant: "secondary" as const,
            className: "",
            textClassName: "text-muted-foreground",
        }
    }

    if (value <= 0) {
        return {
            label: "Thiếu giá vốn",
            description: "Có số lượng nhưng chưa có giá trị tồn",
            icon: AlertTriangle,
            tone: "bad",
            variant: "destructive" as const,
            className: "",
            textClassName: "text-destructive",
        }
    }

    return {
        label: "Còn tồn",
        description: "Có số lượng và giá trị tồn",
        icon: PackageCheck,
        tone: "success",
        variant: "default" as const,
        className: "bg-emerald-600 hover:bg-emerald-600",
        textClassName: "text-emerald-700 dark:text-emerald-400",
    }
}

function groupByWarehouse(rows: InventorySummary[]) {
    const groups = new Map<string, WarehouseGroup>()

    rows.forEach((row) => {
        const key = row.warehouse_id ? String(row.warehouse_id) : "unknown"
        const label = row.warehouse?.name || "Chưa gắn kho"
        const sub = row.warehouse_id ? `#${row.warehouse_id}` : undefined

        if (!groups.has(key)) {
            groups.set(key, { key, label, sub, items: [] })
        }
        groups.get(key)!.items.push(row)
    })

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "vi"))
}

function sum(rows: InventorySummary[], key: "total_quantity" | "total_value") {
    return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)
}
