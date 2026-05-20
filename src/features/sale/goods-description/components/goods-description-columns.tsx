import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import type { GoodsDescription } from "../data/schema"
import { GoodsDescriptionRowActions } from "./goods-description-row-actions"

export const goodsDescriptionColumns: ColumnDef<GoodsDescription>[] = [
    buildIndexColumn<GoodsDescription>(),

    buildTextColumn<GoodsDescription>({
        accessorKey: "name",
        title: "Mô tả HH",
    }),

    buildTextColumn<GoodsDescription>({
        accessorKey: "note",
        title: "Ghi chú",
    }),

    {
        accessorKey: "active",
        header: "Trạng thái",
        cell: ({ row }) => (
            <Badge variant={row.original.active === 0 ? "outline" : "secondary"}>
                {row.original.active === 0 ? "Ngưng dùng" : "Đang dùng"}
            </Badge>
        ),
    },

    buildTextColumn<GoodsDescription>({
        accessorKey: "created_at",
        title: "Ngày tạo",
    }),

    buildActionsColumn<GoodsDescription>({
        renderActions: (_, row) => <GoodsDescriptionRowActions row={row} />,
    }),
]
