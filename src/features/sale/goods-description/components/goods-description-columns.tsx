import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { buildTextColumn } from "@/components/crud/build-text-column"
import {
    buildMasterActionsColumn,
    buildMasterIndexColumn,
    masterCenterCell,
    masterGridCell,
    MasterOneLineText,
} from "@/components/master-data-columns"
import type { GoodsDescription } from "../data/schema"
import { GoodsDescriptionRowActions } from "./goods-description-row-actions"

export const goodsDescriptionColumns: ColumnDef<GoodsDescription>[] = [
    buildMasterIndexColumn<GoodsDescription>(),

    buildTextColumn<GoodsDescription>({
        accessorKey: "name",
        title: "Mô tả HH",
        width: 360,
        className: `w-[360px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.name} className="text-sm font-medium" />,
    }),

    buildTextColumn<GoodsDescription>({
        accessorKey: "note",
        title: "Ghi chú",
        width: 360,
        className: `w-[360px] ${masterGridCell}`,
        render: (row) => <MasterOneLineText value={row.note} className="text-sm" />,
    }),

    {
        accessorKey: "active",
        header: "Trạng thái",
        cell: ({ row }) => (
            <Badge variant={row.original.active === 0 ? "outline" : "secondary"}>
                {row.original.active === 0 ? "Ngưng dùng" : "Đang dùng"}
            </Badge>
        ),
        size: 140,
        meta: {
            thClassName: `w-[140px] whitespace-nowrap ${masterCenterCell}`,
            tdClassName: `w-[140px] whitespace-nowrap ${masterCenterCell}`,
        },
    },

    buildTextColumn<GoodsDescription>({
        accessorKey: "created_at",
        title: "Ngày tạo",
        width: 180,
        className: `w-[180px] ${masterCenterCell}`,
        render: (row) => <MasterOneLineText value={row.created_at} className="text-center text-sm" />,
    }),

    buildMasterActionsColumn<GoodsDescription>({
        renderActions: (_, row) => <GoodsDescriptionRowActions row={row} />,
    }),
]
