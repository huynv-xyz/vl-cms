import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { listTransactions, type TransactionListParams } from "@/api/transactions"
import type { Transaction } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<
        TransactionListParams,
        | "customer_code"
        | "customer_name"
        | "product_code"
        | "product_name"
        | "product_group_name"
        | "customer_type"
        | "hdn_status"
        | "region"
        | "document_date_from"
        | "document_date_to"
    >
}

type ExportColumn = {
    label: string
    value: (row: Transaction) => string | number | Date | null | undefined
    width?: number
    type?: "date" | "number" | "text"
}

const COLUMNS: ExportColumn[] = [
    { label: "Ngày chứng từ", value: (row) => parseDate(row.document_date), width: 14, type: "date" },
    { label: "Số chứng từ", value: (row) => row.document_no, width: 18 },
    { label: "Mã khách hàng", value: (row) => row.customer_code, width: 22 },
    { label: "Tên khách hàng", value: (row) => row.customer_name, width: 36 },
    { label: "Địa chỉ", value: (row) => row.customer_address, width: 38 },
    { label: "Mã hàng", value: (row) => row.product_code, width: 22 },
    { label: "Tên hàng trên chứng từ", value: (row) => row.product_name, width: 38 },
    { label: "Đơn vị chính (ĐVC)", value: (row) => row.unit, width: 18 },
    { label: "Tổng SL bán theo ĐVC", value: (row) => row.sale_qty, width: 18, type: "number" },
    { label: "Đơn giá theo ĐVC", value: (row) => row.unit_price, width: 18, type: "number" },
    { label: "Doanh số bán", value: (row) => row.revenue, width: 18, type: "number" },
    { label: "SL trả lại theo ĐVC", value: (row) => row.return_qty, width: 18, type: "number" },
    { label: "SL bán thực tế theo ĐVC", value: (row) => Number(row.sale_qty || 0) - Number(row.return_qty || 0), width: 22, type: "number" },
    { label: "Mã nhân viên bán hàng", value: (row) => row.sale_user_code, width: 20 },
    { label: "Tên nhân viên bán hàng", value: (row) => row.sale_user_name, width: 26 },
    { label: "Mã kho", value: (row) => row.warehouse_code, width: 14 },
    { label: "Tên kho", value: (row) => row.warehouse_name, width: 22 },
    { label: "Mô tả HH", value: (row) => row.description, width: 30 },
    { label: "Người liên hệ", value: (row) => row.contact_name, width: 22 },
    { label: "VTHH_CON", value: (row) => row.vthh_con, width: 18 },
    { label: "Tên nhóm VTHH", value: (row) => row.vthh_group_name, width: 22 },
    { label: "PHÂN_LOẠI_KH", value: (row) => row.customer_type, width: 16 },
    { label: "Trường mở rộng chi tiết 2", value: (row) => row.ext_detail_2, width: 34 },
    { label: "HÀNG_TẶNG", value: (row) => row.is_gift, width: 14, type: "number" },
    { label: "MÃ_RIÊNG", value: (row) => row.private_code, width: 18 },
    { label: "SL_RIÊNG_TL", value: (row) => row.sl_rieng_tl, width: 16, type: "number" },
    { label: "SL_TL_NHÓM", value: (row) => row.sl_tl_nhom, width: 16, type: "number" },
    { label: "SL_L_B2C", value: (row) => row.sl_lb2c, width: 14, type: "number" },
    { label: "SL_L_B2B", value: (row) => row.sl_lb2b, width: 14, type: "number" },
    { label: "SL_HDN", value: (row) => row.sl_hdn, width: 14, type: "number" },
    { label: "DIEM_HDN", value: (row) => row.diem_hdn, width: 14, type: "number" },
    { label: "THANG_XU_LY", value: (row) => row.process_month, width: 14, type: "number" },
    { label: "NPP", value: (row) => row.npp, width: 16 },
    { label: "MA_HOP _LE", value: (row) => row.valid_code, width: 16 },
    { label: "TINH_TRANG_HDN", value: (row) => row.hdn_status, width: 18 },
    { label: "NHÓM-CHUNG", value: (row) => row.common_group, width: 18 },
    { label: "KHU_VUC", value: (row) => row.region, width: 14 },
    { label: "SL_HDN_K0_MA_RIENG", value: (row) => row.sl_hdn_k0_ma_rieng, width: 22, type: "number" },
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
                customer_code: filters.customer_code || undefined,
                customer_name: filters.customer_name || undefined,
                product_code: filters.product_code || undefined,
                product_name: filters.product_name || undefined,
                product_group_name: filters.product_group_name || undefined,
                customer_type: filters.customer_type || undefined,
                hdn_status: filters.hdn_status || undefined,
                region: filters.region || undefined,
                document_date_from: filters.document_date_from || undefined,
                document_date_to: filters.document_date_to || undefined,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportTransactionsXlsx(rows, filters)
            toast.success(`Đã xuất ${rows.length} dòng dữ liệu bán hàng`)
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

async function exportTransactionsXlsx(rows: Transaction[], filters: Props["filters"]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Dữ liệu bán hàng", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow(["SỔ CHI TIẾT BÁN HÀNG"])
    sheet.addRow([formatExportPeriod(filters.document_date_from, filters.document_date_to)])
    sheet.addRow([])
    sheet.addRow(COLUMNS.map((column) => column.label))
    rows.forEach((row) => {
        sheet.addRow(COLUMNS.map((column) => normalizeCellValue(column.value(row), column)))
    })

    sheet.columns = COLUMNS.map((column) => ({
        width: column.width ?? 18,
    }))
    sheet.mergeCells(1, 1, 1, COLUMNS.length)
    sheet.mergeCells(2, 1, 2, COLUMNS.length)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: COLUMNS.length },
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FF000000" } },
        left: { style: "thin" as const, color: { argb: "FF000000" } },
        bottom: { style: "thin" as const, color: { argb: "FF000000" } },
        right: { style: "thin" as const, color: { argb: "FF000000" } },
    }

    const titleRow = sheet.getRow(1)
    titleRow.height = 28
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000000" } }
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const periodRow = sheet.getRow(2)
    periodRow.height = 22
    periodRow.getCell(1).font = { italic: true, color: { argb: "FF4B5563" } }
    periodRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const header = sheet.getRow(4)
    header.height = 24
    header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FF000000" } }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9D9D9" },
        }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell((cell, colNumber) => {
            const column = COLUMNS[colNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: true,
            }
            if (column.type === "date") {
                cell.numFmt = "dd/mm/yyyy"
            }
            if (column.type === "number") {
                cell.numFmt = "#,##0.######"
            }
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(
        buffer,
        `du-lieu-ban-hang-${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
}

function normalizeCellValue(
    value: string | number | Date | null | undefined,
    column: ExportColumn,
) {
    if (value == null) return ""
    if (column.type === "number") return normalizeExcelNumber(value)
    return value
}

function normalizeExcelNumber(value?: string | number | Date) {
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : ""
}

function parseDate(value?: string) {
    if (!value) return ""
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const dmy = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])))
    }

    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        return new Date(Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])))
    }

    return value
}

function formatExportPeriod(from?: string, to?: string) {
    return `Từ ngày ${formatDisplayDate(from) || "..."} đến ngày ${formatDisplayDate(to) || "..."}`
}

function formatDisplayDate(value?: string) {
    if (!value) return ""
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const dmy = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`
    }

    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        return `${ymd[3].padStart(2, "0")}/${ymd[2].padStart(2, "0")}/${ymd[1]}`
    }

    return value
}

function downloadBlob(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}
