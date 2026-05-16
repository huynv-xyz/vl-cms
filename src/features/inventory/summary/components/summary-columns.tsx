import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { InventorySummary } from "../data/schema"

export const summaryColumns: ColumnDef<InventorySummary>[] = [
    {
        id: "product",
        header: "Sản phẩm",
        cell: ({ row }) => {
            const product = row.original.product

            return (
                <div className="min-w-[300px]">
                    <div className="font-semibold">
                        {product?.code ?? row.original.product_id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {product?.name ?? "-"}
                    </div>
                </div>
            )
        },
    },

    {
        id: "unit",
        header: "ĐVT",
        cell: ({ row }) => (
            <Badge variant="outline">
                {row.original.product?.unit || "-"}
            </Badge>
        ),
    },

    {
        id: "warehouse",
        header: "Kho",
        cell: ({ row }) => (
            <div>
                <div className="font-medium">
                    {row.original.warehouse?.name ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground">
                    Mã kho: {row.original.warehouse_id ?? "-"}
                </div>
            </div>
        ),
    },

    {
        accessorKey: "total_quantity",
        header: "Tồn hiện tại",
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: InventorySummary[]) => (
                <span>{formatNumber(sum(rows, "total_quantity"))}</span>
            ),
        },
        cell: ({ row }) => (
            <div>
                <div className="text-lg font-bold text-emerald-700">
                    {formatNumber(row.original.total_quantity ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                    {row.original.product?.unit || "đơn vị"}
                </div>
            </div>
        ),
    },

    {
        accessorKey: "total_value",
        header: "Giá trị tồn",
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: InventorySummary[]) => (
                <span>{formatCurrency(sum(rows, "total_value"))}</span>
            ),
        },
        cell: ({ row }) => (
            <div>
                <div className="font-semibold">
                    {formatCurrency(row.original.total_value ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                    VNĐ
                </div>
            </div>
        ),
    },

    {
        id: "avg_cost",
        header: "Giá vốn BQ",
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
        cell: ({ row }) => {
            const qty = Number(row.original.total_quantity ?? 0)
            const value = Number(row.original.total_value ?? 0)
            const avgCost = qty > 0 ? value / qty : 0

            return (
                <span className="font-medium">
                    {formatCurrency(avgCost)}
                </span>
            )
        },
    },

    {
        id: "status",
        header: "Tình trạng",
        cell: ({ row }) => {
            const qty = Number(row.original.total_quantity ?? 0)
            const value = Number(row.original.total_value ?? 0)

            if (qty <= 0) {
                return <Badge variant="secondary">Hết tồn</Badge>
            }

            if (value <= 0) {
                return <Badge variant="destructive">Thiếu giá vốn</Badge>
            }

            return <Badge className="bg-emerald-600 hover:bg-emerald-600">Còn tồn</Badge>
        },
    },
]

function sum(rows: InventorySummary[], key: "total_quantity" | "total_value") {
    return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0)
}
