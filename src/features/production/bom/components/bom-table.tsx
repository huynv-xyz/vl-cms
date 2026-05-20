import { useMemo } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    Boxes,
    CalendarDays,
    CheckCircle2,
    Filter,
    Inbox,
    Layers3,
    Package,
    PackageCheck,
    ScrollText,
    XCircle,
    type LucideIcon,
} from "lucide-react"

import { getProduct, listProducts } from "@/api/product"
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
import type { Product } from "@/features/product/data/schema"
import { cn, formatNumber } from "@/lib/utils"
import type { ProductBom, ProductBomItem } from "../data/schema"
import { ProductBomRowActions } from "./bom-row-actions"
import { useProductBoms } from "./boms-provider"

type ProductBomFilters = {
    product_id?: number
    active?: string
}

type ProductBomTableProps = {
    data: ProductBom[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: ProductBomFilters
    onFiltersChange: (filters: ProductBomFilters) => void
}

type BomGroup = {
    key: string
    label: string
    sub: string
    items: ProductBom[]
}

const controlClass = "h-11 min-h-11 rounded-md border-slate-300 bg-white shadow-xs"

const mapProductOption = (x: Product) => ({
    value: x.id,
    label: `${x.code} - ${x.name}`,
})

export function ProductBomTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: ProductBomTableProps) {
    const groupedRows = useMemo(() => groupByActive(data || []), [data])
    const totalItemLines = data.reduce((sum, bom) => sum + (bom.items?.length ?? 0), 0)
    const nvlLines = data.reduce((sum, bom) => sum + countByMaterialType(bom.items ?? [], "NVL"), 0)
    const packagingLines = data.reduce((sum, bom) => sum + countByMaterialType(bom.items ?? [], "BB"), 0)
    const activeCount = data.filter(activeOf).length
    const currentPage = pagination.pageIndex + 1

    const setFilter = (key: keyof ProductBomFilters, value: any) => {
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
                    icon={Layers3}
                    label="Số BOM"
                    value={formatNumber(data.length)}
                    hint="Định mức đang hiển thị"
                    tone="primary"
                />
                <SummaryMetric
                    icon={PackageCheck}
                    label="Đang dùng"
                    value={formatNumber(activeCount)}
                    hint="BOM còn hiệu lực sử dụng"
                    tone="success"
                />
                <SummaryMetric
                    icon={ScrollText}
                    label="Dòng vật tư"
                    value={formatNumber(totalItemLines)}
                    hint={`${formatNumber(nvlLines)} NVL · ${formatNumber(packagingLines)} bao bì`}
                    tone="info"
                />
                <SummaryMetric
                    icon={Boxes}
                    label="Bình quân"
                    value={data.length ? formatNumber(totalItemLines / data.length) : "0"}
                    hint="Dòng vật tư / BOM"
                    tone="muted"
                />
            </div>

            <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
                <CardHeader className="space-y-4 border-b py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Định mức BOM đã khai báo</CardTitle>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {formatNumber(data.length)} dòng
                                </Badge>
                            </div>
                            <CardDescription className="mt-1">
                                Xem định mức nguyên vật liệu và bao bì theo từng thành phẩm sản xuất.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="w-fit font-mono">
                            Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                        </Badge>
                    </div>

                    <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                        <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5" />
                            Bộ lọc định mức
                        </div>

                        <div className="space-y-2">
                            <div className="flex w-full flex-wrap items-center gap-2">
                                <SearchOnBlurInput
                                    value={keyword}
                                    onChange={onKeywordChange}
                                    placeholder="Tìm mã, tên thành phẩm hoặc phiên bản..."
                                    wrapperClassName="relative h-11 min-w-[320px] flex-[1.2_1_0]"
                                    className={cn(controlClass, "pl-10")}
                                />

                                <AsyncSelect
                                    className={cn(controlClass, "min-w-[320px] flex-[1.8_1_0] py-0")}
                                    value={filters.product_id}
                                    onChange={(value: number | undefined) => setFilter("product_id", value || undefined)}
                                    placeholder="Thành phẩm"
                                    searchPlaceholder="Tìm thành phẩm"
                                    dataSource={{
                                        getList: listProducts,
                                        getById: getProduct,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={mapProductOption}
                                />
                            </div>

                            <div className="flex w-full flex-wrap items-center gap-2">
                                <Select
                                    value={filters.active || "ALL"}
                                    onValueChange={(value) => setFilter("active", value === "ALL" ? undefined : value)}
                                >
                                    <SelectTrigger className={cn(controlClass, "min-w-[220px] flex-1")}>
                                        <SelectValue placeholder="Trạng thái" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="true">Đang dùng</SelectItem>
                                        <SelectItem value="false">Ngưng dùng</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-6 py-3 text-sm">
                    <Badge variant="secondary" className="font-mono">
                        {formatNumber(groupedRows.length)} nhóm trạng thái
                    </Badge>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                        Trang hiện tại có {formatNumber(data.length)} BOM
                    </span>
                </div>

                <div className="space-y-6 p-6">
                    {groupedRows.map((group) => (
                        <section key={group.key} className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-md",
                                        group.key === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                                    )}>
                                        {group.key === "ACTIVE" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold leading-tight">{group.label}</h3>
                                        <p className="text-muted-foreground text-xs">{group.sub}</p>
                                    </div>
                                </div>
                                <GroupSummary rows={group.items} />
                            </div>

                            <div className="space-y-3">
                                {group.items.map((bom, index) => (
                                    <BomItemCard
                                        key={bom.id}
                                        index={index + 1}
                                        bom={bom}
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
                                <div className="font-semibold">Không tìm thấy BOM</div>
                                <div className="text-muted-foreground mt-1 text-sm">
                                    Thử đổi từ khóa, thành phẩm hoặc trạng thái.
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

function BomItemCard({ index, bom }: { index: number; bom: ProductBom }) {
    const { openDetail } = useProductBoms()
    const active = activeOf(bom)
    const items = bom.items ?? []
    const nvlCount = countByMaterialType(items, "NVL")
    const packagingCount = countByMaterialType(items, "BB")

    return (
        <div className="group bg-card overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
            <div className="bg-muted/30 grid border-b lg:grid-cols-[56px_minmax(320px,1.4fr)_minmax(220px,0.8fr)_72px]">
                <div className="bg-muted/50 text-muted-foreground flex items-center justify-center border-b font-mono text-sm font-semibold tabular-nums lg:border-b-0 lg:border-r">
                    #{index}
                </div>
                <button
                    type="button"
                    className="min-w-0 border-b p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:border-b-0 lg:border-r"
                    onClick={() => openDetail(bom)}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {bom.product?.code || `#${bom.product_id}`}
                        </span>
                        <Badge variant={active ? "secondary" : "outline"}>
                            {active ? "Đang dùng" : "Ngưng dùng"}
                        </Badge>
                    </div>
                    <div className="mt-2 line-clamp-2 text-base font-bold leading-snug">
                        {bom.product?.name || "Thành phẩm"}
                    </div>
                    {bom.note ? (
                        <div className="text-muted-foreground mt-1 line-clamp-2 text-sm">{bom.note}</div>
                    ) : null}
                </button>
                <div className="border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Phiên bản / hiệu lực</div>
                    <div className="mt-1 font-mono text-sm font-semibold">{bom.version || "-"}</div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-1 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(bom.valid_from)} - {formatDate(bom.valid_to)}
                    </div>
                </div>
                <div className="flex items-center justify-center p-3">
                    <ProductBomRowActions row={{ original: bom } as any} />
                </div>
            </div>

            <div className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                <InfoBlock title="Dòng vật tư" icon={ScrollText}>
                    <div className="text-2xl font-bold tabular-nums">{formatNumber(items.length)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Tổng dòng trong BOM</div>
                </InfoBlock>

                <InfoBlock title="Nguyên vật liệu" icon={Package}>
                    <div className="text-xl font-bold tabular-nums">{formatNumber(nvlCount)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Dòng NVL chính</div>
                </InfoBlock>

                <InfoBlock title="Bao bì / phụ liệu" icon={Boxes}>
                    <div className="text-xl font-bold tabular-nums">{formatNumber(packagingCount)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Dòng BB trong BOM</div>
                </InfoBlock>

                <InfoBlock title="Vật tư xem nhanh" icon={Layers3}>
                    <MaterialsPreview items={items} />
                </InfoBlock>
            </div>
        </div>
    )
}

function MaterialsPreview({ items }: { items: ProductBomItem[] }) {
    if (!items.length) {
        return <div className="text-muted-foreground text-sm">Chưa có vật tư</div>
    }

    return (
        <div className="space-y-1.5">
            {items.slice(0, 3).map((item) => (
                <div key={item.id} className="min-w-0 text-sm">
                    <div className="truncate font-semibold">
                        {item.material_product?.code || `#${item.material_product_id}`}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                        {formatNumber(item.quantity)} {item.unit || ""} · {item.material_type}
                    </div>
                </div>
            ))}
            {items.length > 3 ? (
                <Badge variant="outline" className="text-xs">
                    +{formatNumber(items.length - 3)} dòng
                </Badge>
            ) : null}
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
        <div className="min-w-0 p-4">
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                <Icon className="h-3.5 w-3.5" />
                {title}
            </div>
            {children}
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

function GroupSummary({ rows }: { rows: ProductBom[] }) {
    const itemCount = rows.reduce((sum, row) => sum + (row.items?.length ?? 0), 0)

    return (
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
                BOM: <b className="text-foreground">{formatNumber(rows.length)}</b>
            </span>
            <span>
                Dòng vật tư: <b className="text-foreground">{formatNumber(itemCount)}</b>
            </span>
        </div>
    )
}

function groupByActive(rows: ProductBom[]): BomGroup[] {
    const activeRows = rows.filter(activeOf)
    const inactiveRows = rows.filter((row) => !activeOf(row))

    return [
        {
            key: "ACTIVE",
            label: "Đang dùng",
            sub: `${formatNumber(activeRows.length)} BOM còn hiệu lực`,
            items: activeRows,
        },
        {
            key: "INACTIVE",
            label: "Ngưng dùng",
            sub: `${formatNumber(inactiveRows.length)} BOM không còn dùng`,
            items: inactiveRows,
        },
    ].filter((group) => group.items.length)
}

function countByMaterialType(items: ProductBomItem[], type: string) {
    return items.filter((item) => String(item.material_type || "").toUpperCase() === type).length
}

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? false
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}
