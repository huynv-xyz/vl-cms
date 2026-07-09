import { listShipmentItems, type ShipmentItemListParams } from "@/api/purchasing/shipment_items"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { ShipmentItem } from "../../shipment-item/data/schema"
import { getShipmentStatusLabel } from "../data/shipment-status"

export type ShipmentScheduleExportParams = Omit<ShipmentItemListParams, "page" | "size">

type Props = {
    params: ShipmentScheduleExportParams
}

type ExportColumn = {
    label: string
    value: (row: ExportRow, index: number) => string | number | null | undefined
    width?: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity"
    align?: "left" | "center" | "right"
}

type ExportRow = {
    group_name: string
    product_name: string
    unit: string
    etd?: string
    eta?: string
    destination_port: string
    real_quantity: number
    status_label: string
    note: string
}

const EXPORT_PAGE_SIZE = 200

const EXPORT_COLUMNS: ExportColumn[] = [
    { label: "Loại", width: 24, align: "center", value: (row) => row.group_name },
    { label: "Tên hàng", width: 42, value: (row) => row.product_name },
    { label: "ĐVT", width: 10, align: "center", value: (row) => row.unit },
    { label: "Ngày đi", width: 14, type: "date", value: (row) => row.etd },
    { label: "Ngày đến", width: 14, type: "date", value: (row) => row.eta },
    { label: "Cảng đến", width: 28, align: "center", value: (row) => row.destination_port },
    { label: "SL Nhập", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.real_quantity },
    { label: "Tình trạng hàng", width: 22, align: "center", value: (row) => row.status_label },
    { label: "Ghi chú", width: 42, value: (row) => row.note },
]

export function ShipmentScheduleExportButton({ params }: Props) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        try {
            setIsExporting(true)
            const items = await fetchAllShipmentItems(params)

            if (!items.length) {
                toast.info("Không có dữ liệu để xuất")
                return
            }

            await exportShipmentScheduleExcel(items)
            toast.success(`Đã xuất ${items.length} dòng`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button type="button" variant="outline" disabled={isExporting} onClick={handleExport}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isExporting ? "Đang xuất..." : "Xuất Excel"}
        </Button>
    )
}

async function fetchAllShipmentItems(params: ShipmentScheduleExportParams) {
    let page = 1
    let totalPage = 1
    const items: ShipmentItem[] = []

    do {
        const result = await listShipmentItems({
            ...params,
            page,
            size: EXPORT_PAGE_SIZE,
        })

        items.push(...(result.items ?? []))
        totalPage = result.total_page || 1
        page += 1
    } while (page <= totalPage)

    return items
}

