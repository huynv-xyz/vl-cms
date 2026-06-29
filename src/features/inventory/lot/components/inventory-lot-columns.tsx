import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { InventoryLot } from "../data/schema"

export const inventoryLotColumns: ColumnDef<InventoryLot>[] = [
    buildIndexColumn(),

    {
        id: "product_code",
        header: "Mã sản phẩm",
        cell: ({ row }) => row.original.product?.code ?? "-",
    },

    {
        accessorKey: "product_name",
        header: "Tên sản phẩm",
        cell: ({ row }) => row.original.product?.name ?? "-",
    },

    {
        id: "warehouse",
        header: "Kho",
        cell: ({ row }) =>
            row.original.warehouse?.name ?? "-",
    },

    {
        accessorKey: "lot_no",
        header: "Số lô",
    },

    {
        accessorKey: "inbound_date",
        header: "Ngày nhập",
    },

    {
        accessorKey: "expiry_date",
        header: "HSD",
        cell: ({ row }) => row.original.expiry_date || "-",
    },

    {
        id: "expiry_status",
        header: "Cảnh báo HSD",
        cell: ({ row }) => <ExpiryBadge lot={row.original} />,
    },

    {
        accessorKey: "source_type",
        header: "Nguồn",
    },

    {
        accessorKey: "quantity_in",
        header: "SL nhập",
        cell: ({ row }) => (
            <span>
                {formatNumber(row.original.quantity_in ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "quantity_remaining",
        header: "SL còn",
        cell: ({ row }) => (
            <span className="font-bold text-green-600">
                {formatNumber(row.original.quantity_remaining ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "unit_cost",
        header: "Giá vốn gồm PLH",
        cell: ({ row }) => (
            <span>
                {formatCurrency(row.original.unit_cost ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "purchase_unit_cost",
        header: "Đơn giá mua",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {formatCurrency(row.original.purchase_unit_cost ?? row.original.unit_cost ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "handling_fee_unit",
        header: "PLH/ĐV",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {formatCurrency(row.original.handling_fee_unit ?? 0)}
            </span>
        ),
    },

    {
        accessorKey: "handling_fee_total",
        header: "Tổng PLH",
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {formatCurrency(row.original.handling_fee_total ?? 0)}
            </span>
        ),
    },

    {
        id: "total_value",
        header: "Giá trị tồn",
        cell: ({ row }) => {
            const qty = row.original.quantity_remaining ?? 0
            const cost = row.original.unit_cost ?? 0

            return (
                <span className="font-semibold">
                    {formatCurrency(qty * cost)}
                </span>
            )
        },
    },
]

function ExpiryBadge({ lot }: { lot: InventoryLot }) {
    const status = lot.expiry_status
    const days = lot.days_to_expiry

    if (status === "EXPIRED") {
        return <Badge variant="destructive">Hết hạn</Badge>
    }

    if (status === "NEAR_EXPIRY") {
        return (
            <Badge className="bg-amber-500 hover:bg-amber-500">
                Cận date{typeof days === "number" ? ` · ${days} ngày` : ""}
            </Badge>
        )
    }

    if (status === "NO_EXPIRY") {
        return <Badge variant="outline">Chưa có HSD</Badge>
    }

    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Còn hạn</Badge>
}
