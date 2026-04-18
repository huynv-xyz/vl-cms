import { ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import type { Product } from "../data/schema"
import { ProductRowActions } from "./product-row-actions"

export const productColumns: ColumnDef<Product>[] = [
    buildIndexColumn(),

    buildTextColumn({
        accessorKey: "code",
        title: "Mã SP",
    }),

    buildTextColumn({
        accessorKey: "name",
        title: "Tên sản phẩm",
    }),

    buildTextColumn({
        accessorKey: "unit",
        title: "Đơn vị",
    }),

    buildBadgeColumn({
        accessorKey: "status",
        title: "Trạng thái",
        mapValueToLabel: (v) => (Number(v) === 1 ? "Hoạt động" : "Ngừng"),
    }),

    buildActionsColumn({
        renderActions: (_, row) => <ProductRowActions row={row} />,
    }),
]