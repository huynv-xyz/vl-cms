import { type ColumnDef } from "@tanstack/react-table"
import type { PayrollResultItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"

const fmt = (v?: number) =>
  v == null ? "-" : v.toLocaleString("vi-VN")

const cell = (v?: number) => (
  <div className="text-right tabular-nums whitespace-nowrap text-sm">{fmt(v)}</div>
)

const headerRight = (t: string) => (
  <div className="text-right font-semibold whitespace-nowrap">{t}</div>
)

const GROUP_BORDER = "border-l border-border"

export const payrollResultColumns: ColumnDef<PayrollResultItem>[] = [
  buildIndexColumn<PayrollResultItem>(),

  {
    id: "emp",
    header: "Nhân viên",
    accessorFn: (r) => r.emp_name ?? r.emp_code ?? r.employee_id,
    cell: ({ row: { original: r } }) => (
      <div className="whitespace-nowrap text-sm">
        <div className="font-medium">{r.emp_name}</div>
        <div className="text-xs text-muted-foreground">{r.emp_code}</div>
      </div>
    ),
    size: 180,
  },

  {
    id: "role_code",
    header: "Vai trò",
    accessorFn: (r) => r.role_code,
    cell: ({ getValue }) => (
      <div className="text-xs font-mono whitespace-nowrap">{String(getValue() ?? "-")}</div>
    ),
    size: 100,
  },

  {
    id: "region_code",
    header: "Vùng",
    accessorFn: (r) => r.region_code,
    cell: ({ getValue }) => (
      <div className="text-center text-sm">{String(getValue() ?? "-")}</div>
    ),
    size: 70,
  },

  // ── Thu nhập ──
  {
    id: "income_group",
    header: () => <div className="text-center font-semibold">Thu nhập tháng</div>,
    meta: { thClassName: GROUP_BORDER },
    columns: [
      {
        id: "total_base_salary",
        header: () => headerRight("Lương CB"),
        accessorFn: (r) => r.total_base_salary,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 120,
        meta: { thClassName: GROUP_BORDER, tdClassName: GROUP_BORDER },
      },
      {
        id: "total_allowance",
        header: () => headerRight("Phụ cấp"),
        accessorFn: (r) => r.total_allowance,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 120,
      },
      {
        id: "total_bonus",
        header: () => headerRight("Thưởng 20%"),
        accessorFn: (r) => r.total_bonus,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 120,
      },
      {
        id: "support_amount",
        header: () => headerRight("Hỗ trợ"),
        accessorFn: (r) => r.support_amount,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 110,
      },
      {
        id: "gross_total",
        header: () => headerRight("Tổng TN"),
        accessorFn: (r) => r.gross_total,
        cell: ({ getValue }) => (
          <div className="text-right tabular-nums font-semibold text-sm text-blue-700 whitespace-nowrap">
            {fmt(getValue() as number)}
          </div>
        ),
        size: 130,
        meta: { tdClassName: "border-r border-border" },
      },
    ],
  },

  // ── Bảo hiểm ──
  {
    id: "bh_group",
    header: () => <div className="text-center font-semibold">Bảo hiểm (NV đóng)</div>,
    meta: { thClassName: GROUP_BORDER },
    columns: [
      {
        id: "bhxh_nv",
        header: () => headerRight("BHXH 8%"),
        accessorFn: (r) => r.bhxh_nv,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 110,
        meta: { thClassName: GROUP_BORDER, tdClassName: GROUP_BORDER },
      },
      {
        id: "bhyt_nv",
        header: () => headerRight("BHYT 1.5%"),
        accessorFn: (r) => r.bhyt_nv,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 110,
      },
      {
        id: "bhtn_nv",
        header: () => headerRight("BHTN 1%"),
        accessorFn: (r) => r.bhtn_nv,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 100,
      },
      {
        id: "kpcd_nv",
        header: () => headerRight("KPCD 0.5%"),
        accessorFn: (r) => r.kpcd_nv,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 105,
      },
      {
        id: "total_bh",
        header: () => headerRight("Tổng BH"),
        accessorFn: (r) => r.social_insurance,
        cell: ({ getValue }) => (
          <div className="text-right tabular-nums font-semibold text-sm text-orange-700 whitespace-nowrap">
            {fmt(getValue() as number)}
          </div>
        ),
        size: 115,
        meta: { tdClassName: "border-r border-border" },
      },
    ],
  },

  // ── Thuế TNCN ──
  {
    id: "tax_group",
    header: () => <div className="text-center font-semibold">Thuế TNCN</div>,
    meta: { thClassName: GROUP_BORDER },
    columns: [
      {
        id: "tax_exempt_amount",
        header: () => headerRight("Miễn thuế"),
        accessorFn: (r) => r.tax_exempt_amount,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 110,
        meta: { thClassName: GROUP_BORDER, tdClassName: GROUP_BORDER },
      },
      {
        id: "taxable_income",
        header: () => headerRight("TN chịu thuế"),
        accessorFn: (r) => r.taxable_income,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 130,
      },
      {
        id: "personal_income_tax",
        header: () => headerRight("Thuế TNCN"),
        accessorFn: (r) => r.personal_income_tax,
        cell: ({ getValue }) => (
          <div className="text-right tabular-nums font-semibold text-sm text-red-600 whitespace-nowrap">
            {fmt(getValue() as number)}
          </div>
        ),
        size: 120,
        meta: { tdClassName: "border-r border-border" },
      },
    ],
  },

  // ── Thực nhận ──
  {
    id: "deduct_group",
    header: () => <div className="text-center font-semibold">Khấu trừ & Thực nhận</div>,
    meta: { thClassName: GROUP_BORDER },
    columns: [
      {
        id: "tam_ung",
        header: () => headerRight("Tạm ứng"),
        accessorFn: (r) => r.tam_ung,
        cell: ({ getValue }) => cell(getValue() as number),
        size: 110,
        meta: { thClassName: GROUP_BORDER, tdClassName: GROUP_BORDER },
      },
      {
        id: "net_total",
        header: () => headerRight("Thực nhận"),
        accessorFn: (r) => r.net_total,
        cell: ({ getValue }) => (
          <div className="text-right tabular-nums font-bold text-sm text-green-700 whitespace-nowrap">
            {fmt(getValue() as number)}
          </div>
        ),
        size: 130,
      },
    ],
  },
]
