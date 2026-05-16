import type { ColumnDef } from "@tanstack/react-table"

import { buildIndexColumn } from "@/components/crud/build-index-column"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/utils"
import {
    getDocTypeMeta,
    type InventoryLedgerReportRow,
} from "../data/schema"

export const inventoryLedgerColumns: ColumnDef<InventoryLedgerReportRow>[] = [
    buildIndexColumn(),

    {
        accessorKey: "doc_no",
        header: "Chứng từ",
        cell: ({ row }) => {
            const item = row.original
            const meta = getDocTypeMeta(item.doc_type)

            return (
                <div className="min-w-[190px]">
                    <div className="font-semibold text-primary">
                        {item.doc_no || `#${item.id}`}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Ngày {formatDate(item.posting_date)}
                    </div>
                    <div className="mt-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                </div>
            )
        },
    },

    {
        id: "product",
        header: "Hàng hóa",
        cell: ({ row }) => (
            <div className="min-w-[280px]">
                <div className="font-medium">{row.original.product_code || "-"}</div>
                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {row.original.product_name || "-"}
                </div>
            </div>
        ),
    },

    {
        accessorKey: "warehouse_name",
        header: "Kho",
        cell: ({ row }) => (
            <div className="min-w-[160px] font-medium">
                {row.original.warehouse_name || "-"}
            </div>
        ),
    },

    {
        accessorKey: "quantity_in",
        header: () => <div className="text-right">Nhập</div>,
        cell: ({ row }) => (
            <QuantityCell value={row.original.quantity_in} tone="in" />
        ),
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: InventoryLedgerReportRow[]) => (
                <div className="text-right font-bold text-emerald-600">
                    {formatNumber(sumBy(rows, "quantity_in"))}
                </div>
            ),
        },
    },

    {
        accessorKey: "quantity_out",
        header: () => <div className="text-right">Xuất</div>,
        cell: ({ row }) => (
            <QuantityCell value={row.original.quantity_out} tone="out" />
        ),
        meta: {
            className: "text-right",
            tdClassName: "text-right",
            footer: (rows: InventoryLedgerReportRow[]) => (
                <div className="text-right font-bold text-rose-600">
                    {formatNumber(sumBy(rows, "quantity_out"))}
                </div>
            ),
        },
    },

    {
        accessorKey: "balance_quantity",
        header: () => <div className="text-right">Tồn sau phát sinh</div>,
        cell: ({ row }) => (
            <div className="text-right font-bold">
                {formatNumber(row.original.balance_quantity ?? 0)}
            </div>
        ),
        meta: {
            className: "text-right",
            tdClassName: "text-right",
        },
    },

    {
        id: "ref",
        header: "Tham chiếu",
        cell: ({ row }) => (
            <div className="text-sm text-muted-foreground">
                {row.original.ref_id ? `#${row.original.ref_id}` : "-"}
            </div>
        ),
    },
]

function QuantityCell({
    value,
    tone,
}: {
    value?: number
    tone: "in" | "out"
}) {
    const quantity = Number(value || 0)

    if (!quantity) {
        return <div className="text-right text-muted-foreground">-</div>
    }

    return (
        <div className={tone === "in" ? "text-right font-semibold text-emerald-600" : "text-right font-semibold text-rose-600"}>
            {formatNumber(quantity)}
        </div>
    )
}

function sumBy(
    rows: InventoryLedgerReportRow[],
    field: "quantity_in" | "quantity_out"
) {
    return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0)
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}
