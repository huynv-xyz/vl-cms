import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { runYearBonus } from "@/api/salary/payroll-run"
import { listYearBonus, type YearBonusItem } from "@/api/salary/payroll-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Loader2 } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const fmt = (v?: number | null) => (v == null ? "—" : v.toLocaleString("vi-VN"))
const pct = (v?: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`)

const ROLE_LABEL: Record<string, string> = {
  SALE_SELF: "Sale",
  MGR_PROV: "ASM",
  MGR_REGION: "RM",
}

export default function YearBonusPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["year-bonus", viewYear],
    queryFn: () => listYearBonus(viewYear),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => runYearBonus(year),
    onSuccess: (res) => {
      toast.success(`Tính thưởng năm ${year} xong – ${res.sales_processed} Sale đã xử lý`)
      setViewYear(year)
      qc.invalidateQueries({ queryKey: ["year-bonus", year] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items: YearBonusItem[] = data?.items ?? []

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Thưởng vượt chỉ tiêu năm</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tính thưởng vượt theo 8 mốc % chặn dưới (3% → 20%). Chia cho Sale / ASM / RM theo tỷ lệ vùng.
        </p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2">
          <Input
            className="w-24"
            type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            min={2020}
            max={2100}
          />
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tính...</>
            ) : (
              <><PlayCircle className="mr-2 h-4 w-4" /> Tính thưởng năm {year}</>
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            className="w-24"
            type="number"
            value={viewYear}
            onChange={e => setViewYear(Number(e.target.value))}
          />
          <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["year-bonus", viewYear] })}>
            Xem năm {viewYear}
          </Button>
        </div>
        {data && (
          <span className="text-sm text-muted-foreground">
            {data.total} dòng phân bổ
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center h-32 items-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead className="text-center">Vai trò</TableHead>
                <TableHead className="text-center">Vùng</TableHead>
                <TableHead className="text-center">Có ASM</TableHead>
                <TableHead className="text-right">GTQD ĐK</TableHead>
                <TableHead className="text-center">% Vượt TT</TableHead>
                <TableHead className="text-center">Mốc áp dụng</TableHead>
                <TableHead className="text-right">Quỹ tại mốc</TableHead>
                <TableHead className="text-right font-bold text-green-700">Tiền thưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Không có dữ liệu năm {viewYear}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((r, idx) => (
                  <TableRow key={`${r.employee_id}-${r.role_code}`}>
                    <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.emp_name}</div>
                      <div className="text-xs text-muted-foreground">{r.emp_code}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{ROLE_LABEL[r.role_code] ?? r.role_code}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{r.region_code ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.has_asm ? "default" : "secondary"}>{r.has_asm ? "Có" : "Không"}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{fmt(r.gtqd_dk)}</TableCell>
                    <TableCell className="text-center text-sm">
                      <span className={r.actual_pct_over >= 0.03 ? "text-green-700 font-medium" : "text-red-500"}>
                        {pct(r.actual_pct_over)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{pct(r.applied_tier_rate)}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{fmt(r.pool_at_tier)}</TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-green-700">
                      {fmt(r.amount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
