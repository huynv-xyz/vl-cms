import { type ColumnDef } from "@tanstack/react-table"
import type { SalaryAdjustmentItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { AdjustmentRowActions } from "./adjustment-row-actions"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const fmt = (v?: number | null) => (v == null ? null : v.toLocaleString("vi-VN"))

function MoneyCell({ value, accent }: { value?: number | null; accent?: "green" | "blue" }) {
  const formatted = fmt(value)
  if (!formatted) {
    return <div className="text-right text-sm text-muted-foreground">Không đổi</div>
  }
  return (
    <div
      className={cn(
        "text-right text-sm font-semibold tabular-nums",
        accent === "green" && "text-emerald-700",
        accent === "blue" && "text-blue-700",
      )}
    >
      {formatted}
    </div>
  )
}

export const adjustmentColumns: ColumnDef<SalaryAdjustmentItem>[] = [
  buildIndexColumn<SalaryAdjustmentItem>(),
  {
    id: "emp",
    header: "Nhân viên",
    cell: ({ row: { original: r } }) => (
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{r.emp_name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{r.emp_code}</div>
      </div>
    ),
    size: 240,
  },
  {
    id: "period",
    header: "Kỳ lương",
    accessorFn: (r) => r.period,
    cell: ({ getValue }) => (
      <Badge variant="outline" className="font-medium">
        {String(getValue())}
      </Badge>
    ),
    size: 110,
  },
  {
    id: "luong_cb",
    header: () => <div className="text-right">Lương cơ bản</div>,
    accessorFn: (r) => r.luong_cb_dieu_chinh,
    cell: ({ getValue }) => <MoneyCell value={getValue() as number | null} />,
    size: 160,
  },
  {
    id: "phu_cap",
    header: () => <div className="text-right">Phụ cấp</div>,
    accessorFn: (r) => r.phu_cap_dieu_chinh,
    cell: ({ getValue }) => <MoneyCell value={getValue() as number | null} accent="green" />,
    size: 140,
  },
  {
    id: "ho_tro",
    header: () => <div className="text-right">Hỗ trợ thêm</div>,
    accessorFn: (r) => r.ho_tro,
    cell: ({ getValue }) => <MoneyCell value={getValue() as number | null} accent="blue" />,
    size: 130,
  },
  {
    id: "ghi_chu",
    header: "Ghi chú",
    accessorFn: (r) => r.ghi_chu,
    cell: ({ getValue }) => {
      const note = String(getValue() ?? "")
      return (
        <div className="max-w-[280px] truncate text-sm text-muted-foreground">
          {note || "Không có ghi chú"}
        </div>
      )
    },
    size: 280,
  },
  {
    id: "status",
    header: "Trạng thái",
    accessorFn: (r) => r.status,
    cell: ({ getValue }) => {
      const s = getValue() as number
      return (
        <Badge variant={s === 1 ? "default" : s === 2 ? "destructive" : "secondary"}>
          {s === 1 ? "Đã duyệt" : s === 2 ? "Từ chối" : "Chờ duyệt"}
        </Badge>
      )
    },
    size: 110,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <AdjustmentRowActions item={row.original} />,
    size: 50,
    enableSorting: false,
  },
]
