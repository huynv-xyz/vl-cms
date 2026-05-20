import { useMemo } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    ArrowDownLeft,
    ArrowUpRight,
    CalendarDays,
    FileText,
    Filter,
    Inbox,
    Package,
    Scale,
    Warehouse,
} from "lucide-react"

import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { CardPagination } from "@/components/table/card-pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn, formatNumber } from "@/lib/utils"
import type { InventoryLedgerReportRow } from "../data/schema"
import { getDocTypeMeta, INVENTORY_DOC_TYPES } from "../data/schema"

type Props = {
    data: InventoryLedgerReportRow[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (v: string) => void
    filters: {
        product_id?: number
        warehouse_id?: number
        doc_type?: string
        from_date?: string
        to_date?: string
    }
    onFiltersChange: (f: Props["filters"]) => void
}

type LedgerGroup = {
    key: string
    label: string
    sub?: string
    items: InventoryLedgerReportRow[]
}

const controlClass = "h-11 min-h-11 rounded-md border-slate-300 bg-white shadow-xs"

export function InventoryLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const groupedRows = useMemo(() => groupByProduct(data || []), [data])
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
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="space-y-4 border-b py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">Sổ kho đã ghi nhận</CardTitle>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {formatNumber((data || []).length)} dòng
                            </Badge>
                        </div>
                        <CardDescription className="mt-1">
                            Xem lịch sử nhập, xuất và tồn sau phát sinh theo từng hàng hóa.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit font-mono">
                        Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                    </Badge>
                </div>

                <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                    <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                        <Filter className="h-3.5 w-3.5" />
                        Bộ lọc sổ kho
                    </div>

                    <div className="space-y-2">
                        <div className="flex w-full flex-wrap items-center gap-2">
                            <SearchOnBlurInput
                                value={keyword}
                                onChange={onKeywordChange}
                                placeholder="Tìm chứng từ, mã hàng, tên hàng..."
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
                                placeholder="Kho hàng"
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
                                value={filters.doc_type ?? "ALL"}
                                onValueChange={(value) => setFilter("doc_type", value === "ALL" ? undefined : value)}
                            >
                                <SelectTrigger className={cn(controlClass, "min-w-[200px] flex-1")}>
                                    <SelectValue placeholder="Loại chứng từ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả chứng từ</SelectItem>
                                    {INVENTORY_DOC_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
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
                    {formatNumber(groupedRows.length)} hàng hóa
                </Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                    Trang hiện tại có {formatNumber((data || []).length)} dòng sổ kho
                </span>
            </div>

            <div className="space-y-6 p-6">
                {groupedRows.map((group) => (
                    <section key={group.key} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold leading-tight">{group.label}</h3>
                                    <p className="text-muted-foreground text-xs">
                                        {group.sub ? `${group.sub} · ` : ""}
                                        {formatNumber(group.items.length)} dòng phát sinh
                                    </p>
                                </div>
                            </div>
                            <GroupSummary rows={group.items} />
                        </div>

                        <div className="space-y-3">
                            {group.items.map((item, index) => (
                                <LedgerItemCard
                                    key={`${item.id}-${index}`}
                                    index={index + 1}
                                    item={item}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                {!(data || []).length && (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                        <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-xl">
                            <Inbox className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="font-semibold">Không tìm thấy dòng sổ kho</div>
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
    )
}

function LedgerItemCard({ index, item }: { index: number; item: InventoryLedgerReportRow }) {
    const meta = getDocTypeMeta(item.doc_type)
    const movement = Number(item.quantity_in || 0) - Number(item.quantity_out || 0)
    const MovementIcon = movement >= 0 ? ArrowDownLeft : ArrowUpRight

    return (
        <div className="group bg-card overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
            <div className="bg-muted/30 grid border-b lg:grid-cols-[56px_minmax(280px,1.4fr)_minmax(180px,0.8fr)]">
                <div className="bg-muted/50 text-muted-foreground flex items-center justify-center border-b font-mono text-sm font-semibold tabular-nums lg:border-b-0 lg:border-r">
                    #{index}
                </div>
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {item.doc_no || `#${item.id}`}
                        </span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Ngày {formatDate(item.posting_date)}
                        </span>
                        {item.ref_id ? <span>Tham chiếu #{item.ref_id}</span> : null}
                    </div>
                </div>
                <div className="p-4">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Kho hàng</div>
                    <div className="mt-1 text-sm font-semibold">{item.warehouse_name || "-"}</div>
                    <div className="text-muted-foreground mt-2 text-xs">Mã kho: {item.warehouse_id ?? "-"}</div>
                </div>
            </div>

            <div className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                <InfoBlock title="Hàng hóa" icon={Package}>
                    <div className="font-semibold">{item.product_code || "-"}</div>
                    <div className="text-muted-foreground mt-1 line-clamp-2 text-sm">{item.product_name || "-"}</div>
                </InfoBlock>

                <InfoBlock title="Nhập / Xuất" icon={MovementIcon}>
                    <QuantityLine label="Nhập" value={item.quantity_in} tone="in" />
                    <QuantityLine label="Xuất" value={item.quantity_out} tone="out" />
                    <Separator className="my-1" />
                    <QuantityLine
                        label={movement >= 0 ? "Tăng tồn" : "Giảm tồn"}
                        value={Math.abs(movement)}
                        tone={movement >= 0 ? "in" : "out"}
                        strong
                    />
                </InfoBlock>

                <InfoBlock title="Tồn sau phát sinh" icon={Scale}>
                    <div className="text-xl font-bold tabular-nums">{formatNumber(item.balance_quantity ?? 0)}</div>
                    <div className="text-muted-foreground mt-1 text-xs">Số lượng sau dòng này</div>
                </InfoBlock>

                <InfoBlock title="Chứng từ" icon={FileText}>
                    <div className="text-sm font-semibold">{meta.label}</div>
                    <div className="text-muted-foreground mt-1 text-xs">{item.doc_no || "-"}</div>
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
    icon: React.ComponentType<{ className?: string }>
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

function QuantityLine({
    label,
    value,
    tone,
    strong,
}: {
    label: string
    value?: number
    tone: "in" | "out"
    strong?: boolean
}) {
    const quantity = Number(value || 0)

    return (
        <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span
                className={cn(
                    "text-right tabular-nums",
                    strong ? "font-bold" : "font-semibold",
                    !quantity && "text-muted-foreground",
                    tone === "in" && quantity > 0 && "text-emerald-600",
                    tone === "out" && quantity > 0 && "text-rose-600"
                )}
            >
                {quantity ? formatNumber(quantity) : "-"}
            </span>
        </div>
    )
}

function GroupSummary({ rows }: { rows: InventoryLedgerReportRow[] }) {
    const quantityIn = sumBy(rows, "quantity_in")
    const quantityOut = sumBy(rows, "quantity_out")
    const latestBalance = rows.length ? Number(rows[rows.length - 1]?.balance_quantity || 0) : 0

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="text-emerald-700">
                Nhập {formatNumber(quantityIn)}
            </Badge>
            <Badge variant="outline" className="text-rose-600">
                Xuất {formatNumber(quantityOut)}
            </Badge>
            <Badge variant="secondary">
                Tồn cuối {formatNumber(latestBalance)}
            </Badge>
        </div>
    )
}

function groupByProduct(rows: InventoryLedgerReportRow[]) {
    const groups = new Map<string, LedgerGroup>()

    rows.forEach((row) => {
        const key = row.product_id ? String(row.product_id) : `unknown-${row.product_code || "none"}`
        const label = row.product_name || "Chưa gắn hàng hóa"
        const sub = row.product_code || (row.product_id ? `#${row.product_id}` : undefined)

        if (!groups.has(key)) {
            groups.set(key, { key, label, sub, items: [] })
        }
        groups.get(key)!.items.push(row)
    })

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "vi"))
}

function sumBy(rows: InventoryLedgerReportRow[], field: "quantity_in" | "quantity_out") {
    return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0)
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}
