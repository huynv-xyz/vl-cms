import { type ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import type { PayrollResultItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"

const money = (value?: number | null) =>
  value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })

const smallMoney = (value?: number | null) =>
  value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: 0 })

function AmountStack({
  title,
  primary,
  lines,
  tone,
}: {
  title: string
  primary: number
  lines: Array<[string, number | undefined | null]>
  tone?: string
}) {
  return (
    <div className="min-w-[230px] rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold uppercase text-slate-500">{title}</span>
        <span className={`text-base font-bold tabular-nums ${tone ?? ""}`}>{money(primary)}</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
        {lines.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span>{label}</span>
            <span className="font-medium tabular-nums text-slate-900">{smallMoney(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoCard({
  title,
  lines,
}: {
  title: string
  lines: Array<[string, string | number | undefined | null]>
}) {
  return (
    <div className="min-w-[230px] rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold uppercase text-slate-500">{title}</div>
      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
        {lines.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span>{label}</span>
            <span className="font-medium tabular-nums text-slate-900">{value ?? "-"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ item }: { item: PayrollResultItem }) {
  const deduction = (item.social_insurance ?? 0) + (item.personal_income_tax ?? 0) + (item.tam_ung ?? 0) + (item.khau_tru_khac ?? 0)
  if ((item.gross_total ?? 0) <= 0) {
    return <Badge variant="outline" className="border-slate-300 text-slate-600">Chưa có lương</Badge>
  }
  if (deduction > item.gross_total) {
    return <Badge className="bg-rose-600">Khấu trừ cao</Badge>
  }
  if ((item.net_total ?? 0) > 0) {
    return <Badge className="bg-emerald-600">Đã tính</Badge>
  }
  return <Badge className="bg-amber-600">Cần kiểm tra</Badge>
}

export function buildPayrollResultColumns(period: string): ColumnDef<PayrollResultItem>[] {
  return [
    buildIndexColumn<PayrollResultItem>(),
    {
      id: "employee",
      header: "Nhân viên",
      accessorFn: (row) => `${row.emp_code ?? ""} ${row.emp_name ?? ""}`,
      cell: ({ row: { original } }) => (
        <div className="min-w-[290px] rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link
            to="/salary/payroll-result/$employeeId"
            params={{ employeeId: String(original.employee_id) }}
            search={{ period }}
            className="text-base font-bold text-primary underline-offset-4 hover:underline"
          >
            {original.emp_name || original.emp_code || original.employee_id}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{original.emp_code}</span>
            <span>·</span>
            <span>{original.role_code || "Chưa có vai trò"}</span>
            <span>·</span>
            <span>{original.region_code || "Chưa có vùng"}</span>
          </div>
        </div>
      ),
      size: 260,
    },
    {
      id: "gross",
      header: "",
      accessorFn: (row) => row.gross_total,
      cell: ({ row: { original } }) => (
        <AmountStack
          title="Thu nhập"
          primary={original.gross_total}
          tone="text-blue-700"
          lines={[
            ["Lương", original.total_base_salary],
            ["Phụ cấp", original.total_allowance],
            ["Thưởng", original.total_bonus],
            ["Hỗ trợ", original.support_amount],
          ]}
        />
      ),
      size: 180,
    },
    {
      id: "deductions",
      header: "",
      accessorFn: (row) => (row.social_insurance ?? 0) + (row.personal_income_tax ?? 0) + (row.tam_ung ?? 0) + (row.khau_tru_khac ?? 0),
      cell: ({ row: { original } }) => {
        const total = (original.social_insurance ?? 0) + (original.personal_income_tax ?? 0) + (original.tam_ung ?? 0) + (original.khau_tru_khac ?? 0)
        return (
          <AmountStack
            title="Khấu trừ"
            primary={total}
            tone="text-orange-700"
            lines={[
              ["Bảo hiểm", original.social_insurance],
              ["Thuế", original.personal_income_tax],
              ["Tạm ứng", original.tam_ung],
              ["Khác", original.khau_tru_khac],
            ]}
          />
        )
      },
      size: 180,
    },
    {
      id: "insurance_tax",
      header: "",
      accessorFn: (row) => row.luong_dong_bh,
      cell: ({ row: { original } }) => (
        <InfoCard
          title="Căn cứ tính"
          lines={[
            ["Lương đóng BH", money(original.luong_dong_bh)],
            ["Loại LĐ", original.labor_type || "CT"],
            ["NPT", original.dependent_count ?? 0],
            ["TN chịu thuế", money(original.taxable_income)],
          ]}
        />
      ),
      size: 170,
    },
    {
      id: "net",
      header: () => <div className="text-right">Thực nhận</div>,
      accessorFn: (row) => row.net_total,
      cell: ({ row: { original } }) => (
        <div className="min-w-[210px] rounded-md border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-sm font-semibold uppercase text-emerald-700">Thực nhận</div>
          <div className="mt-2 text-lg font-bold text-emerald-700 tabular-nums">{money(original.net_total)}</div>
          <div className="mt-3 flex justify-between gap-4 text-sm text-emerald-800/80">
            <span>Gross</span>
            <span className="font-medium tabular-nums">{smallMoney(original.gross_total)}</span>
          </div>
        </div>
      ),
      size: 170,
    },
    {
      id: "status",
      header: "Trạng thái",
      accessorFn: (row) => row.net_total,
      cell: ({ row: { original } }) => (
        <div className="min-w-[110px]">
          <StatusBadge item={original} />
        </div>
      ),
      size: 130,
    },
  ]
}
