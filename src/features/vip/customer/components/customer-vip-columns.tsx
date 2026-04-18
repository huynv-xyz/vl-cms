import { type ColumnDef } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/table/column-header"
import type { CustomerVip } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { Link } from "@tanstack/react-router"

export const customerVipColumns: ColumnDef<CustomerVip>[] = [
    {
        ...buildIndexColumn<CustomerVip>(),
        size: 56,
        meta: {
            thClassName: "w-14 whitespace-nowrap",
            tdClassName: "w-14 ps-3 whitespace-nowrap",
        },
    },

    {
        accessorKey: "customer_code",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Mã KH" />
        ),
        cell: ({ row }) => {
            const value = String(row.getValue("customer_code") || "-")
            const id = row.original.id

            return (
                <Link
                    to="/vip/customer/$id"
                    params={{ id: id }}
                    className="hover:underline font-medium"
                >
                    {value}
                </Link>
            )
        },
        size: 140,
        meta: {
            thClassName: "w-[140px] whitespace-nowrap",
            tdClassName: "w-[140px] whitespace-nowrap",
        },
    },

    buildTextColumn<CustomerVip>({
        accessorKey: "customer_name",
        title: "Tên khách hàng",
        width: 220,
        maxWidth: 220,
    }),

    buildTextColumn<CustomerVip>({
        accessorKey: "customer_type",
        title: "Loại KH",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<CustomerVip>({
        accessorKey: "region",
        title: "Vùng",
        width: 120,
        maxWidth: 120,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "total_vip_point",
        title: "Tổng điểm VIP",
        width: 130,
    }),

    {
        accessorKey: "tier_name",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Hạng hiện tại" />
        ),
        cell: ({ row }) => (
            <span className="block text-sm">
                {String(row.getValue("tier_name") || "-")}
            </span>
        ),
    },

    buildNumberColumn<CustomerVip>({
        accessorKey: "reward_amount",
        title: "Thưởng / điểm",
        width: 130,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "total_reward_amount",
        title: "Tổng thưởng",
        width: 130,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "private_bonus_amount",
        title: "Thưởng riêng",
        width: 130,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "final_bonus_amount",
        title: "Thưởng cuối",
        width: 130,
    }),

    buildTextColumn<CustomerVip>({
        accessorKey: "next_tier_name",
        title: "Hạng kế tiếp",
        width: 120,
        maxWidth: 120,
    }),

    buildNumberColumn<CustomerVip>({
        accessorKey: "missing_point_to_next",
        title: "Điểm còn thiếu",
        width: 120,
    }),

    {
        accessorKey: "missing_point_message",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Ghi chú thăng hạng" />
        ),
        cell: ({ row }) => (
            <span className="block text-xs text-muted-foreground">
                {String(row.getValue("missing_point_message") || "-")}
            </span>
        ),
    },
]