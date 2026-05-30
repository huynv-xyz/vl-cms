import { type ColumnDef } from "@tanstack/react-table"

import type { VipProductMapping } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { VipProductMappingRowActions } from "./vip-product-mapping-row-actions"

export const vipProductMappingColumns: ColumnDef<VipProductMapping>[] = [
    buildIndexColumn<VipProductMapping>(),

    buildTextColumn<VipProductMapping>({
        accessorKey: "misa_code",
        title: "Mã MISA",
        width: 140,
        maxWidth: 140,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "product_sub_code",
        title: "VTHH Con",
        width: 160,
        maxWidth: 160,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "customer_code",
        title: "Mã KH riêng",
        width: 140,
        maxWidth: 150,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "group_code",
        title: "Mã chung",
        width: 130,
        maxWidth: 130,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "product_group",
        title: "Nhóm hàng",
        width: 150,
        maxWidth: 150,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "product_name",
        title: "Tên sản phẩm",
        width: 200,
        maxWidth: 260,
    }),

    buildTextColumn<VipProductMapping>({
        accessorKey: "unit",
        title: "ĐVT",
        width: 80,
        maxWidth: 80,
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

    buildBadgeColumn<VipProductMapping>({
        accessorKey: "calc_point",
        title: "Tính điểm",
        width: 100,
        mapValueToLabel: (v) => v === 1 ? "Có" : "Không",
        mapValueToVariant: (v) => v === 1 ? "default" : "secondary",
    }),

    buildBadgeColumn<VipProductMapping>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 110,
        mapValueToLabel: (v) => v === 1 ? "Hoạt động" : "Tắt",
        mapValueToVariant: (v) => v === 1 ? "default" : "outline",
    }),

    buildActionsColumn<VipProductMapping>({
        renderActions: (_, row) => <VipProductMappingRowActions row={row} />,
    }),
]
