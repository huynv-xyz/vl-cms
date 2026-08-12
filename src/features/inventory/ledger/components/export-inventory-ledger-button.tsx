import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listInventoryLedgerReport, type InventoryLedgerReportParams } from "@/api/inventory/ledger"
import { Button } from "@/components/ui/button"
import type { InventoryLedgerReportRow, InventoryLedgerTotals } from "../data/schema"
import { getDocTypeMeta } from "../data/schema"

type Props = {
    keyword?: string
    filters: Partial<InventoryLedgerReportParams>
    showValues?: boolean
    title?: string
    filePrefix?: string
}

type ExportColumn = {
    label: string
    value: (row: InventoryLedgerReportRow, index: number) => string | number | null | undefined
    width?: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity" | "money"
    total?: boolean
    totalKey?: keyof InventoryLedgerTotals
    valueColumn?: boolean
    absoluteOnOutbound?: boolean
}

const EXPORT_PAGE_SIZE = 500

const COLUMNS: ExportColumn[] = [
    { label: "STT", value: (_row, index) => index + 1, width: 8, type: "number", numberFormat: "integer" },
    { label: "Ngày", value: (row) => row.posting_date, width: 14, type: "date" },
    { label: "Giờ", value: (row) => formatTimeText(row.posting_time), width: 12 },
    { label: "Chứng từ", value: (row) => row.doc_no, width: 22 },
    { label: "Diễn giải", value: (row) => row.description, width: 36 },
    { label: "TK Nợ", value: (row) => row.tk_no, width: 12 },
    { label: "TK Có", value: (row) => row.tk_co, width: 12 },
    { label: "Mã hàng", value: (row) => row.product_code, width: 20 },
    { label: "Tên hàng", value: (row) => row.product_name, width: 42 },
    { label: "ĐVT", value: (row) => row.unit, width: 10 },
    { label: "Số lô", value: (row) => row.lot_code, width: 24 },
    { label: "Mã kho", value: (row) => row.warehouse_code, width: 20 },
    { label: "Kho", value: (row) => row.warehouse_name, width: 28 },
    { label: "Đơn giá", value: (row) => row.unit_price, width: 16, type: "number", numberFormat: "money", valueColumn: true },
    { label: "Tồn đầu - Số lượng", value: (row) => openingQuantity(row), width: 18, type: "number", numberFormat: "quantity", total: true, totalKey: "opening_quantity", absoluteOnOutbound: true },
    { label: "Tồn đầu - Giá trị", value: (row) => openingQuantity(row) * unitPrice(row), width: 18, type: "number", numberFormat: "money", total: true, totalKey: "opening_value", valueColumn: true, absoluteOnOutbound: true },
    { label: "Nhập - Số lượng", value: (row) => row.quantity_in, width: 18, type: "number", numberFormat: "quantity", total: true, totalKey: "inbound_quantity", absoluteOnOutbound: true },
    { label: "Nhập - Giá trị", value: (row) => Number(row.quantity_in || 0) > 0 ? Math.abs(Number(row.amount || 0)) : 0, width: 18, type: "number", numberFormat: "money", total: true, totalKey: "inbound_value", valueColumn: true, absoluteOnOutbound: true },
    { label: "Xuất - Số lượng", value: (row) => row.quantity_out, width: 18, type: "number", numberFormat: "quantity", total: true, totalKey: "outbound_quantity", absoluteOnOutbound: true },
    { label: "Xuất - Giá trị", value: (row) => Number(row.quantity_out || 0) > 0 ? Math.abs(Number(row.amount || 0)) : 0, width: 18, type: "number", numberFormat: "money", total: true, totalKey: "outbound_value", valueColumn: true, absoluteOnOutbound: true },
    { label: "Tồn sau - Số lượng", value: (row) => row.balance_quantity, width: 18, type: "number", numberFormat: "quantity", total: true, totalKey: "closing_quantity", absoluteOnOutbound: true },
    { label: "Tồn sau - Giá trị", value: (row) => Number(row.balance_quantity || 0) * unitPrice(row), width: 18, type: "number", numberFormat: "money", total: true, totalKey: "closing_value", valueColumn: true, absoluteOnOutbound: true },
    { label: "Loại chứng từ", value: (row) => getDocTypeMeta(row.doc_type).label, width: 34 },
    { label: "Mã đối tượng tập hợp chi phí", value: (row) => row.cost_object_code, width: 26 },
    { label: "Tên đối tượng tập hợp chi phí", value: (row) => row.cost_object_name, width: 42 },
    { label: "Tên nhà cung cấp", value: (row) => row.supplier_name, width: 28 },
    { label: "Mã loại", value: (row) => row.doc_type, width: 20 },
]

