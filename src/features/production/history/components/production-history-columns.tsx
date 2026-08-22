import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { formatNumber } from "@/lib/utils"
import type { ProductionHistoryRow } from "../data/schema"

const gridCell = "border-r border-slate-200 last:border-r-0"
const centerCell = `${gridCell} text-center`
const rightCell = `${gridCell} text-right tabular-nums`

export const productionHistoryColumns: ColumnDef<ProductionHistoryRow>[] = [
    {
        ...buildIndexColumn<ProductionHistoryRow>(),
        size: 56,
        minSize: 48,
        meta: {
            thClassName: `w-14 whitespace-nowrap ${centerCell}`,
            tdClassName: `w-14 whitespace-nowrap ${centerCell}`,
        },
    },

    buildTextColumn<ProductionHistoryRow>({
        title: "Lệnh SX",
        width: 190,
        className: `w-[190px] ${gridCell}`,
        render: (row) => (
            <div className="min-w-0">
                <Link
                    to="/production/orders/$id"
                    params={{ id: String(row.production_id) }}
                    className="block truncate font-semibold text-primary hover:underline"
                >
                    {row.production_no || `#${row.production_id}`}
                </Link>
                <div className="truncate text-xs text-muted-foreground">
                    {formatDate(row.production_date)}
                </div>
            </div>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Thành phẩm",
        width: 360,
        className: `w-[360px] ${gridCell}`,
        render: (row) => (
            <div className="min-w-0">
                <div className="truncate font-semibold">{row.product_name || "-"}</div>
                <div className="truncate text-xs text-muted-foreground">
                    {row.product_code || `#${row.product_id || "-"}`}
                </div>
            </div>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Địa điểm / Kho nhập",
        width: 260,
        className: `w-[260px] ${gridCell}`,
        render: (row) => (
            <div className="min-w-0">
                <div className="truncate font-medium">
                    {row.physical_warehouse_name || row.physical_warehouse_code || "-"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                    {row.warehouse_name || row.warehouse_code || "-"}
                </div>
            </div>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "SL kế hoạch",
        width: 140,
        className: `w-[140px] ${rightCell}`,
        render: (row) => formatQty(row.quantity_plan, row.product_unit),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "SL nhập TP",
        width: 140,
        className: `w-[140px] ${rightCell}`,
        render: (row) => (
            <span className="font-semibold">
                {formatQty(row.quantity_done, row.product_unit)}
            </span>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Hoàn thành",
        width: 130,
        className: `w-[130px] ${centerCell}`,
        render: (row) => <CompletionBadge row={row} />,
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Lô TP",
        width: 180,
        className: `w-[180px] ${centerCell}`,
        render: (row) => (
            <div className="min-w-0 text-center">
                <div className="truncate font-mono text-sm">{row.output_lot_no || "-"}</div>
                <div className="truncate text-xs text-muted-foreground">
                    HSD {formatDate(row.output_expiry_date)}
                </div>
            </div>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Vật tư",
        width: 120,
        className: `w-[120px] ${centerCell}`,
        render: (row) => (
            <Badge variant="outline" className="tabular-nums">
                {formatNumber(row.material_count || 0)} dòng
            </Badge>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Chứng từ",
        width: 120,
        className: `w-[120px] ${centerCell}`,
        render: (row) => (
            <Badge variant="secondary" className="tabular-nums">
                {formatNumber(row.voucher_count || 0)}
            </Badge>
        ),
    }),

    buildTextColumn<ProductionHistoryRow>({
        title: "Trạng thái",
        width: 150,
        className: `w-[150px] ${centerCell}`,
        render: (row) => <StatusBadge status={row.status} />,
    }),
]

function CompletionBadge({ row }: { row: ProductionHistoryRow }) {
    const plan = Number(row.quantity_plan || 0)
    const done = Number(row.quantity_done || 0)
    if (plan <= 0 && done <= 0) {
        return <Badge variant="outline">Chưa có SL</Badge>
    }
    if (plan > 0 && done >= plan) {
        return <Badge className="bg-emerald-600 hover:bg-emerald-600">Đủ</Badge>
    }
    if (done > 0) {
        return <Badge className="bg-amber-500 hover:bg-amber-500">Dở dang</Badge>
    }
    return <Badge variant="outline">Chưa nhập</Badge>
}

function StatusBadge({ status }: { status?: string }) {
    const label = statusLabel(status)
    const done = status === "DONE" || status === "OUTPUT_RECEIVED"
    return (
        <Badge variant={done ? "default" : "outline"} className="max-w-full truncate">
            {label}
        </Badge>
    )
}

export function statusLabel(status?: string) {
    const labels: Record<string, string> = {
        DRAFT: "Nháp",
        PLANNED: "Kế hoạch",
        MATERIAL_GENERATED: "Đã sinh vật tư",
        FIFO_ALLOCATED: "Đã chạy FIFO",
        MATERIAL_ISSUED: "Đã xuất NVL",
        OUTPUT_RECEIVED: "Đã nhập TP",
        DONE: "Hoàn tất",
        CANCELLED: "Huỷ",
    }
    return status ? labels[status] || status : "-"
}

export function formatDate(value?: string | null) {
    if (!value) return "-"
    const [date] = String(value).split("T")
    const parts = date.split("-")
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return value
}

export function formatQty(value?: number | null, unit?: string | null) {
    const text = formatNumber(Number(value || 0))
    return unit ? `${text} ${unit}` : text
}
