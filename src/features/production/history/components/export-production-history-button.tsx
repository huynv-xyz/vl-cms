import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listProductionHistory, type ProductionHistoryListParams } from "@/api/production/history"
import { Button } from "@/components/ui/button"
import type { ProductionHistoryMaterial, ProductionHistoryOutput, ProductionHistoryRow, ProductionHistoryVoucher } from "../data/schema"
import { statusLabel } from "./production-history-columns"
import { materialTypeLabel, voucherTypeLabel } from "./production-history-labels"

type Props = {
    keyword?: string
    filters: Omit<ProductionHistoryListParams, "page" | "size" | "keyword" | "limit">
}

type ExcelColumn<T> = {
    label: string
    width: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity"
    value: (row: T, index: number) => string | number | null | undefined
}

type DetailRow = {
    history: ProductionHistoryRow
    detailType: "MATERIAL" | "OUTPUT" | "VOUCHER"
    material?: ProductionHistoryMaterial
    output?: ProductionHistoryOutput
    voucher?: ProductionHistoryVoucher
}

const EXPORT_PAGE_SIZE = 300

const PRODUCT_COLUMNS: ExcelColumn<ProductionHistoryRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Lệnh SX", width: 22, value: (row) => row.production_no || row.production_id },
    { label: "Ngày lệnh", width: 14, type: "date", value: (row) => row.production_date },
    { label: "Mã thành phẩm", width: 22, value: (row) => row.product_code || row.product_id },
    { label: "Tên thành phẩm", width: 42, value: (row) => row.product_name },
    { label: "ĐVT", width: 10, value: (row) => row.product_unit },
    { label: "Địa điểm kho", width: 28, value: (row) => row.physical_warehouse_name || row.physical_warehouse_code },
    { label: "Kho nhập", width: 26, value: (row) => row.warehouse_name || row.warehouse_code },
    { label: "Mã BOM", width: 14, type: "number", numberFormat: "integer", value: (row) => row.bom_id },
    { label: "SL kế hoạch", width: 16, type: "number", numberFormat: "quantity", value: (row) => row.quantity_plan },
    { label: "SL nhập TP", width: 16, type: "number", numberFormat: "quantity", value: (row) => row.quantity_done },
    { label: "Lô TP", width: 22, value: (row) => row.output_lot_no },
    { label: "HSD TP", width: 14, type: "date", value: (row) => row.output_expiry_date },
    { label: "Số dòng vật tư", width: 14, type: "number", numberFormat: "integer", value: (row) => row.material_count },
    { label: "Số chứng từ", width: 14, type: "number", numberFormat: "integer", value: (row) => row.voucher_count },
    { label: "Trạng thái", width: 20, value: (row) => statusLabel(row.status) },
]

const DETAIL_COLUMNS: ExcelColumn<DetailRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Lệnh SX", width: 22, value: (row) => row.history.production_no || row.history.production_id },
    { label: "Mã thành phẩm", width: 22, value: (row) => row.history.product_code || row.history.product_id },
    { label: "Tên thành phẩm", width: 42, value: (row) => row.history.product_name },
    { label: "Loại chi tiết", width: 18, value: (row) => detailTypeLabel(row.detailType) },
    { label: "Mã vật tư/TP", width: 22, value: (row) => row.material?.product_code || row.output?.product_id || "" },
    { label: "Tên vật tư/TP", width: 42, value: (row) => row.material?.product_name || row.history.product_name },
    { label: "Loại vật tư", width: 18, value: (row) => row.material ? materialTypeLabel(row.material.material_type) : "" },
    { label: "Kho", width: 28, value: (row) => row.material?.warehouse_name || row.output?.warehouse_name || "" },
    { label: "Định mức", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material?.quantity_per_unit },
    { label: "SL cần", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material?.quantity_required },
    { label: "SL FIFO", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material?.allocated_quantity },
    { label: "SL thiếu", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material?.shortage_quantity },
    { label: "SL nhập TP", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.output?.quantity },
    { label: "Lô", width: 24, value: (row) => row.output?.lot_no || materialLots(row.material) },
    { label: "HSD", width: 14, type: "date", value: (row) => row.output?.expiry_date },
    { label: "Số phiếu", width: 24, value: (row) => row.voucher?.voucher_no },
    { label: "Loại chứng từ", width: 32, value: (row) => row.voucher ? voucherTypeLabel(row.voucher.operation_code, row.voucher.voucher_type_code) : "" },
    { label: "Ngày chứng từ", width: 14, type: "date", value: (row) => row.voucher?.posting_date || row.voucher?.document_date },
    { label: "Trạng thái/Ghi chú", width: 36, value: (row) => row.material?.validation_message || row.material?.fifo_status || row.output?.status || row.voucher?.status || "" },
]

export function ExportProductionHistoryButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllProductionHistory({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                ...filters,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất Excel")
                return
            }

            await exportProductionHistoryXlsx(rows)
            toast.success(`Đã xuất ${rows.length} dòng lịch sử sản xuất`)
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

async function fetchAllProductionHistory(base: ProductionHistoryListParams): Promise<ProductionHistoryRow[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: ProductionHistoryRow[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listProductionHistory({ ...base, page, size })
        all.push(...(res.items ?? []))

        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return all
}

async function exportProductionHistoryXlsx(rows: ProductionHistoryRow[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    addSheet(workbook, "Thành phẩm", "LỊCH SỬ SẢN XUẤT - THÀNH PHẨM", PRODUCT_COLUMNS, rows)
    addSheet(workbook, "Chi tiết", "LỊCH SỬ SẢN XUẤT - CHI TIẾT", DETAIL_COLUMNS, detailRows(rows))

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `lich-su-san-xuat-${todayYmd()}.xlsx`)
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
                wrapText: true,
            }
            if (column.type === "date") cell.numFmt = "dd/mm/yyyy"
            if (column.type === "number") cell.numFmt = excelNumberFormat(cell.value, column)
        })
        row.height = 22
    }
}

function detailRows(rows: ProductionHistoryRow[]): DetailRow[] {
    return rows.flatMap((history) => [
        ...(history.materials ?? []).map((material) => ({ history, detailType: "MATERIAL" as const, material })),
        ...(history.outputs ?? []).map((output) => ({ history, detailType: "OUTPUT" as const, output })),
        ...(history.vouchers ?? []).map((voucher) => ({ history, detailType: "VOUCHER" as const, voucher })),
    ])
}

function detailTypeLabel(value: DetailRow["detailType"]) {
    if (value === "MATERIAL") return "Vật tư sử dụng"
    if (value === "OUTPUT") return "Nhập thành phẩm"
    return "Chứng từ"
}

function materialLots(material?: ProductionHistoryMaterial) {
    return (material?.allocations ?? [])
        .map((allocation) => allocation.lot_no)
        .filter(Boolean)
        .join(", ")
}

function normalizeCellValue<T>(
    value: string | number | null | undefined,
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
