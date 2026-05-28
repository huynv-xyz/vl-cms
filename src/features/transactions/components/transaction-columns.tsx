import { type ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { buildNumberColumn } from "@/components/crud/build-number-column"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { formatCurrency } from "@/lib/utils"
import type { Transaction } from "../data/schema"

function moneyCell(
    accessorKey: keyof Transaction,
    title: string,
    options: { width: number; className?: string; align?: "right" } = { width: 140 }
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        header: ({ column }) => (
            <div className="text-right">
                <DataTableColumnHeader column={column} title={title} />
            </div>
        ),
        cell: ({ row }) => {
            const raw = row.getValue(accessorKey as string)
            const value = Number(raw ?? 0)
            if (!value) {
                return <span className="block text-right text-slate-400">-</span>
            }
            return (
                <span className={`block text-right tabular-nums whitespace-nowrap ${options.className ?? ""}`}>
                    {formatCurrency(value)}
                </span>
            )
        },
        size: options.width,
        meta: {
            thClassName: `w-[${options.width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${options.width}px] whitespace-nowrap`,
        },
    }
}

export const transactionColumns: ColumnDef<Transaction>[] = [
    {
        ...buildIndexColumn<Transaction>(),
        size: 56,
        meta: {
            thClassName: "w-14 whitespace-nowrap",
            tdClassName: "w-14 ps-3 whitespace-nowrap",
        },
    },

    buildTextColumn<Transaction>({
        accessorKey: "document_date",
        title: "Ngày chứng từ",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "document_no",
        title: "Số chứng từ",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "customer_code",
        title: "Mã khách hàng",
        width: 140,
        maxWidth: 140,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "customer_name",
        title: "Tên khách hàng",
        width: 220,
        maxWidth: 220,
    }),

    {
        accessorKey: "description",
        enableSorting: false,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Diễn giải" />
        ),
        cell: ({ row }) => (
            <span className="block text-sm max-w-[280px] truncate">
                {String(row.getValue("description") || "-")}
            </span>
        ),
    },

    buildTextColumn<Transaction>({
        accessorKey: "product_code",
        title: "Mã sản phẩm",
        width: 160,
        maxWidth: 160,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "product_name",
        title: "Tên sản phẩm",
        width: 240,
        maxWidth: 240,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "unit",
        title: "ĐVT",
        width: 80,
        maxWidth: 80,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sale_qty",
        title: "SL bán",
        width: 110,
    }),
    buildNumberColumn<Transaction>({
        accessorKey: "return_qty",
        title: "SL trả",
        width: 100,
    }),

    moneyCell("unit_price", "Đơn giá", { width: 140, className: "text-slate-700" }),
    moneyCell("discount", "Chiết khấu", { width: 130, className: "text-amber-700" }),
    moneyCell("revenue", "Doanh số", { width: 160, className: "font-semibold text-emerald-700" }),

    buildTextColumn<Transaction>({
        accessorKey: "sale_user_name",
        title: "NV bán hàng",
        width: 160,
        maxWidth: 160,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "contact_name",
        title: "Liên hệ",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "vthh_con",
        title: "VTHH con",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "vthh_group_name",
        title: "Nhóm VTHH",
        width: 140,
        maxWidth: 140,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "customer_type",
        title: "Loại KH",
        width: 120,
        maxWidth: 120,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "is_gift",
        title: "Quà tặng",
        width: 100,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sl_rieng_tl",
        title: "SL riêng TL",
        width: 120,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sl_tl_nhom",
        title: "SL TL nhóm",
        width: 120,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sl_lb2c",
        title: "SL LB2C",
        width: 120,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sl_lb2b",
        title: "SL LB2B",
        width: 120,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sl_hdn",
        title: "SL HDN",
        width: 100,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "diem_hdn",
        title: "Điểm HDN",
        width: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "process_month",
        title: "Tháng xử lý",
        width: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "npp",
        title: "NPP",
        width: 100,
        maxWidth: 100,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "valid_code",
        title: "Mã hợp lệ",
        width: 120,
        maxWidth: 120,
    }),

    buildTextColumn<Transaction>({
        accessorKey: "common_group",
        title: "Nhóm chung",
        width: 140,
        maxWidth: 140,
    }),

    buildNumberColumn<Transaction>({
        accessorKey: "sl_hdn_k0_ma_rieng",
        title: "SL HDN k0 mã riêng",
        width: 160,
    }),

]