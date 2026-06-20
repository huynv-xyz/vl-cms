import { type ColumnDef } from "@tanstack/react-table"
import type { SalaryAdjustmentItem } from "../data/schema"
import { buildIndexColumn } from "@/components/crud/build-index-column"
import { AdjustmentRowActions } from "./adjustment-row-actions"
import { Badge } from "@/components/ui/badge"

const fmt = (v?: number | null) => (v == null ? "-" : v.toLocaleString("vi-VN"))

export const adjustmentColumns: ColumnDef<SalaryAdjustmentItem>[] = [
  buildIndexColumn<SalaryAdjustmentItem>(),
  {
    id: "emp",
    header: "Nhân viên",
    cell: ({ row: { original: r } }) => (
      <div>
        <div className="font-medium text-sm">{r.emp_name}</div>
        <div className="text-xs text-muted-foreground">{r.emp_code}</div>
      </div>
    ),
    size: 180,
  },
  {
    id: "region_code",
    header: "Vùng",
    accessorFn: (r) => r.region_code ?? "—",
    cell: ({ getValue }) => <div className="text-center text-sm">{String(getValue())}</div>,
    size: 80,
  },
  {
    id: "luong_cb",
    header: () => <div className="text-right">Lương CB điều chỉnh</div>,
    accessorFn: (r) => r.luong_cb_dieu_chinh,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums text-sm">{fmt(getValue() as number | null)}</div>
    ),
    size: 160,
  },
  {
    id: "phu_cap",
    header: () => <div className="text-right">Phụ cấp điều chỉnh</div>,
    accessorFn: (r) => r.phu_cap_dieu_chinh,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums text-sm">{fmt(getValue() as number | null)}</div>
    ),
    size: 160,
  },
  {
    id: "ho_tro",
    header: () => <div className="text-right">Hỗ trợ thêm</div>,
    accessorFn: (r) => r.ho_tro,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums text-sm text-blue-700">{fmt(getValue() as number | null)}</div>
    ),
    size: 130,
  },
  {
    id: "ghi_chu",
    header: "Ghi chú",
    accessorFn: (r) => r.ghi_chu,
    cell: ({ getValue }) => (
      <div className="text-sm text-muted-foreground max-w-[200px] truncate">{String(getValue() ?? "")}</div>
    ),
    size: 200,
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
