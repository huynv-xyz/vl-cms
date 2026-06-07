import type { ColumnDef, OnChangeFn, PaginationState } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { CrudTable } from "@/components/crud/crud-table"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { InventoryLot } from "@/features/inventory/lot/data/schema"

type Filters = {
    expiry_status?: string
    warehouse_id?: number
}

type Props = {
    items: InventoryLot[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}

const columns: ColumnDef<InventoryLot>[] = [
    buildIndexColumn(),

    buildTextColumn<InventoryLot>({
        title: "Mặt hàng",
        render: (row) => (
            <div className="min-w-[260px]">
                <div className="font-medium">
                    {row.product?.code || `#${row.product_id}`}
                </div>
                <div className="text-xs text-muted-foreground">
                    {row.product?.name || "-"}
                </div>
            </div>
        ),
    }),

    buildTextColumn<InventoryLot>({
        title: "Kho",
        render: (row) => (
            <span className="text-sm">
                {row.warehouse?.name || `Kho #${row.warehouse_id}`}
            </span>
        ),
    }),

    buildTextColumn<InventoryLot>({
        title: "Số lô",
        render: (row) => (
            <span className="font-mono text-xs">{row.lot_no || "-"}</span>
        ),
    }),

    buildTextColumn<InventoryLot>({
        title: "HSD",
        render: (row) => (
            <div className="min-w-[140px]">
                <div className="text-sm">{formatDate(row.expiry_date)}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                    {row.expiry_message ?? formatRemaining(row.days_to_expiry)}
                </div>
            </div>
        ),
    }),

    buildTextColumn<InventoryLot>({
        title: "Tồn còn lại",
        render: (row) => (
            <div className="text-right">
                <div className="font-semibold tabular-nums">
                    {formatNumber(row.quantity_remaining)}
                </div>
                <div className="text-xs text-muted-foreground">
                    Giá trị {formatCurrency(
                        Number(row.quantity_remaining || 0) *
                            Number(row.unit_cost || 0),
                    )}
                </div>
            </div>
        ),
    }),

    buildTextColumn<InventoryLot>({
        accessorKey: "expiry_status",
        title: "Trạng thái",
        render: (row) => <ExpiryBadge status={row.expiry_status} />,
    }),
]

export function AlertsTable({
    items,
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

    // Sort: EXPIRED trước, sau đó NEAR_EXPIRY theo days_to_expiry tăng dần
    const sorted = [...items].sort((a, b) => {
        const rank = (s?: string) => (s === "EXPIRED" ? 0 : s === "NEAR_EXPIRY" ? 1 : 2)
        const ra = rank(a.expiry_status)
        const rb = rank(b.expiry_status)
        if (ra !== rb) return ra - rb
        return (a.days_to_expiry ?? 99999) - (b.days_to_expiry ?? 99999)
    })

    return (
        <div className="space-y-4">
            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm mã hàng, tên hàng, số lô..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.5_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <Select
                    value={filters.expiry_status ?? "DEFAULT"}
                    onValueChange={(value) =>
                        setFilter(
                            "expiry_status",
                            value === "DEFAULT" ? undefined : value,
                        )
                    }
                >
                    <SelectTrigger className="h-10 min-w-[220px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                        <SelectValue placeholder="Trạng thái HSD" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DEFAULT">Cảnh báo (hết hạn + cận date)</SelectItem>
                        <SelectItem value="EXPIRED">Đã hết hạn</SelectItem>
                        <SelectItem value="NEAR_EXPIRY">Cận date ≤ 180 ngày</SelectItem>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                    </SelectContent>
                </Select>

                <AsyncSelect
                    className="h-10 min-w-[200px] flex-1 border-slate-300 bg-white shadow-xs"
                    value={filters.warehouse_id}
                    onChange={(v: number | undefined) =>
                        setFilter("warehouse_id", v || undefined)
                    }
                    placeholder="Kho"
                    dataSource={{
                        getList: listWarehouses,
                        getById: getWarehouse,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={(w: { id: number; name: string }) => ({
                        value: w.id,
                        label: w.name,
                    })}
                />
            </div>

            <CrudTable<InventoryLot>
                data={sorted}
                columns={columns}
                entityName="lô cảnh báo"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
            />
        </div>
    )
}

function ExpiryBadge({ status }: { status?: string }) {
    if (status === "EXPIRED")
        return <Badge variant="destructive">Hết hạn</Badge>
    if (status === "NEAR_EXPIRY")
        return (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Cận date
            </Badge>
        )
    if (status === "NO_EXPIRY")
        return <Badge variant="outline">Chưa có HSD</Badge>
    return <Badge variant="secondary">Còn hạn</Badge>
}

function formatDate(value?: string | null) {
    if (!value) return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("vi-VN")
}

function formatRemaining(days?: number | null) {
    if (days == null) return ""
    if (days < 0) return `Đã quá hạn ${Math.abs(days)} ngày`
    if (days === 0) return "Hết hạn hôm nay"
    return `Còn ${days} ngày`
}
