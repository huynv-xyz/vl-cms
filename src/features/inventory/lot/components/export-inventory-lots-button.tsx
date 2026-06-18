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
        | "warehouse_id"
        | "source_type"
        | "expiry_status"
        | "from_date"
        | "to_date"
        | "only_remaining"
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
    { label: "Mã sản phẩm", value: (row) => row.product?.code, width: 20 },
    { label: "Tên sản phẩm", value: (row) => row.product?.name, width: 38 },
    { label: "Mã kho", value: (row) => row.warehouse?.code, width: 14 },
    { label: "Kho", value: (row) => row.warehouse?.name, width: 24 },
    { label: "Số lô", value: (row) => row.lot_no, width: 22 },
    { label: "Ngày nhập", value: (row) => parseDate(row.inbound_date), width: 14, type: "date" },
    { label: "HSD", value: (row) => parseDate(row.expiry_date), width: 14, type: "date" },
    { label: "Cảnh báo HSD", value: (row) => expiryStatusLabel(row), width: 20 },
    { label: "Nguồn", value: (row) => sourceTypeLabel(row.source_type), width: 16 },
    { label: "Số chứng từ nguồn", value: (row) => row.source_no, width: 24 },
    { label: "ID nguồn", value: (row) => row.source_id, width: 12, type: "number" },
    { label: "SL nhập", value: (row) => row.quantity_in, width: 14, type: "number" },
    { label: "SL còn", value: (row) => row.quantity_remaining, width: 14, type: "number" },
    { label: "Giá vốn", value: (row) => row.unit_cost, width: 16, type: "number" },
    {
        label: "Giá trị tồn",
        value: (row) => Number(row.quantity_remaining || 0) * Number(row.unit_cost || 0),
        width: 18,
        type: "number",
    },
    { label: "Ghi chú HSD", value: (row) => row.expiry_message, width: 28 },
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
                warehouse_id: filters.warehouse_id,
                source_type: filters.source_type || undefined,
                expiry_status: filters.expiry_status || undefined,
                from_date: filters.from_date || undefined,
                to_date: filters.to_date || undefined,
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
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
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

    sheet.columns = COLUMNS.map((column) => ({
        width: column.width ?? 18,
    }))
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
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `ton-kho-theo-lo-${new Date().toISOString().slice(0, 10)}.xlsx`)
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

function sourceTypeLabel(value?: string) {
    switch (value) {
        case "OPENING":
            return "Tồn đầu kỳ"
        case "PURCHASE":
            return "Mua hàng"
        case "PRODUCTION":
            return "Sản xuất"
        case "ADJUSTMENT":
            return "Điều chỉnh"
        default:
            return value
    }
}

function expiryStatusLabel(row: InventoryLot) {
    switch (row.expiry_status) {
        case "EXPIRED":
            return "Hết hạn"
        case "NEAR_EXPIRY":
            return typeof row.days_to_expiry === "number"
                ? `Cận date ${row.days_to_expiry} ngày`
                : "Cận date"
        case "VALID":
            return "Còn hạn"
        case "NO_EXPIRY":
            return "Chưa có HSD"
        default:
            return ""
    }
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
