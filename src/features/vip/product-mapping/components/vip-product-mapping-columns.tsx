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
        accessorKey: "product_group",
        title: "Mã riêng",
        width: 160,
        maxWidth: 180,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "ap_dung",
        title: "Vùng áp dụng",
        width: 110,
        maxWidth: 120,
    }),

    buildNumberColumn<VipProductMapping>({
        accessorKey: "he_so_hdn",
        title: "Hệ số HDN",
        width: 120,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "customer_code",
        title: "Mã KH riêng",
        width: 110,
        maxWidth: 130,
    }),

    buildActionsColumn<VipProductMapping>({
        renderActions: (_, row) => <VipProductMappingRowActions row={row} />,
    }),
]
