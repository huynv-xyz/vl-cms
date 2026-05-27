import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportXlsx } from "@/lib/xlsx-export"
import { listTransactions, type TransactionListParams } from "@/api/transactions"
import type { Transaction } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<
        TransactionListParams,
        "customer_type" | "vthh_con" | "npp" | "process_month"
    >
}

const COLUMNS: Array<{ key: keyof Transaction; label: string }> = [
    { key: "document_date", label: "Ngày chứng từ" },
    { key: "document_no", label: "Số chứng từ" },
    { key: "customer_code", label: "Mã khách hàng" },
    { key: "customer_name", label: "Tên khách hàng" },
    { key: "description", label: "Diễn giải" },
    { key: "product_code", label: "Mã sản phẩm" },
    { key: "product_name", label: "Tên sản phẩm" },
    { key: "unit", label: "ĐVT" },
    { key: "sale_qty", label: "SL bán" },
    { key: "return_qty", label: "SL trả" },
    { key: "unit_price", label: "Đơn giá" },
    { key: "discount", label: "Chiết khấu" },
    { key: "revenue", label: "Doanh số" },
    { key: "sale_user_name", label: "NV bán hàng" },
    { key: "contact_name", label: "Liên hệ" },
    { key: "vthh_con", label: "VTHH con" },
    { key: "vthh_group_name", label: "Nhóm VTHH" },
    { key: "customer_type", label: "Loại KH" },
    { key: "is_gift", label: "Quà tặng" },
    { key: "sl_rieng_tl", label: "SL riêng TL" },
    { key: "sl_tl_nhom", label: "SL TL nhóm" },
    { key: "sl_lb2c", label: "SL LB2C" },
    { key: "sl_lb2b", label: "SL LB2B" },
    { key: "sl_hdn", label: "SL HDN" },
    { key: "diem_hdn", label: "Điểm HDN" },
    { key: "process_month", label: "Tháng xử lý" },
    { key: "npp", label: "NPP" },
    { key: "valid_code", label: "Mã hợp lệ" },
    { key: "common_group", label: "Nhóm chung" },
    { key: "sl_hdn_k0_ma_rieng", label: "SL HDN k0 mã riêng" },
]

export function ExportTransactionButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllRows({
                page: 1,
                size: 500,
                keyword: keyword || undefined,
                customer_type: filters.customer_type || undefined,
                vthh_con: filters.vthh_con || undefined,
                npp: filters.npp || undefined,
                process_month: filters.process_month || undefined,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            const sheetRows: (string | number)[][] = [
                COLUMNS.map((column) => column.label),
                ...rows.map((row) =>
                    COLUMNS.map((column) => {
                        const value = row[column.key]
                        if (value == null) return ""
                        return typeof value === "number" ? value : String(value)
                    })
                ),
            ]

            const filename = `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`

            exportXlsx(filename, [
                { name: "Giao dịch", rows: sheetRows },
            ])

            toast.success(`Đã xuất ${rows.length} dòng giao dịch`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button type="button" variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
        </Button>
    )
}

async function fetchAllRows(base: TransactionListParams): Promise<Transaction[]> {
    const size = base.size ?? 500
    const all: Transaction[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listTransactions({ ...base, page, size })
        all.push(...res.items)
        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}
