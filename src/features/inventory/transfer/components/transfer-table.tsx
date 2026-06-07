import type { ColumnDef, OnChangeFn, PaginationState } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { formatNumber } from "@/lib/utils"
import {
    type InventoryVoucher,
    TRANSFER_VOUCHER_TYPES,
    VOUCHER_TYPE_LABEL,
} from "@/api/inventory/voucher"

type Filters = {
    voucher_type?: string
    status?: string
    from_warehouse_id?: number
    from_date?: string
    to_date?: string
}

type Props = {
    data: InventoryVoucher[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}

const columns: ColumnDef<InventoryVoucher>[] = [
    buildIndexColumn(),

    buildTextColumn<InventoryVoucher>({
        accessorKey: "voucher_no",
        title: "Số phiếu",
        render: (row) => (
            <div className="min-w-[180px]">
                <div className="font-semibold">
                    {row.voucher_no || `#${row.id}`}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                    Ngày {formatDate(row.document_date)}
                </div>
            </div>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "Loại",
        render: (row) => (
            <Badge variant="outline">
                {VOUCHER_TYPE_LABEL[row.voucher_type_code] ||
                    row.voucher_type_code}
            </Badge>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "Tuyến chuyển kho",
        render: (row) => (
            <div className="inline-flex min-w-[260px] items-center gap-2 text-sm">
                <span className="font-medium">
                    {row.warehouse?.name || "Kho nguồn"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                    {row.description?.includes("→")
                        ? row.description.split("→").pop()?.trim()
                        : "Kho đích (theo PNK link)"}
                </span>
            </div>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "Diễn giải",
        render: (row) => (
            <span className="block max-w-[280px] truncate text-sm">
                {row.description || "-"}
            </span>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "SL dòng",
        render: (row) => (
            <span className="tabular-nums">
                {formatNumber(row.items?.length ?? 0)}
            </span>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "Tổng SL",
        render: (row) => (
            <span className="tabular-nums">
                {formatNumber(
                    (row.items ?? []).reduce(
                        (s, x) => s + (Number(x.quantity) || 0),
                        0,
                    ),
                )}
            </span>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        accessorKey: "transfer_id",
        title: "Mã chuyển kho",
        render: (row) =>
            row.transfer_id ? (
                <span className="font-mono text-xs">#{row.transfer_id}</span>
            ) : (
                <span className="text-muted-foreground">-</span>
            ),
    }),

    buildTextColumn<InventoryVoucher>({
        accessorKey: "status",
        title: "Trạng thái",
        render: (row) => <StatusBadge value={row.status} />,
    }),
]

export function TransferTable({
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
        <div className="space-y-4">
            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm số phiếu, diễn giải, kho..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.5_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <Select
                    value={filters.voucher_type ?? "ALL"}
                    onValueChange={(value) =>
                        setFilter(
                            "voucher_type",
                            value === "ALL" ? undefined : value,
                        )
                    }
                >
                    <SelectTrigger className="h-10 min-w-[200px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                        <SelectValue placeholder="Loại phiếu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        {TRANSFER_VOUCHER_TYPES.map((code) => (
                            <SelectItem key={code} value={code}>
                                {VOUCHER_TYPE_LABEL[code] ?? code}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <AsyncSelect
                    className="h-10 min-w-[200px] flex-1 border-slate-300 bg-white shadow-xs"
                    value={filters.from_warehouse_id}
                    onChange={(v: number | undefined) =>
                        setFilter("from_warehouse_id", v || undefined)
                    }
                    placeholder="Kho nguồn"
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

                <Select
                    value={filters.status ?? "ALL"}
                    onValueChange={(value) =>
                        setFilter("status", value === "ALL" ? undefined : value)
                    }
                >
                    <SelectTrigger className="h-10 min-w-[160px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                        <SelectItem value="DRAFT">Nháp</SelectItem>
                        <SelectItem value="POSTED">Đã ghi sổ</SelectItem>
                        <SelectItem value="VOID">Đã hủy</SelectItem>
                    </SelectContent>
                </Select>

                <DatePicker
                    className="min-w-[150px] flex-1 [&_button]:h-10"
                    value={filters.from_date}
                    onChange={(v) => setFilter("from_date", v || undefined)}
                    placeholder="Từ ngày"
                />

                <DatePicker
                    className="min-w-[150px] flex-1 [&_button]:h-10"
                    value={filters.to_date}
                    onChange={(v) => setFilter("to_date", v || undefined)}
                    placeholder="Đến ngày"
                />
            </div>

            <CrudTable<InventoryVoucher>
                data={data}
                columns={columns}
                entityName="phiếu chuyển kho"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
            />
        </div>
    )
}

function StatusBadge({ value }: { value?: string }) {
    const v = String(value || "").toUpperCase()
    if (v === "POSTED") return <Badge variant="secondary">Đã ghi sổ</Badge>
    if (v === "VOID") return <Badge variant="destructive">Đã hủy</Badge>
    return <Badge variant="outline">Nháp</Badge>
}

function formatDate(value?: string) {
    if (!value) return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("vi-VN")
}
