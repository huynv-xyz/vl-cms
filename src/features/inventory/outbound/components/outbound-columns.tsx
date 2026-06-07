import type { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatNumber } from "@/lib/utils"
import {
    type InventoryVoucher,
    VOUCHER_TYPE_LABEL,
} from "@/api/inventory/voucher"

export const outboundColumns: ColumnDef<InventoryVoucher>[] = [
    buildIndexColumn(),

    buildTextColumn<InventoryVoucher>({
        accessorKey: "voucher_no",
        title: "Số CT",
        render: (row) => (
            <div className="min-w-[180px]">
                <div className="font-semibold">
                    {row.voucher_no || `#${row.id}`}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                    Ngày CT {formatDate(row.document_date)}
                </div>
            </div>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        accessorKey: "voucher_type_code",
        title: "Loại CT",
        render: (row) => (
            <Badge variant="outline">
                {VOUCHER_TYPE_LABEL[row.voucher_type_code] || row.voucher_type_code}
            </Badge>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "Kho",
        render: (row) => (
            <span className="text-sm">
                {row.warehouse?.name || "-"}
            </span>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        title: "Diễn giải",
        render: (row) => (
            <span className="block max-w-[320px] truncate text-sm">
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
        title: "Tổng tiền",
        render: (row) => (
            <span className="text-right font-medium tabular-nums">
                {formatCurrency(
                    (row.items ?? []).reduce(
                        (s, x) => s + (Number(x.amount) || 0),
                        0,
                    ),
                )}
            </span>
        ),
    }),

    buildTextColumn<InventoryVoucher>({
        accessorKey: "status",
        title: "Trạng thái",
        render: (row) => <StatusBadge value={row.status} />,
    }),
]

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
