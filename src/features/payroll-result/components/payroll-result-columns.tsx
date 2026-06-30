import { type ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import type { PayrollResultItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { formatNumber } from "@/lib/utils"

const text = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-"
  return String(value)
}

const amount = (value?: number | null) => {
  if (value === null || value === undefined) return "-"
  return formatNumber(value)
}

const amountCell = (value?: number | null, className = "") => (
  <div className={`text-right tabular-nums ${className}`}>{amount(value)}</div>
)

const textCell = (value?: string | number | null) => (
  <div className="whitespace-nowrap">{text(value)}</div>
)

function sumInsurance(item: PayrollResultItem) {
  return (item.bhxh_nv ?? 0) + (item.bhyt_nv ?? 0) + (item.bhtn_nv ?? 0) + (item.kpcd_nv ?? 0)
}

export function buildPayrollResultColumns(period: string): ColumnDef<PayrollResultItem>[] {
  return [
    {
      ...buildIndexColumn<PayrollResultItem>(),
      header: "STT",
      size: 60,
    },
    {
      id: "emp_code",
      header: "Mã nhân viên",
      accessorFn: (row) => row.emp_code,
      cell: ({ row: { original } }) => (
        <Link
          to="/salary/payroll-result/$employeeId"
          params={{ employeeId: String(original.employee_id) }}
          search={{ period }}
          className="whitespace-nowrap font-semibold text-primary underline-offset-4 hover:underline"
        >
          {text(original.emp_code)}
        </Link>
      ),
      size: 130,
    },
    {
      id: "emp_name",
      header: "Tên nhân viên",
      accessorFn: (row) => row.emp_name,
      cell: ({ row: { original } }) => (
        <Link
          to="/salary/payroll-result/$employeeId"
          params={{ employeeId: String(original.employee_id) }}
          search={{ period }}
          className="block min-w-[180px] font-medium text-foreground underline-offset-4 hover:underline"
        >
          {text(original.emp_name)}
        </Link>
      ),
      size: 220,
    },
    {
      id: "region_code",
      header: "Khu vực",
      accessorFn: (row) => row.region_code,
      cell: ({ row }) => textCell(row.original.region_code),
      size: 110,
    },
    {
      id: "work",
      header: "Công việc",
      accessorFn: (row) => row.role_code,
      cell: ({ row }) => textCell(row.original.role_code),
      size: 130,
    },
    {
      id: "position",
      header: "Chức vụ",
      accessorFn: () => "",
      cell: () => textCell(null),
      size: 120,
    },
    {
      id: "total_base_salary",
      header: "Lương cơ bản",
      accessorFn: (row) => row.total_base_salary,
      cell: ({ row }) => amountCell(row.original.total_base_salary),
      size: 140,
    },
    {
      id: "total_allowance",
      header: "Phụ cấp",
      accessorFn: (row) => row.total_allowance,
      cell: ({ row }) => amountCell(row.original.total_allowance),
      size: 120,
    },
    {
      id: "sales_salary_amount",
      header: "Lương B2B",
      accessorFn: (row) => row.sales_salary_amount,
      cell: ({ row }) => amountCell(row.original.sales_salary_amount),
      size: 130,
    },
    {
      id: "support_amount",
      header: "Hỗ trợ",
      accessorFn: (row) => row.support_amount,
      cell: ({ row }) => amountCell(row.original.support_amount),
      size: 120,
    },
    {
      id: "total_bonus",
      header: "Thu nhập khác",
      accessorFn: (row) => row.total_bonus,
      cell: ({ row }) => amountCell(row.original.total_bonus),
      size: 140,
    },
    {
      id: "gross_total",
      header: "Tổng thu nhập",
      accessorFn: (row) => row.gross_total,
      cell: ({ row }) => amountCell(row.original.gross_total, "font-semibold"),
      size: 150,
    },
    {
      id: "tam_ung",
      header: "Tạm ứng",
      accessorFn: (row) => row.tam_ung,
      cell: ({ row }) => amountCell(row.original.tam_ung),
      size: 120,
    },
    {
      id: "bh_nhan_vien",
      header: "BHNV",
      accessorFn: (row) => sumInsurance(row),
      cell: ({ row }) => amountCell(sumInsurance(row.original)),
      size: 120,
    },
    {
      id: "taxable_income",
      header: "Thu nhập tính thuế",
      accessorFn: (row) => row.taxable_income,
      cell: ({ row }) => amountCell(row.original.taxable_income),
      size: 160,
    },
    {
      id: "personal_income_tax",
      header: "Thuế TNCN",
      accessorFn: (row) => row.personal_income_tax,
      cell: ({ row }) => amountCell(row.original.personal_income_tax),
      size: 130,
    },
    {
      id: "net_total",
      header: "Thu nhập thực lĩnh",
      accessorFn: (row) => row.net_total,
      cell: ({ row }) => amountCell(row.original.net_total, "font-bold text-emerald-700"),
      size: 170,
    },
    {
      id: "luong_dong_bh",
      header: "Lương đóng BH",
      accessorFn: (row) => row.luong_dong_bh,
      cell: ({ row }) => amountCell(row.original.luong_dong_bh),
      size: 140,
    },
    {
      id: "bhxh_nv",
      header: "BHXH NV",
      accessorFn: (row) => row.bhxh_nv,
      cell: ({ row }) => amountCell(row.original.bhxh_nv),
      size: 120,
    },
    {
      id: "bhyt_nv",
      header: "BHYT NV",
      accessorFn: (row) => row.bhyt_nv,
      cell: ({ row }) => amountCell(row.original.bhyt_nv),
      size: 120,
    },
    {
      id: "bhtn_nv",
      header: "BHTN NV",
      accessorFn: (row) => row.bhtn_nv,
      cell: ({ row }) => amountCell(row.original.bhtn_nv),
      size: 120,
    },
    {
      id: "kpcd_nv",
      header: "KPCĐ NV",
      accessorFn: (row) => row.kpcd_nv,
      cell: ({ row }) => amountCell(row.original.kpcd_nv),
      size: 120,
    },
    {
      id: "social_insurance",
      header: "BH tổng",
      accessorFn: (row) => row.social_insurance,
      cell: ({ row }) => amountCell(row.original.social_insurance),
      size: 120,
    },
    {
      id: "tax_exempt_amount",
      header: "Giảm trừ thuế",
      accessorFn: (row) => row.tax_exempt_amount,
      cell: ({ row }) => amountCell(row.original.tax_exempt_amount),
      size: 140,
    },
    {
      id: "khau_tru_khac",
      header: "Khấu trừ khác",
      accessorFn: (row) => row.khau_tru_khac,
      cell: ({ row }) => amountCell(row.original.khau_tru_khac),
      size: 140,
    },
    {
      id: "labor_type",
      header: "Loại LĐ",
      accessorFn: (row) => row.labor_type,
      cell: ({ row }) => textCell(row.original.labor_type),
      size: 100,
    },
    {
      id: "dependent_count",
      header: "NPT",
      accessorFn: (row) => row.dependent_count,
      cell: ({ row }) => amountCell(row.original.dependent_count),
      size: 80,
    },
  ]
}
