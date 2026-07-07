import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listCustomers, type CustomerListParams } from "@/api/customer"
import { Button } from "@/components/ui/button"
import type { Customer } from "../data/schema"

type Props = {
    keyword?: string
    filters: Pick<CustomerListParams, "type" | "region" | "status">
}

type ExportColumn = {
    label: string
    value: (row: Customer, index: number) => string | number | null | undefined
    width?: number
    type?: "number" | "text"
}

const EXPORT_PAGE_SIZE = 500

const COLUMNS: ExportColumn[] = [
    { label: "STT", value: (_row, index) => index + 1, width: 8, type: "number" },
    { label: "Mã khách hàng", value: (row) => row.code, width: 18 },
    { label: "Tên khách hàng", value: (row) => row.name, width: 36 },
    { label: "Mã số thuế", value: (row) => row.tax_code, width: 18 },
    { label: "Địa chỉ", value: (row) => row.address, width: 42 },
    { label: "Loại khách hàng", value: (row) => row.type, width: 16 },
    { label: "Khu vực", value: (row) => row.region, width: 14 },
    {
        label: "Mã NV phụ trách",
        value: (row) => row.employee?.code || row.employee_id,
        width: 18,
    },
    {
        label: "NV phụ trách",
        value: (row) => row.employee?.name,
        width: 26,
    },
    { label: "Trạng thái", value: (row) => statusLabel(row.status), width: 16 },
    { label: "Ghi chú", value: (row) => row.note, width: 30 },
]

export function ExportCustomersButton({ keyword, filters }: Props) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        try {
            setLoading(true)
            const rows = await fetchAllCustomers({
                page: 1,
                size: EXPORT_PAGE_SIZE,
                keyword: keyword || undefined,
                type: filters.type || undefined,
                region: filters.region || undefined,
                status: filters.status || undefined,
            })

            if (!rows.length) {
                toast.warning("Không có dữ liệu để xuất")
                return
            }

            await exportCustomersXlsx(rows)
            toast.success(`Đã xuất ${rows.length} khách hàng`)
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

async function fetchAllCustomers(base: CustomerListParams): Promise<Customer[]> {
    const size = base.size ?? EXPORT_PAGE_SIZE
    const all: Customer[] = []
    let page = 1

    for (let guard = 0; guard < 500; guard++) {
        const res = await listCustomers({ ...base, page, size })
        all.push(...res.items)

        if (page >= (res.total_page || 1) || res.items.length === 0) break
        page += 1
    }

    return all
}

async function exportCustomersXlsx(rows: Customer[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Danh sách khách hàng", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.mergeCells(1, 1, 1, COLUMNS.length)
    sheet.getCell(1, 1).value = "DANH SÁCH KHÁCH HÀNG"
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
        })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlob(buffer, `danh-sach-khach-hang-${new Date().toISOString().slice(0, 10)}.xlsx`)
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
    return Number(status) === 1 ? "Hoạt động" : "Ngưng dùng"
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
