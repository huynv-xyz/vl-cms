import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listProducts, type ProductListParams } from "@/api/product"
import { Button } from "@/components/ui/button"
import type { Product } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<
        ProductListParams,
        | "status"
        | "nature"
        | "group_code"
        | "default_warehouse_id"
        | "inventory_account_code"
    >
}

type ExportColumn = {
    label: string
    value: (row: Product, index: number) => string | number | null | undefined
    width?: number
    type?: "number" | "text"
}

const EXPORT_PAGE_SIZE = 500

const COLUMNS: ExportColumn[] = [
    { label: "STT", value: (_row, index) => index + 1, width: 8, type: "number" },
    { label: "Mã hàng", value: (row) => row.code, width: 18 },
    { label: "Tên hàng", value: (row) => row.name, width: 38 },
    { label: "Tên báo giá XNK", value: (row) => row.quote_name, width: 34 },
    { label: "Mã báo giá XNK", value: (row) => row.quote_code, width: 20 },
    { label: "Mã vật tư MISA", value: (row) => row.misa_material_code, width: 20 },
    { label: "ĐVT", value: (row) => row.unit, width: 12 },
    { label: "Tính chất", value: (row) => row.nature, width: 20 },
    { label: "Mã nhóm", value: (row) => row.group?.code || row.group_code, width: 18 },
    { label: "Tên nhóm", value: (row) => row.group?.name || row.group_name, width: 26 },
    {
        label: "Nhóm giá",
        value: (row) =>
            [row.pricing_group?.code, row.pricing_group?.name]
                .filter(Boolean)
                .join(" - "),
        width: 28,
    },
    { label: "Đơn vị chính", value: (row) => row.base_unit_code, width: 15 },
    { label: "Đơn vị bán", value: (row) => row.sale_unit_code, width: 15 },
    { label: "Tên đơn vị bán", value: (row) => row.sale_unit_name, width: 20 },
    {
        label: "Hệ số ĐVB",
        value: (row) => row.sale_unit_factor,
        width: 14,
        type: "number",
    },
    { label: "Quy cách", value: (row) => row.size_value, width: 14, type: "number" },
    { label: "Đơn vị quy cách", value: (row) => row.size_unit_code, width: 18 },
    { label: "Kiểu làm tròn", value: (row) => row.rounding_mode, width: 16 },
    {
        label: "Đơn vị làm tròn",
        value: (row) => row.rounding_unit,
        width: 16,
        type: "number",
    },
    { label: "VAT (%)", value: (row) => row.vat_rate, width: 12, type: "number" },
    {
        label: "Kho mặc định",
        value: (row) => row.default_warehouse?.name || row.default_warehouse_id,
        width: 24,
    },
    { label: "TK kho", value: (row) => row.inventory_account_code, width: 14 },
    { label: "Cách tính giá", value: (row) => row.price_method_override, width: 18 },
    {
        label: "Giá thủ công",
        value: (row) => row.manual_price_vnd,
        width: 18,
        type: "number",
    },
    { label: "Trạng thái", value: (row) => statusLabel(row.status), width: 14 },
    { label: "Mô tả", value: (row) => row.description, width: 32 },
]

export function ExportProductsButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllProducts({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                status: filters.status || undefined,
                nature: filters.nature || undefined,
                group_code: filters.group_code || undefined,
                default_warehouse_id: filters.default_warehouse_id,
                inventory_account_code: filters.inventory_account_code || undefined,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportProductsXlsx(rows)
            toast.success(`Đã xuất ${rows.length} sản phẩm`)
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

async function fetchAllProducts(base: ProductListParams): Promise<Product[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: Product[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listProducts({ ...base, page, size })
        all.push(...res.items)

        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}

async function exportProductsXlsx(rows: Product[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Danh mục sản phẩm", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.mergeCells(1, 1, 1, COLUMNS.length)
    sheet.getCell(1, 1).value = "DANH MỤC SẢN PHẨM"
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
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `danh-muc-san-pham-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function normalizeCellValue(value: string | number | null | undefined, column: ExportColumn) {
    if (value == null || value === "") return ""
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function statusLabel(status?: number) {
    return Number(status) === 1 ? "Hoạt động" : "Ngừng dùng"
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
