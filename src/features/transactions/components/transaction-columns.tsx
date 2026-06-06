import { type ColumnDef } from "@tanstack/react-table"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { DataTableColumnHeader } from "@/components/table/column-header"
import { formatCurrency } from "@/lib/utils"
import type { Transaction } from "../data/schema"

type TextColumnKey = keyof Transaction

function textColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 160,
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => {
            const value = row.getValue(accessorKey as string)
            return (
                <span className="block truncate text-sm" title={value == null ? "" : String(value)}>
                    {value == null || value === "" ? "-" : String(value)}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] max-w-[${width}px]`,
        },
    }
}

function numberColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 120,
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
            const value = Number(row.getValue(accessorKey as string) ?? 0)
            return (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {formatNumber(value)}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
        },
    }
}

function moneyColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 150,
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
            const value = Number(row.getValue(accessorKey as string) ?? 0)
            return (
                <span className="block text-right tabular-nums whitespace-nowrap">
                    {value ? formatCurrency(value) : "-"}
                </span>
            )
        },
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap text-right`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
        },
    }
}

function dateColumn(
    accessorKey: TextColumnKey,
    title: string,
    width = 125,
): ColumnDef<Transaction> {
    return {
        accessorKey: accessorKey as string,
        enableSorting: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
        cell: ({ row }) => (
            <span className="block whitespace-nowrap text-sm tabular-nums">
                {formatDate(row.getValue(accessorKey as string))}
            </span>
        ),
        size: width,
        meta: {
            thClassName: `w-[${width}px] whitespace-nowrap`,
            tdClassName: `w-[${width}px] whitespace-nowrap`,
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
    dateColumn("document_date", "Ngày chứng từ", 125),
    textColumn("document_no", "Số chứng từ", 150),
    textColumn("customer_code", "Mã khách hàng", 180),
    textColumn("customer_name", "Tên khách hàng", 260),
    textColumn("customer_address", "Địa chỉ", 300),
    textColumn("product_code", "Mã hàng", 180),
    textColumn("product_name", "Tên hàng trên chứng từ", 300),
    textColumn("unit", "Đơn vị chính (ĐVC)", 140),
    numberColumn("sale_qty", "Tổng SL bán theo ĐVC", 160),
    moneyColumn("unit_price", "Đơn giá theo ĐVC", 150),
    moneyColumn("revenue", "Doanh số bán", 160),
    numberColumn("return_qty", "SL trả lại theo ĐVC", 160),
    textColumn("sale_user_code", "Mã nhân viên bán hàng", 180),
    textColumn("sale_user_name", "Tên nhân viên bán hàng", 220),
    textColumn("warehouse_code", "Mã kho", 120),
    textColumn("warehouse_name", "Tên kho", 180),
    textColumn("description", "Mô tả HH", 260),
    textColumn("contact_name", "Người liên hệ", 180),
    textColumn("vthh_con", "VTHH_CON", 140),
    textColumn("vthh_group_name", "Tên nhóm VTHH", 180),
    textColumn("customer_type", "PHÂN_LOẠI_KH", 140),
    textColumn("ext_detail_2", "Trường mở rộng chi tiết 2", 280),
    numberColumn("is_gift", "HÀNG_TẶNG", 120),
    textColumn("private_code", "MÃ_RIÊNG", 150),
    numberColumn("sl_rieng_tl", "SL_RIÊNG_TL", 140),
    numberColumn("sl_tl_nhom", "SL_TL_NHÓM", 140),
    numberColumn("sl_lb2c", "SL_L_B2C", 120),
    numberColumn("sl_lb2b", "SL_L_B2B", 120),
    numberColumn("sl_hdn", "SL_HDN", 110),
    numberColumn("diem_hdn", "DIEM_HDN", 120),
    numberColumn("process_month", "THANG_XU_LY", 130),
    textColumn("npp", "NPP", 120),
    textColumn("valid_code", "MA_HOP _LE", 130),
    textColumn("hdn_status", "TINH_TRANG_HDN", 160),
    textColumn("common_group", "NHÓM-CHUNG", 150),
    textColumn("region", "KHU_VUC", 120),
    numberColumn("sl_hdn_k0_ma_rieng", "SL_HDN_K0_MA_RIENG", 190),
]

function formatNumber(value: number) {
    return value.toLocaleString("en-US", {
        maximumFractionDigits: 6,
    })
}

function formatDate(value: unknown) {
    if (!value) return "-"
    const raw = String(value)
    const date = raw.trim().split(/[T\s]/)[0]
    const dmy = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`
    const ymd = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) return `${ymd[3].padStart(2, "0")}/${ymd[2].padStart(2, "0")}/${ymd[1]}`
    return raw
}
