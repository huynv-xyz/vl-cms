import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listInventoryLedgerReport, type InventoryLedgerReportParams } from "@/api/inventory/ledger"
import { Button } from "@/components/ui/button"
import type { InventoryLedgerReportRow } from "../data/schema"
import { getDocTypeMeta } from "../data/schema"

type Props = {
    keyword?: string
    filters: Partial<InventoryLedgerReportParams>
}

type ExportColumn = {
    label: string
    value: (row: InventoryLedgerReportRow, index: number) => string | number | Date | null | undefined
    width?: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity" | "money"
}

const EXPORT_PAGE_SIZE = 500

const COLUMNS: ExportColumn[] = [
    { label: "STT", value: (_row, index) => index + 1, width: 8, type: "number", numberFormat: "integer" },
    { label: "Ngày", value: (row) => parseDate(row.posting_date), width: 14, type: "date" },
    { label: "Chứng từ", value: (row) => row.doc_no, width: 22 },
    { label: "Diễn giải", value: (row) => row.description, width: 36 },
    { label: "Tên nhà cung cấp", value: (row) => row.supplier_name, width: 28 },
    { label: "TK Nợ", value: (row) => row.tk_no, width: 12 },
    { label: "TK Có", value: (row) => row.tk_co, width: 12 },
    { label: "Mã sản phẩm", value: (row) => row.product_code, width: 20 },
    { label: "Tên sản phẩm", value: (row) => row.product_name, width: 42 },
    { label: "ĐVT", value: (row) => row.unit, width: 10 },
    { label: "Số lô", value: (row) => row.lot_code, width: 24 },
    { label: "Kho", value: (row) => row.warehouse_name, width: 28 },
    { label: "Đơn giá", value: (row) => row.unit_price, width: 16, type: "number", numberFormat: "money" },
    { label: "Tồn đầu", value: (row) => Number(row.balance_quantity || 0) - Number(row.quantity_in || 0) + Number(row.quantity_out || 0), width: 16, type: "number", numberFormat: "quantity" },
    { label: "Nhập", value: (row) => row.quantity_in, width: 16, type: "number", numberFormat: "quantity" },
    { label: "Xuất", value: (row) => row.quantity_out, width: 16, type: "number", numberFormat: "quantity" },
    { label: "Tồn sau", value: (row) => row.balance_quantity, width: 16, type: "number", numberFormat: "quantity" },
    { label: "Thành tiền", value: (row) => row.amount, width: 18, type: "number", numberFormat: "money" },
    { label: "Loại chứng từ", value: (row) => getDocTypeMeta(row.doc_type).label, width: 34 },
    { label: "Mã loại", value: (row) => row.doc_type, width: 20 },
]

export function ExportInventoryLedgerButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllInventoryLedger({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                product_id: filters.product_id,
                warehouse_id: filters.warehouse_id,
                doc_type: filters.doc_type || undefined,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                doc_text: filters.doc_text || undefined,
                doc_text_op: filters.doc_text_op || undefined,
                description_text: filters.description_text || undefined,
                description_text_op: filters.description_text_op || undefined,
                supplier_text: filters.supplier_text || undefined,
                supplier_text_op: filters.supplier_text_op || undefined,
                product_text: filters.product_text || undefined,
                product_text_op: filters.product_text_op || undefined,
                unit: filters.unit || undefined,
                lot_text: filters.lot_text || undefined,
                lot_text_op: filters.lot_text_op || undefined,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportInventoryLedgerXlsx(rows, filters)
            toast.success(`Đã xuất ${rows.length} dòng sổ kho`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button type="button" size="sm" variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
        </Button>
    )
}

async function fetchAllInventoryLedger(base: InventoryLedgerReportParams): Promise<InventoryLedgerReportRow[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: InventoryLedgerReportRow[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listInventoryLedgerReport({ ...base, page, size })
        all.push(...(res.items || []))

        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return all
}

async function exportInventoryLedgerXlsx(rows: InventoryLedgerReportRow[], filters: Partial<InventoryLedgerReportParams>) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Sổ kho", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.mergeCells(1, 1, 1, COLUMNS.length)
    sheet.getCell(1, 1).value = "SỔ KHO"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    sheet.mergeCells(2, 1, 2, COLUMNS.length)
    sheet.getCell(2, 1).value = `Thời gian lọc: ${formatPeriod(filters.from_date, filters.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }

    sheet.addRow([])
    sheet.addRow(COLUMNS.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(COLUMNS.map((column) => normalizeCellValue(column.value(row, index), column)))
    })

    autoFitColumns(sheet, COLUMNS)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: COLUMNS.length },
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }

    const header = sheet.getRow(4)
    header.height = 28
    header.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0F766E" },
        }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
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
                cell.numFmt = getExcelNumberFormat(cell.value, column)
            }
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `so-kho-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function autoFitColumns(sheet: any, columns: ExportColumn[]) {
    columns.forEach((column, index) => {
        const excelColumn = sheet.getColumn(index + 1)
        let maxLength = String(column.label || "").length

        excelColumn.eachCell({ includeEmpty: true }, (cell: any, rowNumber: number) => {
            if (rowNumber < 4) return
            maxLength = Math.max(maxLength, displayLength(cell.value, column))
        })

        const minWidth = column.type === "number" ? 12 : column.type === "date" ? 12 : 10
        const maxWidth = ["Diá»…n giáº£i", "TÃªn sáº£n pháº©m"].includes(column.label)
            ? 64
            : ["TÃªn nhÃ  cung cáº¥p", "Loáº¡i chá»©ng tá»«", "Kho"].includes(column.label)
                ? 44
                : 28

        excelColumn.width = Math.min(Math.max(maxLength + 2, minWidth), maxWidth)
    })
}

function displayLength(value: any, column: ExportColumn) {
    if (value == null || value === "") return 0
    if (value instanceof Date) return 10
    if (column.type === "number") {
        const numberValue = Number(value)
        if (!Number.isFinite(numberValue)) return 0
        return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(numberValue).length
    }
    if (typeof value === "object" && "text" in value) return String(value.text || "").length
    if (typeof value === "object" && "richText" in value) {
        return (value.richText || []).reduce((sum: number, part: any) => sum + String(part.text || "").length, 0)
    }
    return String(value).length
}

function normalizeCellValue(
    value: string | number | Date | null | undefined,
    column: ExportColumn,
) {
    if (value == null || value === "") return ""
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function getExcelNumberFormat(value: unknown, column: ExportColumn) {
    const numberValue = Number(value)
    if (column.numberFormat === "integer" || column.numberFormat === "money") return "#,##0"
    if (Number.isFinite(numberValue) && Number.isInteger(numberValue)) return "#,##0"
    return "#,##0.###"
}

function parseDate(value?: string | null) {
    if (!value) return ""
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    }

    const dmy = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) {
        return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    }

    return value
}

function formatPeriod(fromDate?: string, toDate?: string) {
    const from = fromDate ? formatDateText(fromDate) : "Đầu kỳ"
    const to = toDate ? formatDateText(toDate) : "Hôm nay"
    return `${from} - ${to}`
}

function formatDateText(value: string) {
    const dateOnly = value.trim().split(/[T\s]/)[0]
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
