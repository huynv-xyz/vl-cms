import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listProductions, type ProductionListParams } from "@/api/production/order"
import { Button } from "@/components/ui/button"
import type {
    Production,
    ProductionFifoAllocation,
    ProductionItem,
    ProductionMaterial,
    ProductionOutput,
} from "../data/schema"
import {
    getProductionStatusLabel,
    getProductionSubStatusLabel,
} from "./production-status"

type Props = {
    keyword?: string
    filters: Pick<
        ProductionListParams,
        "product_id" | "physical_warehouse_id" | "status" | "from_date" | "to_date"
    >
}

type ExcelColumn<T> = {
    label: string
    width: number
    type?: "date" | "number" | "text"
    numberFormat?: "integer" | "quantity" | "money"
    value: (row: T, index: number) => string | number | Date | null | undefined
}

type ProductionItemRow = {
    order: Production
    item: ProductionItem
}

type ProductionMaterialRow = {
    order: Production
    item: ProductionItem
    material: ProductionMaterial
}

type ProductionFifoRow = ProductionMaterialRow & {
    allocation: ProductionFifoAllocation
}

type ProductionOutputRow = {
    order: Production
    item: ProductionItem
    output: ProductionOutput
}

const EXPORT_PAGE_SIZE = 200

const ORDER_COLUMNS: ExcelColumn<Production>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã lệnh", width: 22, value: (row) => row.production_no },
    { label: "Ngày lệnh", width: 14, type: "date", value: (row) => row.production_date },
    { label: "Giờ lệnh", width: 12, value: (row) => formatTime(row.production_time) },
    { label: "Địa điểm kho", width: 30, value: (row) => row.physical_warehouse?.name || row.physical_warehouse_id },
    { label: "Trạng thái", width: 18, value: (row) => getProductionStatusLabel(row.status) },
    { label: "Số dòng TP", width: 12, type: "number", numberFormat: "integer", value: (row) => row.items?.length ?? 0 },
    { label: "Số dòng vật tư", width: 14, type: "number", numberFormat: "integer", value: (row) => countMaterials(row) },
    { label: "Ghi chú", width: 36, value: (row) => row.note },
]

const ITEM_COLUMNS: ExcelColumn<ProductionItemRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã lệnh", width: 22, value: (row) => row.order.production_no },
    { label: "Ngày lệnh", width: 14, type: "date", value: (row) => row.order.production_date },
    { label: "Mã TP", width: 22, value: (row) => row.item.product?.code || row.item.product_id },
    { label: "Tên TP", width: 42, value: (row) => row.item.product?.name },
    { label: "Kho nhập", width: 28, value: (row) => row.item.warehouse?.name || row.item.warehouse_id },
    { label: "BOM", width: 18, value: (row) => bomLabel(row.item) },
    { label: "SL nhập TP", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.item.quantity_done },
    { label: "Lô TP", width: 18, value: (row) => row.item.output_lot_no },
    { label: "HSD TP", width: 14, type: "date", value: (row) => row.item.output_expiry_date },
    { label: "Ghi chú dòng", width: 32, value: (row) => row.item.note },
]

const MATERIAL_COLUMNS: ExcelColumn<ProductionMaterialRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã lệnh", width: 22, value: (row) => row.order.production_no },
    { label: "Mã TP", width: 22, value: (row) => row.item.product?.code || row.item.product_id },
    { label: "Tên TP", width: 36, value: (row) => row.item.product?.name },
    { label: "Loại vật tư", width: 14, value: (row) => row.material.material_type },
    { label: "Mã vật tư", width: 22, value: (row) => row.material.product?.code || row.material.product_id },
    { label: "Tên vật tư", width: 42, value: (row) => row.material.product?.name },
    { label: "Kho vật tư", width: 28, value: (row) => row.material.warehouse?.name || row.material.warehouse_id },
    { label: "Định mức", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material.quantity_per_unit },
    { label: "SL yêu cầu", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material.quantity_required },
    { label: "SL đã FIFO", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material.allocated_quantity },
    { label: "SL thiếu", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.material.shortage_quantity },
    { label: "Lô ưu tiên", width: 18, value: (row) => row.material.preferred_lot_no },
    { label: "Trạng thái kiểm tra", width: 20, value: (row) => getProductionSubStatusLabel(row.material.check_status) },
    { label: "Trạng thái FIFO", width: 18, value: (row) => getProductionSubStatusLabel(row.material.fifo_status) },
    { label: "Thông tin lỗi", width: 44, value: (row) => row.material.validation_message },
    { label: "Ghi chú", width: 32, value: (row) => row.material.note },
]

const FIFO_COLUMNS: ExcelColumn<ProductionFifoRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã lệnh", width: 22, value: (row) => row.order.production_no },
    { label: "Mã TP", width: 22, value: (row) => row.item.product?.code || row.item.product_id },
    { label: "Mã vật tư", width: 22, value: (row) => row.material.product?.code || row.material.product_id },
    { label: "Tên vật tư", width: 42, value: (row) => row.material.product?.name },
    { label: "Lô FIFO", width: 20, value: (row) => row.allocation.lot_no },
    { label: "Ngày nhập", width: 14, type: "date", value: (row) => row.allocation.inbound_date },
    { label: "HSD", width: 14, type: "date", value: (row) => row.allocation.expiry_date },
    { label: "SL phân bổ", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.allocation.quantity },
    { label: "SL còn lại", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.allocation.quantity_remaining },
    { label: "Lô ưu tiên", width: 12, value: (row) => row.allocation.is_preferred_lot ? "Có" : "" },
]

