import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useReactTable, getCoreRowModel, type PaginationState } from "@tanstack/react-table"
import { listAdjustments } from "@/api/salary/salary-adjustment"
import { AdjustmentsProvider, useAdjustments } from "./components/adjustments-provider"
import { AdjustmentDialog } from "./components/adjustment-dialog"
import { adjustmentColumns } from "./components/adjustment-columns"
import { CrudTable } from "@/components/crud/crud-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function AdjustmentContent({ period }: { period: string }) {
  const { open, currentRow, openCreate, close } = useAdjustments()
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const { data, isLoading } = useQuery({
    queryKey: ["salary-adjustments", period],
    queryFn: () => listAdjustments(period),
    enabled: !!period,
  })

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {data ? `${data.total} điều chỉnh` : ""}
        </span>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Thêm điều chỉnh
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

export default function SalaryAdjustmentPage() {
  const [period, setPeriod] = useState(currentPeriod())
  const [activePeriod, setActivePeriod] = useState(currentPeriod())

  return (
    <AdjustmentsProvider>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Điều chỉnh lương</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Điều chỉnh lương CB, phụ cấp và hỗ trợ thêm theo kỳ. NULL = giữ nguyên giá trị công thức.
          </p>
        </div>
        <div className="flex gap-2">
          <Input className="w-36" placeholder="YYYY-MM" value={period} onChange={e => setPeriod(e.target.value)} />
          <Button variant="outline" onClick={() => setActivePeriod(period)}>
            <Search className="h-4 w-4 mr-2" /> Xem
          </Button>
        </div>
        <AdjustmentContent period={activePeriod} />
      </div>
    </AdjustmentsProvider>
  )
}
