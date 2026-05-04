import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { InventoryInbound } from "../data/schema"
import { InboundRowActions } from "./inbound-row-actions"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

const sourceTypeMeta: Record<string, { label: string; variant: any }> = {
    OPENING: {
        label: "Tồn đầu kỳ",
        variant: "secondary",
    },
    PURCHASE: {
        label: "Nhập mua hàng",
        variant: "default",
    },
    PRODUCTION: {
        label: "Nhập sản xuất",
        variant: "outline",
    },
    ADJUSTMENT: {
        label: "Điều chỉnh",
        variant: "secondary",
    },
}

export const inboundColumns: ColumnDef<InventoryInbound>[] = [
    buildIndexColumn(),

    {
        accessorKey: "source_type",
        header: "Loại nhập",
        cell: ({ row }) => {
            const type = row.original.source_type
            const meta = sourceTypeMeta[type] || {
                label: type,
                variant: "outline",
            }

            return <Badge variant={meta.variant}>{meta.label}</Badge>
        },
    },

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
        accessorKey: "warehouse_id",
        header: "Kho",
        cell: ({ row }) => row.original.warehouse?.name ?? "-",
    },

    buildTextColumn({
        accessorKey: "lot_no",
        title: "Số lô",
    }),

    buildTextColumn({
        accessorKey: "inbound_date",
        title: "Ngày nhập",
    }),

    {
        accessorKey: "quantity_in",
        header: "Số lượng",
        cell: ({ row }) => (
            <span className="font-medium">
                {row.original.quantity_in ?? 0}
            </span>
        ),
    },

    buildActionsColumn({
        renderActions: (_, row) => <InboundRowActions row={row} />,
    }),
]