export function ExportInventoryLedgerButton({ keyword, filters, showValues = true, title = "SỔ CHI TIẾT VẬT TƯ HÀNG HÓA", filePrefix = "so-chi-tiet-vat-tu-hang-hoa" }: Props) {
    const [loading, setLoading] = useState(false)
    const columns = getExportColumns(showValues)

    const handleExport = async () => {
        try {
            setLoading(true)
            const exportData = await fetchAllInventoryLedger({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                product_id: filters.product_id,
                product_ids: filters.product_ids,
                warehouse_id: filters.warehouse_id,
                warehouse_ids: filters.warehouse_ids,
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
                product_code_text: filters.product_code_text || undefined,
                product_code_text_op: filters.product_code_text_op || undefined,
                product_name_text: filters.product_name_text || undefined,
                product_name_text_op: filters.product_name_text_op || undefined,
                warehouse_code_text: filters.warehouse_code_text || undefined,
                warehouse_code_text_op: filters.warehouse_code_text_op || undefined,
                warehouse_name_text: filters.warehouse_name_text || undefined,
                warehouse_name_text_op: filters.warehouse_name_text_op || undefined,
                unit: filters.unit || undefined,
                lot_text: filters.lot_text || undefined,
                lot_text_op: filters.lot_text_op || undefined,
                time_sort: filters.time_sort || "asc",
                direction: filters.direction || undefined,
                show_values: filters.show_values,
            })

            if (!exportData.rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportInventoryLedgerXlsx(exportData.rows, exportData.totals, filters, columns, title, filePrefix, showValues)
            toast.success(`Đã xuất ${exportData.rows.length} dòng sổ chi tiết vật tư hàng hóa`)
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

async function fetchAllInventoryLedger(base: InventoryLedgerReportParams): Promise<{ rows: InventoryLedgerReportRow[]; totals?: InventoryLedgerTotals }> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: InventoryLedgerReportRow[] = []
    let page = 1
    let totals: InventoryLedgerTotals | undefined

    for (let guard = 0; guard < 500; guard++) {
        const res = await listInventoryLedgerReport({ ...base, page, size })
        if (page === 1) {
            totals = res.totals
        }
        all.push(...(res.items || []))

        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return { rows: all, totals }
}

function getExportColumns(showValues: boolean) {
    if (showValues) return COLUMNS
    return COLUMNS
        .filter((column) => !column.valueColumn)
        .map((column) => ({
            ...column,
            label: column.label.endsWith(" - Số lượng")
                ? column.label.replace(" - Số lượng", "")
                : column.label,
        }))
}

function ledgerHeaderGroup(column: ExportColumn): { label: string; subLabel: string } | null {
    const groups = [
        { prefix: "Tồn đầu - ", label: "Tồn đầu" },
        { prefix: "Nhập - ", label: "Nhập" },
        { prefix: "Xuất - ", label: "Xuất" },
        { prefix: "Tồn sau - ", label: "Tồn sau" },
    ]
    const group = groups.find((item) => column.label.startsWith(item.prefix))
    if (!group) return null
    return {
        label: group.label,
        subLabel: column.label.slice(group.prefix.length),
    }
}

function buildGroupedHeaderTop(columns: ExportColumn[]) {
    return columns.map((column, index) => {
        const current = ledgerHeaderGroup(column)
        if (!current) return column.label

        const previous = index > 0 ? ledgerHeaderGroup(columns[index - 1]) : null
        return previous?.label === current.label ? "" : current.label
    })
}

function buildGroupedHeaderBottom(columns: ExportColumn[]) {
    return columns.map((column) => ledgerHeaderGroup(column)?.subLabel ?? "")
}

function applyGroupedHeaderMerges(sheet: any, columns: ExportColumn[], headerStartRow: number) {
    for (let index = 0; index < columns.length; index++) {
        const columnNumber = index + 1
        const current = ledgerHeaderGroup(columns[index])
        if (!current) {
            sheet.mergeCells(headerStartRow, columnNumber, headerStartRow + 1, columnNumber)
            continue
        }

        const previous = index > 0 ? ledgerHeaderGroup(columns[index - 1]) : null
        if (previous?.label === current.label) continue

        let endIndex = index
        while (endIndex + 1 < columns.length && ledgerHeaderGroup(columns[endIndex + 1])?.label === current.label) {
            endIndex += 1
        }

        if (endIndex > index) {
            sheet.mergeCells(headerStartRow, columnNumber, headerStartRow, endIndex + 1)
        }
    }
}

async function exportInventoryLedgerXlsx(
    rows: InventoryLedgerReportRow[],
    totals: InventoryLedgerTotals | undefined,
    filters: Partial<InventoryLedgerReportParams>,
    columns: ExportColumn[],
    title: string,
    filePrefix: string,
    showValues: boolean,
) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()
    const groupedHeader = showValues
    const exportDirection = filters.direction === "OUT" ? "OUT" : filters.direction === "IN" ? "IN" : undefined
    const headerStartRow = 4
    const dataStartRow = groupedHeader ? 6 : 5

    const sheet = workbook.addWorksheet("Sổ chi tiết VT HH", {
        views: [{ state: "frozen", ySplit: groupedHeader ? 5 : 4 }],
    })

    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.getCell(1, 1).value = title
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.getCell(2, 1).value = `Thời gian lọc: ${formatPeriod(filters.from_date, filters.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }

    sheet.addRow([])
    if (groupedHeader) {
        sheet.addRow(buildGroupedHeaderTop(columns))
        sheet.addRow(buildGroupedHeaderBottom(columns))
        applyGroupedHeaderMerges(sheet, columns, headerStartRow)
    } else {
        sheet.addRow(columns.map((column) => column.label))
    }
    rows.forEach((row, index) => {
        sheet.addRow(columns.map((column) => normalizeCellValue(displayExportValue(column.value(row, index), column, exportDirection), column)))
    })
    const totalRowIndex = sheet.rowCount + 1
    sheet.addRow(columns.map((column, index) => {
        if (index === 0) return "Tổng"
        if (!column.total) return ""
        if (column.totalKey && totals && totals[column.totalKey] !== undefined && totals[column.totalKey] !== null) {
            return displayExportValue(Number(totals[column.totalKey] || 0), column, exportDirection)
        }
        return rows.reduce((sum, row, rowIndex) => {
            const value = normalizeCellValue(displayExportValue(column.value(row, rowIndex), column, exportDirection), column)
            const numberValue = Number(value)
            return sum + (Number.isFinite(numberValue) ? numberValue : 0)
        }, 0)
    }))

    autoFitColumns(sheet, columns)
    if (!groupedHeader) {
        sheet.autoFilter = {
            from: { row: 4, column: 1 },
            to: { row: 4, column: columns.length },
        }
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }

    for (let rowIndex = headerStartRow; rowIndex < dataStartRow; rowIndex++) {
        const header = sheet.getRow(rowIndex)
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
    }

    for (let rowIndex = dataStartRow; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        const isTotalRow = rowIndex === totalRowIndex
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.border = border
            if (isTotalRow) {
                cell.font = { bold: true }
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF1F5F9" },
                }
            }
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
    downloadBlob(buffer, `${filePrefix}-${todayYmd()}.xlsx`)
}

function openingQuantity(row: InventoryLedgerReportRow) {
    return Number(row.balance_quantity || 0) - Number(row.quantity_in || 0) + Number(row.quantity_out || 0)
}

function unitPrice(row: InventoryLedgerReportRow) {
    return Number(row.unit_price || 0)
}

function displayExportValue(
    value: string | number | null | undefined,
    column: ExportColumn,
    direction?: "IN" | "OUT",
) {
    if (direction !== "OUT" || !column.absoluteOnOutbound || column.type !== "number") return value
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? Math.abs(numberValue) : value
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
        const maxWidth = ["Diễn giải", "Tên hàng", "Tên sản phẩm"].includes(column.label)
            ? 64
            : ["Tên nhà cung cấp", "Loại chứng từ", "Kho"].includes(column.label)
                ? 44
                : 28

        excelColumn.width = Math.min(Math.max(maxLength + 2, minWidth), maxWidth)
    })
}

function displayLength(value: any, column: ExportColumn) {
    if (value == null || value === "") return 0
    if (column.type === "date") return formatDateText(String(value)).length
    if (column.type === "number") {
        const numberValue = Number(value)
        if (!Number.isFinite(numberValue)) return 0
        return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(numberValue).length
    }
    if (typeof value === "object" && "text" in value) return String(value.text || "").length
    if (typeof value === "object" && "richText" in value) {
        return (value.richText || []).reduce((sum: number, part: any) => sum + String(part.text || "").length, 0)
    }
    return String(value).length
}

function normalizeCellValue(
    value: string | number | null | undefined,
    column: ExportColumn,
) {
    if (value == null || value === "") return ""
    if (column.type === "date") {
        return excelDateSerial(String(value)) || ""
    }
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function getExcelNumberFormat(value: unknown, column: ExportColumn) {
    const numberValue = Number(value)
    if (column.numberFormat === "integer") return "#,##0"
    if (Number.isFinite(numberValue) && Number.isInteger(numberValue)) return "#,##0"
    return "#,##0.###"
}

function formatPeriod(fromDate?: string, toDate?: string) {
    const from = fromDate ? formatDateText(fromDate) : "Đầu kỳ"
    const to = toDate ? formatDateText(toDate) : "Hôm nay"
    return `${from} - ${to}`
}

function formatDateText(value?: string | null) {
    if (!value) return ""
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) {
        return `${ymd[3].padStart(2, "0")}/${ymd[2].padStart(2, "0")}/${ymd[1]}`
    }
    return value
}

function formatTimeText(value?: string | null) {
    if (!value) return ""
    return String(value).trim().split(".")[0]
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

function todayYmd() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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
