import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listProductBoms, type ProductBomListParams } from "@/api/production/bom"
import { Button } from "@/components/ui/button"
import type { ProductBom, ProductBomItem } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<ProductBomListParams, "bom_id" | "product_id" | "active">
}

type ExcelColumn<T> = {
    label: string
    width: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity"
    value: (row: T, index: number) => string | number | Date | null | undefined
}

type BomItemRow = {
    bom: ProductBom
    item: ProductBomItem
}

const EXPORT_PAGE_SIZE = 200

const BOM_COLUMNS: ExcelColumn<ProductBom>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã BOM", width: 16, type: "number", numberFormat: "integer", value: (row) => row.id },
    { label: "Phiên bản", width: 24, value: (row) => row.version },
    { label: "Mã thành phẩm", width: 22, value: (row) => row.product?.code || row.product_id },
    { label: "Tên thành phẩm", width: 42, value: (row) => row.product?.name },
    { label: "Từ ngày", width: 14, type: "date", value: (row) => row.valid_from },
    { label: "Đến ngày", width: 14, type: "date", value: (row) => row.valid_to },
    { label: "Trạng thái", width: 16, value: (row) => activeOf(row) ? "Đang dùng" : "Ngưng dùng" },
    { label: "Số dòng vật tư", width: 14, type: "number", numberFormat: "integer", value: (row) => row.items?.length ?? 0 },
    { label: "Ghi chú", width: 36, value: (row) => row.note },
]

const ITEM_COLUMNS: ExcelColumn<BomItemRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã BOM", width: 16, type: "number", numberFormat: "integer", value: (row) => row.bom.id },
    { label: "Phiên bản", width: 24, value: (row) => row.bom.version },
    { label: "Mã thành phẩm", width: 22, value: (row) => row.bom.product?.code || row.bom.product_id },
    { label: "Tên thành phẩm", width: 42, value: (row) => row.bom.product?.name },
    { label: "Loại vật tư", width: 14, value: (row) => materialTypeLabel(row.item.material_type) },
    { label: "Mã vật tư", width: 22, value: (row) => row.item.material_product?.code || row.item.material_product_id },
    { label: "Tên vật tư", width: 42, value: (row) => row.item.material_product?.name },
    { label: "ĐVT", width: 12, value: (row) => row.item.unit || row.item.material_product?.unit },
    { label: "Định mức", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.item.quantity },
    { label: "Ghi chú dòng", width: 36, value: (row) => row.item.note },
]

export function ExportProductBomsButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllProductBoms({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                bom_id: filters.bom_id,
                product_id: filters.product_id,
                active: filters.active,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất Excel")
                return
            }

            await exportProductBomsXlsx(rows)
            toast.success(`Đã xuất ${rows.length} BOM`)
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

async function fetchAllProductBoms(base: ProductBomListParams): Promise<ProductBom[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: ProductBom[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listProductBoms({ ...base, page, size })
        all.push(...(res.items ?? []))

        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return all
}

async function exportProductBomsXlsx(rows: ProductBom[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    addSheet(workbook, "BOM", "DANH SÁCH ĐỊNH MỨC BOM", BOM_COLUMNS, rows)
    addSheet(workbook, "Dòng vật tư", "CHI TIẾT VẬT TƯ BOM", ITEM_COLUMNS, bomItemRows(rows))

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `dinh-muc-bom-${todayYmd()}.xlsx`)
}

function addSheet<T>(
    workbook: any,
    sheetName: string,
    title: string,
    columns: ExcelColumn<T>[],
    rows: T[],
) {
    const sheet = workbook.addWorksheet(sheetName, {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow([title])
    sheet.addRow([`Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`])
    sheet.addRow([])
    sheet.addRow(columns.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(columns.map((column) => normalizeCellValue(column.value(row, index), column)))
    })

    sheet.columns = columns.map((column) => ({ width: column.width }))
    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: columns.length },
    }

    styleSheet(sheet, columns)
}

function styleSheet<T>(sheet: any, columns: ExcelColumn<T>[]) {
    const border = excelBorder()

    const title = sheet.getRow(1)
    title.height = 24
    title.getCell(1).font = { bold: true, size: 16 }
    title.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const subtitle = sheet.getRow(2)
    subtitle.height = 22
    subtitle.getCell(1).font = { italic: true, color: { argb: "FF64748B" } }
    subtitle.getCell(1).alignment = { vertical: "middle", horizontal: "center" }

    const header = sheet.getRow(4)
    header.height = 28
    header.eachCell({ includeEmpty: true }, (cell: any) => {
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
        row.eachCell({ includeEmpty: true }, (cell: any, columnNumber: number) => {
            const column = columns[columnNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: false,
            }
            if (column.type === "date") cell.numFmt = "dd/mm/yyyy"
            if (column.type === "number") cell.numFmt = excelNumberFormat(cell.value, column)
        })
        row.height = 22
    }
}

function bomItemRows(rows: ProductBom[]): BomItemRow[] {
    return rows.flatMap((bom) => (bom.items ?? []).map((item) => ({ bom, item })))
}

function activeOf(bom: ProductBom) {
    return bom.active ?? bom.is_active ?? false
}

function materialTypeLabel(value?: string) {
    const type = String(value || "").toUpperCase()
    if (type === "NVL") return "Nguyên vật liệu"
    if (type === "BB") return "Bao bì"
    if (type === "TP") return "Thành phẩm"
    if (type === "HH") return "Hàng hóa"
    return value || ""
}

function normalizeCellValue<T>(
    value: string | number | Date | null | undefined,
    column: ExcelColumn<T>,
) {
    if (value == null || value === "") return ""
    if (column.type === "date") return excelDateSerial(String(value)) || ""
    if (column.type === "number") {
        const amount = Number(value)
        return Number.isFinite(amount) ? amount : ""
    }
    return value
}

function excelNumberFormat<T>(value: unknown, column: ExcelColumn<T>) {
    const amount = Number(value)
    if (column.numberFormat === "integer") return "#,##0"
    if (Number.isFinite(amount) && Number.isInteger(amount)) return "#,##0"
    return "#,##0.###"
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
    return new Date().toISOString().slice(0, 10)
}

function excelBorder() {
    return {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
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
