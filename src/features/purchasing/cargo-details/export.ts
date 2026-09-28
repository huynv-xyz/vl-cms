import { listCargoDetails, type CargoFilters, type CargoRow } from "@/api/purchasing/cargo-details"
import { CARGO_COLUMNS, CARGO_CENTERED_COLUMNS, CARGO_REPORT_TITLE, type CargoColumn } from "./columns"

export async function exportCargoDetails(filters: CargoFilters, columns: CargoColumn[] = CARGO_COLUMNS, pinnedColumnKey: CargoColumn["key"] | null = null) {
    const items: CargoRow[] = []
    let page = 1
    let pages = 1
    do {
        const result = await listCargoDetails({ ...filters, page, size: 200 })
        items.push(...result.items)
        pages = result.total_page
        page++
    } while (page <= pages)
    if (!items.length) return 0

    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    const exportedAt = new Date()
    workbook.creator = "VLIFE"
    workbook.created = exportedAt
    const sheet = workbook.addWorksheet(CARGO_REPORT_TITLE, { views: [{ state: "frozen", xSplit: pinnedColumnKey ? columns.findIndex(column => column.key === pinnedColumnKey) + 1 : 0, ySplit: 4 }] })
    sheet.columns = columns.map(column => ({ key: column.key, width: Math.round(column.width / 7) }))
    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.getCell(1, 1).value = CARGO_REPORT_TITLE.toLocaleUpperCase("vi-VN")
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.getRow(1).height = 24
    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.getCell(2, 1).value = `Ngày xuất: ${exportedAt.toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }
    sheet.getCell(2, 1).alignment = { horizontal: "center", vertical: "middle" }
    sheet.addRow([])
    sheet.addRow(columns.map(column => column.label))
    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }
    for (const [index, item] of items.entries()) {
        const row = sheet.addRow(columns.map(column => {
            if (column.key === "stt") return index + 1
            if (column.value) return column.value(item)
            const value = item[column.key]
            if (column.type === "number") {
                if (value == null || value === "") return ""
                const number = Number(value)
                return Number.isFinite(number) ? number : ""
            }
            if (column.type === "date" && value) {
                const [day, month, year] = String(value).split("/").map(Number)
                return (Date.UTC(year, month - 1, day) - Date.UTC(1899, 11, 30)) / 86400000
            }
            return value ?? ""
        }))
        row.eachCell({ includeEmpty: true }, (cell, index) => {
            const column = columns[index - 1]
            if (column.type === "date") cell.numFmt = "dd/mm/yyyy"
            if (column.type === "number") cell.numFmt = Number.isInteger(Number(cell.value)) ? "#,##0" : "#,##0.###"
            cell.alignment = { vertical: "middle", wrapText: true, horizontal: CARGO_CENTERED_COLUMNS.has(column.key) ? "center" : column.type === "number" ? "right" : "left" }
            cell.border = border
        })
    }
    sheet.getRow(4).height = 30
    sheet.getRow(4).eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        cell.border = border
    })
    sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: columns.length } }
    const buffer = await workbook.xlsx.writeBuffer()
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
    const link = document.createElement("a")
    link.href = url
    const dateSuffix = `${exportedAt.getFullYear()}-${String(exportedAt.getMonth() + 1).padStart(2, "0")}-${String(exportedAt.getDate()).padStart(2, "0")}`
    link.download = `thong-tin-hang-hoa-xnk-${dateSuffix}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    return items.length
}
