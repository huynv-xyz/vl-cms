import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { Production, ProductionItem } from "../data/schema"
import { Link } from "@tanstack/react-router"
import { ProductionRowActions } from "./production-row-actions"
import { getProductionStatusMeta } from "./production-status"

export const productionColumns: ColumnDef<Production>[] = [
    buildIndexColumn(),

    // ===== PRODUCTION NO =====
    buildTextColumn({
        accessorKey: "production_no",
        title: "Lệnh SX",
        render: (row) => (
            <div className="min-w-[180px]">
                <Link
                    to="/production/orders/$id"
                    params={{ id: String(row.id) }}
                    className="font-semibold text-primary hover:underline"
                >
                    {row.production_no || `Lệnh #${row.id}`}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">
                    Ngày lệnh {formatDate(row.production_date)}
                </div>
            </div>
        ),
    }),

    buildTextColumn({
        title: "Thành phẩm",
        render: (row) => <FinishedProductsCell items={row.items ?? []} />,
    }),

    buildTextColumn({
        title: "Kho vật lý / Kho nhập",
        render: (row) => <WarehouseCell production={row} />,
    }),

    buildTextColumn({
        title: "Sản lượng",
        render: (row) => <QuantityCell items={row.items ?? []} />,
    }),

    buildTextColumn({
        title: "Giá thành",
        render: (row) => (
            <div className="min-w-[120px] text-right">
                <div className="font-semibold">
                    {formatCurrency(totalItemValue(row.items ?? [], "total_cost"))}
                </div>
                <div className="text-xs text-muted-foreground">
                    {formatCurrency(avgUnitCost(row.items ?? []))}/ĐV
                </div>
            </div>
        ),
    }),

    buildTextColumn({
        accessorKey: "status",
        title: "Bước xử lý",
        render: (row) => <ProductionStepCell production={row} />,
    }),

    buildTextColumn({
        title: "Cảnh báo",
        render: (row) => <WarningCell production={row} />,
    }),

    buildActionsColumn({
        renderActions: (_, row) => (
            <ProductionRowActions row={row} />
        ),
    }),
]

function FinishedProductsCell({ items }: { items: ProductionItem[] }) {
    if (!items.length) {
        return <span className="text-sm text-muted-foreground">Chưa có thành phẩm</span>
    }

    const visible = items.slice(0, 2)
    const rest = items.length - visible.length

    return (
        <div className="min-w-[280px] space-y-1.5">
            {visible.map((item) => (
                <div key={item.id} className="leading-tight">
                    <div className="font-medium">
                        {item.product?.code || `#${item.product_id}`}
                    </div>
                    <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                        {item.product?.name || "-"}
                    </div>
                </div>
            ))}
            {rest > 0 && (
                <Badge variant="outline" className="text-xs">
                    +{rest} thành phẩm
                </Badge>
            )}
        </div>
    )
}

function WarehouseCell({ production }: { production: Production }) {
    const items = production.items ?? []
    const warehouses = Array.from(
        new Set(
            items
                .map((item) => item.warehouse?.name || (item.warehouse_id ? `Kho #${item.warehouse_id}` : ""))
                .filter(Boolean)
        )
    )

    const physicalName = production.physical_warehouse?.name
        || (production.physical_warehouse_id ? `Kho vật lý #${production.physical_warehouse_id}` : "")

    if (!warehouses.length && !physicalName) return <span className="text-muted-foreground">-</span>

    return (
        <div className="min-w-[140px] space-y-1">
            {physicalName && (
                <div className="text-sm font-semibold">
                    {physicalName}
                </div>
            )}
            {warehouses.slice(0, 2).map((name) => (
                <div key={name} className="text-xs text-muted-foreground">
                    {name}
                </div>
            ))}
            {warehouses.length > 2 && (
                <div className="text-xs text-muted-foreground">
                    +{warehouses.length - 2} kho khác
                </div>
            )}
        </div>
    )
}

function QuantityCell({ items }: { items: ProductionItem[] }) {
    const plan = totalItemValue(items, "quantity_plan")
    const done = totalItemValue(items, "quantity_done")
    const unit = getCommonUnit(items)
    const percent = plan > 0 ? Math.min(100, Math.round((done / plan) * 100)) : 0

    return (
        <div className="min-w-[170px] space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">KH</span>
                <span className="font-semibold">{formatQty(plan, unit)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Nhập TP</span>
                <span className="font-semibold">{formatQty(done, unit)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
                <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}

function ProductionStepCell({ production }: { production: Production }) {
    const meta = getProductionStatusMeta(production.status)

    return (
        <div className="min-w-[180px] space-y-1.5">
            <Badge variant={meta.variant}>
                {meta.label}
            </Badge>
            <div className="text-xs text-muted-foreground">
                {meta.next}
            </div>
        </div>
    )
}

function WarningCell({ production }: { production: Production }) {
    const items = production.items ?? []
    const missingBom = items.filter((item) => !item.bom_id || item.check_status === "THIEU_BOM").length
    const shortage = items.reduce(
        (sum, item) =>
            sum + (item.materials ?? []).filter((m) => Number(m.shortage_quantity) > 0).length,
        0
    )
    const openWarnings = (production.warnings ?? []).filter((w) => !w.resolved_at)
    const groupedWarnings = groupWarnings(openWarnings)

    if (!missingBom && !shortage && !openWarnings.length) {
        return <Badge variant="secondary">Ổn</Badge>
    }

    return (
        <div className="min-w-[190px] space-y-1.5">
            {missingBom > 0 && (
                <Badge variant="destructive">
                    {missingBom} thành phẩm thiếu BOM
                </Badge>
            )}
            {shortage > 0 && (
                <Badge variant="destructive">
                    {shortage} dòng vật tư thiếu tồn
                </Badge>
            )}
            {openWarnings.length > 0 && (
                <div className="space-y-1">
                    <Badge variant="outline">
                        {openWarnings.length} cảnh báo chưa xử lý
                    </Badge>
                    {groupedWarnings.slice(0, 2).map((warning) => (
                        <div key={warning.code} className="text-xs text-muted-foreground">
                            {warning.label}: {warning.count}
                        </div>
                    ))}
                    {groupedWarnings.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                            +{groupedWarnings.length - 2} loại cảnh báo khác
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function groupWarnings(warnings: NonNullable<Production["warnings"]>) {
    const map = new Map<string, number>()

    for (const warning of warnings) {
        const code = warning.warning_code || "OTHER"
        map.set(code, (map.get(code) ?? 0) + 1)
    }

    return Array.from(map.entries()).map(([code, count]) => ({
        code,
        count,
        label: warningLabel(code),
    }))
}

function warningLabel(code: string) {
    switch (code) {
        case "THIEU_BOM":
        case "MISSING_BOM":
            return "Thiếu BOM"
        case "NOT_ENOUGH_STOCK":
        case "SHORTAGE":
            return "Thiếu tồn"
        case "FIFO_WARNING":
        case "FIFO_NOT_FULL":
            return "FIFO chưa đủ"
        case "INVALID_DATA":
            return "Dữ liệu chưa hợp lệ"
        default:
            return code
                .toLowerCase()
                .replace(/_/g, " ")
                .replace(/^\w/, (x) => x.toUpperCase())
    }
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

function formatQty(value: number, unit?: string) {
    return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}
