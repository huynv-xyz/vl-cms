import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listInventoryLots, type InventoryLotListParams } from "@/api/inventory/lot"
import { Button } from "@/components/ui/button"
import type { InventoryLot } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<
        InventoryLotListParams,
        | "product_id"
        | "product_ids"
        | "warehouse_id"
        | "warehouse_ids"
        | "from_date"
        | "to_date"
        | "only_remaining"
        | "product_text"
        | "product_text_op"
        | "product_code_text"
        | "product_code_text_op"
        | "product_name_text"
        | "product_name_text_op"
        | "quote_text"
        | "quote_text_op"
        | "unit"
        | "lot_text"
        | "lot_text_op"
        | "lot_warning"
    >
}

type ExportColumn = {
    label: string
    value: (row: InventoryLot, index: number) => string | number | Date | null | undefined
    width?: number
    type?: "date" | "number" | "text"
}

const EXPORT_PAGE_SIZE = 500

const COLUMNS: ExportColumn[] = [
    { label: "STT", value: (_row, index) => index + 1, width: 8, type: "number" },
    { label: "Mã hàng", value: (row) => rowString(row, "product_code") || row.product?.code, width: 18 },
    { label: "Tên hàng", value: (row) => rowString(row, "product_name") || row.product?.name, width: 42 },
    { label: "ĐVT", value: (row) => rowString(row, "unit") || row.product?.unit, width: 10 },
    { label: "Mã kho", value: (row) => rowString(row, "warehouse_code") || row.warehouse?.code, width: 18 },
    { label: "Kho", value: (row) => rowString(row, "warehouse_name") || row.warehouse?.name, width: 28 },
    { label: "Số lô", value: (row) => rowString(row, "lot_no") || row.lot_no, width: 22 },
    { label: "Ngày nhập", value: (row) => parseDate(rowString(row, "inbound_date") || row.inbound_date), width: 14, type: "date" },
    { label: "HSD", value: (row) => parseDate(rowString(row, "expiry_date") || row.expiry_date), width: 14, type: "date" },
    { label: "Cảnh báo", value: (row) => lotWarningLabel(row), width: 28 },
    { label: "Tồn đầu kỳ - Số lượng", value: (row) => rowNumber(row, "opening_quantity"), width: 18, type: "number" },
    { label: "Tồn đầu kỳ - Giá trị", value: (row) => rowNumber(row, "opening_value"), width: 18, type: "number" },
    { label: "Nhập kho - Số lượng", value: (row) => rowNumber(row, "inbound_quantity"), width: 18, type: "number" },
    { label: "Nhập kho - Giá trị", value: (row) => rowNumber(row, "inbound_value"), width: 18, type: "number" },
    { label: "Xuất kho - Số lượng", value: (row) => rowNumber(row, "outbound_quantity"), width: 18, type: "number" },
    { label: "Xuất kho - Giá trị", value: (row) => rowNumber(row, "outbound_value"), width: 18, type: "number" },
    { label: "Tồn cuối kỳ - Số lượng", value: (row) => rowNumber(row, "closing_quantity"), width: 18, type: "number" },
    { label: "Tồn cuối kỳ - Giá trị", value: (row) => rowNumber(row, "closing_value"), width: 18, type: "number" },
    { label: "Nhóm hàng", value: (row) => rowString(row, "quote_name") || row.product?.quote_name, width: 28 },
    { label: "Tính chất", value: (row) => rowString(row, "nature") || row.product?.nature, width: 16 },
    { label: "Dạng hàng", value: () => "", width: 16 },
]
export function ExportInventoryLotsButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllInventoryLots({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                product_id: filters.product_id,
                product_ids: filters.product_ids,
                warehouse_id: filters.warehouse_id,
                warehouse_ids: filters.warehouse_ids,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
                product_text: filters.product_text,
                product_text_op: filters.product_text_op,
                product_code_text: filters.product_code_text,
                product_code_text_op: filters.product_code_text_op,
                product_name_text: filters.product_name_text,
                product_name_text_op: filters.product_name_text_op,
                quote_text: filters.quote_text,
                quote_text_op: filters.quote_text_op,
                unit: filters.unit,
                lot_text: filters.lot_text,
                lot_text_op: filters.lot_text_op,
                lot_warning: filters.lot_warning,
                only_remaining: filters.only_remaining,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportInventoryLotsXlsx(rows)
            toast.success(`Đã xuất ${rows.length} dòng tồn kho theo lô`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Xuất Excel thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button type="button" variant="outline" onClick={handleExport} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Xuất Excel
        </Button>
    )
}

async function fetchAllInventoryLots(base: InventoryLotListParams): Promise<InventoryLot[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: InventoryLot[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listInventoryLots({ ...base, page, size })
        all.push(...res.items)

        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}

async function exportInventoryLotsXlsx(rows: InventoryLot[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Tồn kho theo lô", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.mergeCells(1, 1, 1, COLUMNS.length)
    sheet.getCell(1, 1).value = "TỒN KHO THEO LÔ"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24

    sheet.mergeCells(2, 1, 2, COLUMNS.length)
    sheet.getCell(2, 1).value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).alignment = { horizontal: "right", vertical: "middle" }
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }

    sheet.addRow([])
    sheet.addRow(COLUMNS.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(COLUMNS.map((column) => normalizeCellValue(column.value(row, index), column)))
    })

    sheet.columns = COLUMNS.map((column) => ({ width: column.width ?? 18 }))
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
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
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
                wrapText: false,
            }
            if (column.type === "date") cell.numFmt = "dd/mm/yyyy"
            if (column.type === "number") cell.numFmt = "#,##0.###"
        })
        row.height = 22
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `ton-kho-theo-lo-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function normalizeCellValue(value: string | number | Date | null | undefined, column: ExportColumn) {
    if (value == null || value === "") return ""
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function rowNumber(row: InventoryLot, key: string) {
    const value = (row as any)?.[key]
    const numberValue = Number(value || 0)
    return Number.isFinite(numberValue) ? numberValue : 0
}

function rowString(row: InventoryLot, key: string) {
    const value = (row as any)?.[key]
    return value == null ? "" : String(value)
}

function parseDate(value?: string | null) {
    if (!value) return ""
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))

    const dmy = dateOnly.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))

    return value
}

function lotWarningLabel(row: InventoryLot) {
    const today = startOfDay(new Date())
    const expiryDate = parseLocalDate(rowString(row, "expiry_date") || row.expiry_date)

    if (expiryDate && expiryDate < today) return "Hết hạn"

    if (expiryDate) {
        const days = Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000)
        if (days >= 0 && days <= 180) return `Còn ${formatRemainingTime(days)}`
    }

    const inboundDate = parseLocalDate(rowString(row, "inbound_date") || row.inbound_date)
    if (
        inboundDate &&
        monthDiff(inboundDate, today) >= 6 &&
        rowNumber(row, "closing_quantity") !== 0 &&
        rowNumber(row, "outbound_quantity") === 0
    ) {
        return "Nhập 6 tháng chưa xuất"
    }

    return ""
}

function formatRemainingTime(days: number) {
    const months = Math.floor(days / 30)
    const restDays = days % 30
    if (months <= 0) return `${restDays} ngày nữa hết hạn`
    if (restDays <= 0) return `${months} tháng nữa hết hạn`
    return `${months} tháng ${restDays} ngày nữa hết hạn`
}

function monthDiff(from: Date, to: Date) {
    let months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
    if (to.getDate() < from.getDate()) months -= 1
    return months
}

function parseLocalDate(value?: string | null) {
    if (!value) return null
    const [year, month, day] = value.trim().split(/[T\s]/)[0].split("-").map(Number)
    if (!year || !month || !day) return null
    return startOfDay(new Date(year, month - 1, day))
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
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
