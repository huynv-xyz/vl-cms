import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getRegionPool, type RegionPoolItem } from "@/api/salary/region-pool"
import { Button } from "@/components/ui/button"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { Search } from "lucide-react"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const fmt = (v: number) => v.toLocaleString("vi-VN")
const pct = (v: number) => `${(v * 100).toFixed(0)}%`

export default function RegionPoolPage() {
  const [period, setPeriod] = useState(currentSalaryPeriod())
  const [activePeriod, setActivePeriod] = useState(currentSalaryPeriod())

  const { data, isLoading } = useQuery({
    queryKey: ["region-pool", activePeriod],
    queryFn: () => getRegionPool(activePeriod),
    enabled: !!activePeriod,
  })

  const items: RegionPoolItem[] = data?.items ?? []
  const grandTotal = items.reduce((s, r) => s + r.total_region_pool, 0)

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Quỹ vùng RM</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tổng hợp quỹ nguồn toàn vùng và phân chia cho từng Trưởng vùng (RM)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SalaryPeriodStepper value={period} onChange={setPeriod} onCommit={setActivePeriod} />
        <Button className="h-14 px-5" variant="outline" onClick={() => setActivePeriod(period)}>
          <Search className="h-4 w-4 mr-2" /> Xem
        </Button>
        {data && (
          <span className="text-sm text-muted-foreground self-center">
            {items.length} vùng · Tổng quỹ: <strong>{fmt(grandTotal)}</strong> VND/năm
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
                <TableHead className="w-20">Vùng</TableHead>
                <TableHead>Trưởng vùng (RM)</TableHead>
                <TableHead className="text-center">Số Sale</TableHead>
                <TableHead className="text-right">Tổng quỹ vùng (VND/năm)</TableHead>
                <TableHead className="text-center">Tỷ lệ RM</TableHead>
                <TableHead className="text-right">Quỹ QL vùng</TableHead>
                <TableHead className="text-right">Quỹ cá nhân</TableHead>
                <TableHead className="text-right font-bold">Tổng quỹ RM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Không có dữ liệu cho kỳ {activePeriod}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((r) => (
                  <TableRow key={`${r.region_code}-${r.rm_employee_id}`}>
                    <TableCell>
                      <Badge variant="outline">{r.region_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.rm_name}</div>
                      <div className="text-xs text-muted-foreground">{r.rm_code}</div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{r.sale_count}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{fmt(r.total_region_pool)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{pct(r.rm_share_rate)}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{fmt(r.rm_mgr_pool)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-blue-700">
                      {r.rm_personal_pool > 0 ? fmt(r.rm_personal_pool) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-green-700">
                      {fmt(r.rm_total_pool)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {items.length > 0 && (
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Tổng cộng</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(grandTotal)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums">
                    {fmt(items.reduce((s, r) => s + r.rm_mgr_pool, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-blue-700">
                    {fmt(items.reduce((s, r) => s + r.rm_personal_pool, 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-green-700">
                    {fmt(items.reduce((s, r) => s + r.rm_total_pool, 0))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
