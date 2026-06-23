import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listInventoryLedgerReport, type InventoryLedgerReportParams } from "@/api/inventory/ledger"
import { Button } from "@/components/ui/button"
import type { InventoryLedgerReportRow } from "../data/schema"
import { getDocTypeMeta } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<
        InventoryLedgerReportParams,
        "product_id" | "warehouse_id" | "doc_type" | "from_date" | "to_date"
    >
}

type ExportColumn = {
    label: string
    value: (row: InventoryLedgerReportRow, index: number) => string | number | Date | null | undefined
    width?: number
    type?: "date" | "number" | "text"
}

const EXPORT_PAGE_SIZE = 500

const COLUMNS: ExportColumn[] = [
    { label: "STT", value: (_row, index) => index + 1, width: 8, type: "number" },
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
    { label: "Đơn giá", value: (row) => row.unit_price, width: 16, type: "number" },
    { label: "Nhập", value: (row) => row.quantity_in, width: 16, type: "number" },
    { label: "Xuất", value: (row) => row.quantity_out, width: 16, type: "number" },
    { label: "Tồn sau", value: (row) => row.balance_quantity, width: 16, type: "number" },
    { label: "Thành tiền", value: (row) => row.amount, width: 18, type: "number" },
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
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportInventoryLedgerXlsx(rows)
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

async function exportInventoryLedgerXlsx(rows: InventoryLedgerReportRow[]) {
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
                cell.numFmt = "#,##0.######"
            }
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `so-kho-${new Date().toISOString().slice(0, 10)}.xlsx`)
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
