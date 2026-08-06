import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { listExportExcelLines, type ExportExcelLine } from "@/api/sale/export"
import { exportStatusLabel } from "./export-status"

type ExportFilters = {
    status?: string[]
    order_id?: number
    customer_id?: number
    delivery_id?: number
    warehouse_id?: number
    from_date?: string
    to_date?: string
}

type Props = {
    keyword?: string
    filters: ExportFilters
}

type ExcelColumn = {
    label: string
    width: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity" | "money"
    value: (row: ExportExcelLine, index: number) => string | number | Date | null | undefined
}

const COLUMNS: ExcelColumn[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã phiếu xuất", width: 20, value: (row) => row.export_no },
    { label: "Ngày xuất", width: 14, type: "date", value: (row) => row.export_date },
    { label: "Mã kho", width: 18, value: (row) => row.warehouse_code },
    { label: "Tên kho", width: 28, value: (row) => row.warehouse_name },
    { label: "Mã khách hàng", width: 22, value: (row) => row.customer_code },
    { label: "Tên khách hàng", width: 36, value: (row) => row.customer_name },
    { label: "Mã hàng", width: 22, value: (row) => row.product_code },
    { label: "Tên hàng", width: 42, value: (row) => row.product_name },
    { label: "Mô tả", width: 32, value: (row) => row.description },
    { label: "ĐVT", width: 10, value: (row) => row.unit },
    { label: "Số lượng", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.quantity },
    { label: "Tình trạng", width: 18, value: (row) => exportStatusLabel(row.status) },
]

export function ExportExcelButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await listExportExcelLines({
                keyword: keyword || undefined,
                status: filters.status?.length ? filters.status.join(",") : undefined,
                order_id: filters.order_id,
                customer_id: filters.customer_id,
                delivery_id: filters.delivery_id,
                warehouse_id: filters.warehouse_id,
                from_date: filters.from_date,
                to_date: filters.to_date,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất Excel")
                return
            }

            await exportRows(rows, filters)
            toast.success(`Đã xuất ${rows.length} dòng chi tiết phiếu xuất`)
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

async function exportRows(rows: ExportExcelLine[], filters: ExportFilters) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Phiếu xuất", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow(["DANH SÁCH PHIẾU XUẤT KHO"])
    sheet.addRow([`Thời gian lọc: ${formatExportPeriod(filters.from_date, filters.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`])
    sheet.addRow([])
    sheet.addRow(COLUMNS.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(COLUMNS.map((column) => normalizeCellValue(column.value(row, index), column)))
    })

    sheet.columns = COLUMNS.map((column) => ({ width: column.width }))
    sheet.mergeCells(1, 1, 1, COLUMNS.length)
    sheet.mergeCells(2, 1, 2, COLUMNS.length)
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

    const title = sheet.getRow(1)
    title.height = 24
    title.getCell(1).font = { bold: true, size: 16 }
    title.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const period = sheet.getRow(2)
    period.height = 22
    period.getCell(1).font = { italic: true, color: { argb: "FF64748B" } }
    period.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const header = sheet.getRow(4)
    header.height = 28
    header.eachCell({ includeEmpty: true }, (cell) => {
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
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
            const column = COLUMNS[columnNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: false,
            }
            if (column.type === "date") {
                cell.numFmt = "dd/mm/yyyy"
            }
            if (column.type === "number") {
                cell.numFmt = getExcelNumberFormat(cell.value, column)
            }
        })
        row.height = 22
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `phieu-xuat-kho-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function normalizeCellValue(
    value: string | number | Date | null | undefined,
    column: ExcelColumn,
) {
    if (value == null || value === "") return ""
    if (column.type === "date") {
        return excelDateSerial(String(value)) || ""
    }
    if (column.type === "number") {
        const amount = Number(value)
        return Number.isFinite(amount) ? amount : ""
    }
    return value
}

function getExcelNumberFormat(value: unknown, column: ExcelColumn) {
    const amount = Number(value)
    if (column.numberFormat === "integer" || column.numberFormat === "money") return "#,##0"
    if (Number.isFinite(amount) && Number.isInteger(amount)) return "#,##0"
    return "#,##0.###"
}

function formatExportPeriod(from?: string, to?: string) {
    const fromText = from ? formatDisplayDate(from) : "Đầu kỳ"
    const toText = to ? formatDisplayDate(to) : "Hôm nay"
    return `${fromText} - ${toText}`
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

function excelDateSerial(value?: string | null) {
    if (!value) return null
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    const dmy = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    const year = ymd ? Number(ymd[1]) : dmy ? Number(dmy[3]) : 0
    const month = ymd ? Number(ymd[2]) : dmy ? Number(dmy[2]) : 0
    const day = ymd ? Number(ymd[3]) : dmy ? Number(dmy[1]) : 0
    if (!year || !month || !day) return null

    const utcMidnight = Date.UTC(year, month - 1, day)
    const excelEpoch = Date.UTC(1899, 11, 30)
    return Math.round((utcMidnight - excelEpoch) / 86_400_000)
}

function autoFitColumns(sheet: any, columns: ExcelColumn[]) {
    columns.forEach((column, index) => {
        const excelColumn = sheet.getColumn(index + 1)
        let maxLength = String(column.label || "").length

        excelColumn.eachCell({ includeEmpty: true }, (cell: any, rowNumber: number) => {
            if (rowNumber < 4) return
            maxLength = Math.max(maxLength, displayLength(cell.value, column))
        })

        const minWidth = column.type === "number" ? 12 : column.type === "date" ? 12 : 10
        const maxWidth = ["Mô tả", "Tên hàng", "Tên khách hàng"].includes(column.label)
            ? 64
            : ["Tên kho", "Tình trạng"].includes(column.label)
                ? 44
                : 28

        excelColumn.width = Math.min(Math.max(maxLength + 2, minWidth, column.width), maxWidth)
    })
}

function displayLength(value: any, column: ExcelColumn) {
    if (value == null || value === "") return 0
    if (column.type === "date") return formatDisplayDate(String(value)).length
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
