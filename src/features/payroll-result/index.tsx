import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { listPayrollResults } from "@/api/salary/payroll-result"
import { PayrollResultTable } from "./components/payroll-result-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import type { PaginationState } from "@tanstack/react-table"

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function PayrollResultPage() {
  const [period, setPeriod] = useState(currentPeriod())
  const [activePeriod, setActivePeriod] = useState(currentPeriod())
  const [keyword, setKeyword] = useState("")
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-result", activePeriod, keyword, pagination],
    queryFn: () => listPayrollResults({
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      period: activePeriod,
      keyword,
    }),
    enabled: !!activePeriod,
  })

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bảng lương</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chi tiết thu nhập, bảo hiểm, thuế TNCN và thực nhận từng nhân viên
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <Input
          className="w-36"
          placeholder="YYYY-MM"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => { setActivePeriod(period); setPagination({ pageIndex: 0, pageSize: 20 }) }}
        >
          <Search className="h-4 w-4 mr-2" /> Xem
        </Button>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.total.toLocaleString()} nhân viên` : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Đang tải...</div>
      ) : data ? (
        <PayrollResultTable
          data={data.items}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={data.total_page}
          keyword={keyword}
          onKeywordChange={setKeyword}
        />
      ) : null}
    </div>
  )
}
