import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { listPayrollResults, type PayrollResultItem } from "@/api/salary/payroll-result"
import { Button } from "@/components/ui/button"

type Props = {
  period: string
  keyword?: string
}

type ExportColumn = {
  label: string
  value: (row: PayrollResultItem, index: number) => string | number
  width: number
  numeric?: boolean
}

const EXPORT_PAGE_SIZE = 500

const amount = (value?: number | null) => Number(value ?? 0)
const insurance = (row: PayrollResultItem) =>
  amount(row.bhxh_nv) + amount(row.bhyt_nv) + amount(row.bhtn_nv) + amount(row.kpcd_nv)

const COLUMNS: ExportColumn[] = [
  { label: "STT", value: (_row, index) => index + 1, width: 8, numeric: true },
  { label: "Mã nhân viên", value: row => row.emp_code ?? "", width: 16 },
  { label: "Tên nhân viên", value: row => row.emp_name ?? "", width: 28 },
  { label: "Khu vực", value: row => row.region_code ?? "", width: 13 },
  { label: "Công việc", value: row => row.role_code ?? "", width: 15 },
  { label: "Loại LĐ", value: row => row.labor_type ?? "", width: 11 },
  { label: "NPT", value: row => amount(row.dependent_count), width: 8, numeric: true },
  { label: "Lương cơ bản", value: row => amount(row.total_base_salary), width: 17, numeric: true },
  { label: "Phụ cấp", value: row => amount(row.total_allowance), width: 15, numeric: true },
  { label: "Lương B2B", value: row => amount(row.b2b_salary), width: 15, numeric: true },
  { label: "Thưởng", value: row => amount(row.total_bonus), width: 15, numeric: true },
  { label: "Hỗ trợ", value: row => amount(row.support_amount), width: 15, numeric: true },
  { label: "Thu nhập khác", value: row => amount(row.monthly_income_amount), width: 17, numeric: true },
  { label: "Tổng thu nhập", value: row => amount(row.gross_total), width: 18, numeric: true },
  { label: "Tạm ứng", value: row => amount(row.tam_ung), width: 15, numeric: true },
  { label: "BHNV", value: row => insurance(row), width: 15, numeric: true },
  { label: "Thu nhập tính thuế", value: row => amount(row.taxable_income), width: 20, numeric: true },
  { label: "Thuế TNCN", value: row => amount(row.personal_income_tax), width: 16, numeric: true },
  { label: "Khấu trừ khác", value: row => amount(row.khau_tru_khac), width: 17, numeric: true },
  { label: "Thu nhập thực lĩnh", value: row => amount(row.net_total), width: 21, numeric: true },
  { label: "Lương đóng BH", value: row => amount(row.luong_dong_bh), width: 17, numeric: true },
  { label: "BHXH NV", value: row => amount(row.bhxh_nv), width: 14, numeric: true },
  { label: "BHYT NV", value: row => amount(row.bhyt_nv), width: 14, numeric: true },
  { label: "BHTN NV", value: row => amount(row.bhtn_nv), width: 14, numeric: true },
  { label: "KPCĐ NV", value: row => amount(row.kpcd_nv), width: 14, numeric: true },
  { label: "BH tổng", value: row => amount(row.social_insurance), width: 15, numeric: true },
  { label: "Giảm trừ thuế", value: row => amount(row.tax_exempt_amount), width: 17, numeric: true },
]

export function ExportPayrollButton({ period, keyword }: Props) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const rows = await fetchAllPayrollRows(period, keyword)
      if (rows.length === 0) {
        toast.warning("Không có dữ liệu bảng lương để xuất")
        return
      }

      await exportPayrollXlsx(rows, period)
      toast.success(`Đã xuất bảng lương ${rows.length} nhân viên`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xuất Excel bảng lương thất bại")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleExport} disabled={isExporting}>
      {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {isExporting ? "Đang xuất..." : "Xuất Excel"}
    </Button>
  )
}

async function fetchAllPayrollRows(period: string, keyword?: string) {
  const rows: PayrollResultItem[] = []
  let page = 1

  for (let guard = 0; guard < 500; guard++) {
    const result = await listPayrollResults({ page, size: EXPORT_PAGE_SIZE, period, keyword: keyword || undefined })
    rows.push(...result.items)
    if (page >= (result.total_page || 1) || result.items.length === 0) break
    page += 1
  }

  return rows
}

async function exportPayrollXlsx(rows: PayrollResultItem[], period: string) {
  const { Workbook } = await import("exceljs")
  const workbook = new Workbook()
  workbook.creator = "VLIFE"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(`Bảng lương ${period}`, {
    views: [{ state: "frozen", xSplit: 3, ySplit: 4 }],
  })

  sheet.mergeCells(1, 1, 1, COLUMNS.length)
  const title = sheet.getCell(1, 1)
  title.value = `BẢNG LƯƠNG THÁNG ${period.slice(5, 7)}/${period.slice(0, 4)}`
  title.font = { bold: true, size: 16 }
  title.alignment = { horizontal: "center", vertical: "middle" }
  sheet.getRow(1).height = 26

  sheet.mergeCells(2, 1, 2, COLUMNS.length)
  const subtitle = sheet.getCell(2, 1)
  subtitle.value = `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")} · ${rows.length} nhân viên`
  subtitle.font = { italic: true, color: { argb: "FF64748B" } }
  subtitle.alignment = { horizontal: "right" }

  sheet.addRow([])
  sheet.addRow(COLUMNS.map(column => column.label))
  rows.forEach((row, index) => sheet.addRow(COLUMNS.map(column => column.value(row, index))))

  const totalRow = sheet.addRow(COLUMNS.map((column, index) => {
    if (index === 2) return "TỔNG CỘNG"
    if (!column.numeric || index === 0 || index === 6) return ""
    return rows.reduce((sum, row, rowIndex) => sum + Number(column.value(row, rowIndex) || 0), 0)
  }))

  sheet.columns = COLUMNS.map(column => ({ width: column.width }))
  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLUMNS.length } }

  const border = {
    top: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    left: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    bottom: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    right: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
  }

  sheet.getRow(4).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    cell.border = border
  })
  sheet.getRow(4).height = 32

  for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex)
    row.eachCell({ includeEmpty: true }, (cell, columnIndex) => {
      const column = COLUMNS[columnIndex - 1]
      cell.border = border
      cell.alignment = { horizontal: column.numeric ? "right" : "left", vertical: "middle" }
      if (column.numeric) cell.numFmt = "#,##0"
    })
  }

  totalRow.font = { bold: true }
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(buffer, `bang-luong-${period}.xlsx`)
}

function downloadBlob(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
