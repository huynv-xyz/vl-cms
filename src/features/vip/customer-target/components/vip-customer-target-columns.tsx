import { type ColumnDef } from "@tanstack/react-table"

import type { VipCustomerTarget } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildActionsColumn } from "@/components/crud/build-actions-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildBadgeColumn } from "@/components/crud/build-badge-column"
import { buildTruncateColumn } from "@/components/crud/build-truncate-column"
import { VipCustomerTargetRowActions } from "./vip-customer-target-row-actions"

export const vipCustomerTargetColumns: ColumnDef<VipCustomerTarget>[] = [
    buildIndexColumn<VipCustomerTarget>(),

    buildTextColumn<VipCustomerTarget>({
        accessorKey: "calc_year",
        title: "Năm",
        width: 100,
        maxWidth: 100,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipCustomerTarget>({
        accessorKey: "customer_code",
        title: "Mã khách hàng",
        width: 160,
        maxWidth: 160,
        textClassName: "font-medium text-sm",
    }),

    buildTextColumn<VipCustomerTarget>({
        accessorKey: "customer_name",
        title: "Tên khách hàng",
        width: 220,
        maxWidth: 220,
    }),

    buildTextColumn<VipCustomerTarget>({
        accessorKey: "target_tier_name",
        title: "Hạng mục tiêu",
        width: 160,
        maxWidth: 160,
    }),

    buildBadgeColumn<VipCustomerTarget>({
        accessorKey: "status",
        title: "Trạng thái",
        width: 110,
        mapValueToLabel: (v) => v === 1 ? "Hoạt động" : "Tắt",
        mapValueToVariant: (v) => v === 1 ? "default" : "outline",
    }),

    buildTruncateColumn<VipCustomerTarget>({
        accessorKey: "note",
        header: "Ghi chú",
        width: 200,
    }),

    buildActionsColumn<VipCustomerTarget>({
        renderActions: (_, row) => <VipCustomerTargetRowActions row={row} />,
    }),
]
