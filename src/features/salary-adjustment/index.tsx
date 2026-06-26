import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { type PaginationState } from "@tanstack/react-table"
import { listAdjustments } from "@/api/salary/salary-adjustment"
import { AdjustmentsProvider, useAdjustments } from "./components/adjustments-provider"
import { AdjustmentDialog } from "./components/adjustment-dialog"
import { adjustmentColumns } from "./components/adjustment-columns"
import { CrudTable } from "@/components/crud/crud-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { CalendarDays, CircleDollarSign, Plus, Search, SlidersHorizontal } from "lucide-react"

function AdjustmentContent({ period }: { period: string }) {
  const { open, currentRow, openCreate, close } = useAdjustments()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const { data, isLoading } = useQuery({
    queryKey: ["salary-adjustments", period],
    queryFn: () => listAdjustments(period),
    enabled: !!period,
  })

  const items = data?.items ?? []
  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.luong_cb_dieu_chinh != null) acc.salaryOverrides += 1
        if (item.phu_cap_dieu_chinh != null) acc.allowanceOverrides += 1
        acc.supportTotal += item.ho_tro ?? 0
        return acc
      },
      { total: 0, salaryOverrides: 0, allowanceOverrides: 0, supportTotal: 0 },
    )
  }, [items])
  const fmt = (value: number) => value.toLocaleString("vi-VN")

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Số điều chỉnh" value={String(summary.total)} icon={<SlidersHorizontal className="h-4 w-4" />} />
        <SummaryCard label="Override lương cơ bản" value={String(summary.salaryOverrides)} />
        <SummaryCard label="Override phụ cấp" value={String(summary.allowanceOverrides)} />
        <SummaryCard label="Tổng hỗ trợ thêm" value={fmt(summary.supportTotal)} icon={<CircleDollarSign className="h-4 w-4" />} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Danh sách điều chỉnh kỳ {period}</div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Đang tải dữ liệu..." : `${data?.total ?? 0} dòng điều chỉnh lương`}
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm điều chỉnh
        </Button>
      </div>

      <CrudTable
        data={items}
        columns={adjustmentColumns}
        entityName="điều chỉnh"
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={Math.ceil(items.length / pagination.pageSize)}
        showToolbar={false}
      />

      <AdjustmentDialog
        open={open === "create" || open === "edit"}
        onOpenChange={(v) => { if (!v) close() }}
        period={period}
        item={open === "edit" ? currentRow : null}
      />
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <Card className="rounded-lg py-4 shadow-none">
      <CardContent className="flex items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium uppercase text-muted-foreground">{label}</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
          {icon ?? <CalendarDays className="h-4 w-4" />}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SalaryAdjustmentPage() {
  const [period, setPeriod] = useState(currentSalaryPeriod())
  const [activePeriod, setActivePeriod] = useState(currentSalaryPeriod())

  return (
    <AdjustmentsProvider>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Điều chỉnh lương</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Quản lý các khoản override lương cơ bản, phụ cấp và hỗ trợ phát sinh theo từng kỳ lương.
              Trường bỏ trống sẽ giữ nguyên kết quả tính tự động.
            </p>
          </div>

          <div className="flex gap-2">
            <SalaryPeriodStepper
              value={period}
              onChange={setPeriod}
              onCommit={setActivePeriod}
            />
            <Button className="h-14 px-5" variant="outline" onClick={() => setActivePeriod(period)}>
              <Search className="mr-2 h-4 w-4" /> Xem
            </Button>
          </div>
        </div>

        <div className="rounded-lg border-l-4 border-l-teal-500 bg-teal-50/60 px-4 py-3 text-sm text-teal-900">
          <p className="font-semibold">Vai trò trong tính lương</p>
          <p className="mt-1 text-teal-800">
            Page này chỉ xử lý các khoản điều chỉnh thủ công cho kỳ lương đang chọn; dữ liệu ở đây được cộng/ghi đè khi chạy bảng lương.
          </p>
        </div>

        <AdjustmentContent period={activePeriod} />
      </div>
    </AdjustmentsProvider>
  )
}
