import { type ColumnDef } from "@tanstack/react-table"

import type { VipProductMapping } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { VipProductMappingRowActions } from "./vip-product-mapping-row-actions"

export const vipProductMappingColumns: ColumnDef<VipProductMapping>[] = [
    buildIndexColumn<VipProductMapping>(),

    buildTextColumn<VipProductMapping>({
        accessorKey: "product_code",
        title: "Mã sản phẩm",
        width: 140,
        maxWidth: 140,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "product_name",
        title: "Tên sản phẩm",
        width: 260,
        maxWidth: 320,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "customer_code",
        title: "Mã KH riêng",
        width: 140,
        maxWidth: 150,
    }),

    buildNumberColumn<VipProductMapping>({
        accessorKey: "he_so_mb",
        title: "Hệ số MB",
        width: 110,
    }),

    buildNumberColumn<VipProductMapping>({
        accessorKey: "he_so_mn",
        title: "Hệ số MN",
        width: 110,
    }),

    buildActionsColumn<VipProductMapping>({
        renderActions: (_, row) => <VipProductMappingRowActions row={row} />,
    }),
]