const OUTPUT_COLUMNS: ExcelColumn<ProductionOutputRow>[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "integer", value: (_row, index) => index + 1 },
    { label: "Mã lệnh", width: 22, value: (row) => row.order.production_no },
    { label: "Mã TP", width: 22, value: (row) => row.output.product?.code || row.item.product?.code || row.output.product_id },
    { label: "Tên TP", width: 42, value: (row) => row.output.product?.name || row.item.product?.name },
    { label: "Kho nhập", width: 28, value: (row) => row.output.warehouse?.name || row.output.warehouse_id },
    { label: "Ngày nhập", width: 14, type: "date", value: (row) => row.output.output_date },
    { label: "Số lượng", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.output.quantity },
    { label: "Lô TP", width: 18, value: (row) => row.output.lot_no },
    { label: "HSD", width: 14, type: "date", value: (row) => row.output.expiry_date },
    { label: "Trạng thái", width: 18, value: (row) => getProductionSubStatusLabel(row.output.status) },
    { label: "Ghi chú", width: 32, value: (row) => row.output.note },
]

export function ExportProductionOrdersButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllProductions({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                product_id: filters.product_id,
                physical_warehouse_id: filters.physical_warehouse_id,
                status: filters.status || undefined,
                from_date: filters.from_date,
                to_date: filters.to_date,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất Excel")
                return
            }

            await exportProductionOrdersXlsx(rows, filters)
            toast.success(`Đã xuất ${rows.length} lệnh sản xuất`)
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

async function fetchAllProductions(base: ProductionListParams): Promise<Production[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: Production[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listProductions({ ...base, page, size })
        all.push(...(res.items ?? []))

        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }

    return all
}

async function exportProductionOrdersXlsx(rows: Production[], filters: Props["filters"]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    addSheet(workbook, "Lệnh sản xuất", "DANH SÁCH LỆNH SẢN XUẤT", ORDER_COLUMNS, rows, filterSummary(filters))
    addSheet(workbook, "Thành phẩm", "CHI TIẾT THÀNH PHẨM", ITEM_COLUMNS, productionItemRows(rows), filterSummary(filters))
    addSheet(workbook, "Vật tư", "CHI TIẾT VẬT TƯ", MATERIAL_COLUMNS, productionMaterialRows(rows), filterSummary(filters))
    addSheet(workbook, "FIFO", "CHI TIẾT FIFO", FIFO_COLUMNS, productionFifoRows(rows), filterSummary(filters))
    addSheet(workbook, "Nhập TP", "CHI TIẾT NHẬP THÀNH PHẨM", OUTPUT_COLUMNS, productionOutputRows(rows), filterSummary(filters))

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `lenh-san-xuat-${todayYmd()}.xlsx`)
}

function addSheet<T>(
    workbook: any,
    sheetName: string,
    title: string,
    columns: ExcelColumn<T>[],
    rows: T[],
    subtitle: string,
) {
    const sheet = workbook.addWorksheet(sheetName, {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.addRow([title])
    sheet.addRow([`${subtitle} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`])
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

function productionItemRows(rows: Production[]): ProductionItemRow[] {
    return rows.flatMap((order) => (order.items ?? []).map((item) => ({ order, item })))
}

function productionMaterialRows(rows: Production[]): ProductionMaterialRow[] {
    return productionItemRows(rows).flatMap(({ order, item }) =>
        (item.materials ?? []).map((material) => ({ order, item, material })),
    )
}

function productionFifoRows(rows: Production[]): ProductionFifoRow[] {
    return productionMaterialRows(rows).flatMap(({ order, item, material }) =>
        (material.fifo_allocations ?? []).map((allocation) => ({ order, item, material, allocation })),
    )
}

function productionOutputRows(rows: Production[]): ProductionOutputRow[] {
    return productionItemRows(rows).flatMap(({ order, item }) =>
        (item.outputs ?? []).map((output) => ({ order, item, output })),
    )
}

function countMaterials(row: Production) {
    return (row.items ?? []).reduce((sum, item) => sum + (item.materials?.length ?? 0), 0)
}

function bomLabel(item: ProductionItem) {
    if (!item.bom_id) return ""
    return `BOM #${item.bom_id}${item.bom_version ? ` (${item.bom_version})` : ""}`
}

function filterSummary(filters: Props["filters"]) {
    return `Thời gian lọc: ${formatDisplayDate(filters.from_date) || "Đầu kỳ"} - ${formatDisplayDate(filters.to_date) || "Hôm nay"}`
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
    if (column.numberFormat === "integer" || column.numberFormat === "money") return "#,##0"
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

function formatDisplayDate(value?: string) {
    if (!value) return ""
    const dateOnly = value.trim().split(/[T\s]/)[0]
    const ymd = dateOnly.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (ymd) return `${ymd[3].padStart(2, "0")}/${ymd[2].padStart(2, "0")}/${ymd[1]}`
    return value
}

function formatTime(value?: string) {
    if (!value) return ""
    return value.split(".")[0]?.slice(0, 5) || value
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