async function exportShipmentScheduleExcel(items: ShipmentItem[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const rows = buildExportRows(items)
    const sheet = workbook.addWorksheet("Lịch hàng về", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.mergeCells(1, 1, 1, EXPORT_COLUMNS.length)
    sheet.getCell(1, 1).value = "LỊCH HÀNG VỀ DỰ KIẾN"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    sheet.mergeCells(2, 1, 2, EXPORT_COLUMNS.length)
    sheet.getCell(2, 1).value = `Cập nhật ngày: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }

    sheet.addRow([])
    sheet.addRow(EXPORT_COLUMNS.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(EXPORT_COLUMNS.map((column) => normalizeCellValue(column.value(row, index), column)))
    })

    sheet.columns = EXPORT_COLUMNS.map((column) => ({ width: column.width ?? 18 }))
    applyAutoColumnWidths(sheet, EXPORT_COLUMNS, 5)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: EXPORT_COLUMNS.length },
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
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.border = border
    })

    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.height = 22
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const column = EXPORT_COLUMNS[colNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: getCellHorizontalAlignment(column),
                wrapText: false,
            }
            if (column.type === "date") cell.numFmt = "dd/mm/yyyy"
            if (column.type === "number") cell.numFmt = getExcelNumberFormat(cell.value, column)
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `lich-hang-ve-du-kien-${todayYmd()}.xlsx`)
}

function buildExportRows(items: ShipmentItem[]): ExportRow[] {
    const sortedItems = [...items].sort((a, b) => {
        const groupCompare = getProductGroupName(a).localeCompare(getProductGroupName(b), "vi")
        if (groupCompare !== 0) return groupCompare

        const dateCompare = dateSortKey(a.shipment?.eta).localeCompare(dateSortKey(b.shipment?.eta))
        if (dateCompare !== 0) return dateCompare

        return String(a.product?.name ?? "").localeCompare(String(b.product?.name ?? ""), "vi")
    })

    let lastGroupName = ""
    return sortedItems.map((item) => {
        const groupName = getProductGroupName(item)
        const displayGroupName = groupName === lastGroupName ? "" : groupName
        const realQuantity = Math.max(Number(item.quantity ?? 0) - Number(item.defect_quantity ?? 0), 0)
        lastGroupName = groupName

        return {
            group_name: displayGroupName,
            product_name: item.product?.name || "",
            unit: item.product?.unit || "",
            etd: item.shipment?.etd,
            eta: item.shipment?.eta,
            destination_port: item.shipment?.destination_port?.name || "",
            real_quantity: realQuantity,
            status_label: getShipmentStatusLabel(item.shipment?.status),
            note: item.note || item.shipment?.note || "",
        }
    })
}

function normalizeCellValue(value: string | number | null | undefined, column: ExportColumn) {
    if (value == null || value === "") return ""
    if (column.type === "date") return excelDateSerial(String(value)) || ""
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function getProductGroupName(item: ShipmentItem) {
    return item.product?.group?.name || item.product?.group_name || item.product?.group_code || "Chưa phân loại"
}

function dateSortKey(value?: string) {
    const date = parseDateParts(value)
    if (!date) return ""
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`
}

function excelDateSerial(value?: string | null) {
    const date = parseDateParts(value)
    if (!date) return null
    const utcMidnight = Date.UTC(date.year, date.month - 1, date.day)
    const excelEpoch = Date.UTC(1899, 11, 30)
    return Math.round((utcMidnight - excelEpoch) / 86_400_000)
}

function parseDateParts(value?: string | null) {
    if (!value) return null
    const text = String(value).trim().split(/[T\s]/)[0]
    const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    const year = ymd ? Number(ymd[1]) : dmy ? Number(dmy[3]) : 0
    const month = ymd ? Number(ymd[2]) : dmy ? Number(dmy[2]) : 0
    const day = ymd ? Number(ymd[3]) : dmy ? Number(dmy[1]) : 0
    if (!year || !month || !day) return null
    return { year, month, day }
}

function getExcelNumberFormat(value: unknown, column: ExportColumn) {
    const numberValue = Number(value)
    if (column.numberFormat === "integer") return "#,##0"
    if (Number.isFinite(numberValue) && Number.isInteger(numberValue)) return "#,##0"
    return "#,##0.###"
}

function getCellHorizontalAlignment(column: ExportColumn) {
    if (column.align) return column.align
    if (column.type === "number") return "right"
    if (column.type === "date") return "center"
    return "left"
}

function applyAutoColumnWidths(sheet: any, columns: ExportColumn[], firstDataRow: number) {
    sheet.columns.forEach((column: any, index: number) => {
        const config = columns[index]
        let maxLength = config?.label?.length || 8

        for (let rowIndex = firstDataRow; rowIndex <= sheet.rowCount; rowIndex++) {
            const cell = sheet.getRow(rowIndex).getCell(index + 1)
            const text = cell.value == null ? "" : config?.type === "date" ? "dd/mm/yyyy" : String(cell.value)
            const longestLine = text.split(/\r?\n/).reduce((max: number, line: string) => Math.max(max, line.length), 0)
            maxLength = Math.max(maxLength, longestLine)
        }

        const maxWidth = config?.width ?? 18
        const minWidth = config?.type === "number" ? 10 : config?.type === "date" ? 12 : Math.min(maxWidth, 8)
        column.width = Math.min(Math.max(maxLength + 2, minWidth), maxWidth)
    })
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
