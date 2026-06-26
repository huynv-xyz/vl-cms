import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { listPayrollResults } from "@/api/salary/payroll-result"
import { PayrollResultTable } from "./components/payroll-result-table"
import { Route } from "@/routes/_authenticated/salary/payroll-result"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { Banknote, Calculator, ReceiptText, Search, ShieldCheck, Users } from "lucide-react"

const money = (value?: number | null) =>
  (value ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 })

function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  hint: string
  icon: typeof Users
  tone: string
}) {
  return (
    <Card className="rounded-md py-0">
      <CardContent className="flex items-start justify-between gap-5 p-5">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">{title}</div>
          <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
          <div className="mt-2 text-sm text-muted-foreground">{hint}</div>
        </div>
        <div className={`rounded-md p-3 ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function PayrollResultPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { pagination, setPagination } = useUrlPagination(search, navigate)
  const { keyword, setKeyword } = useUrlListFilters(search, navigate, [])

  const activePeriod = search.period || currentSalaryPeriod()
  const [period, setPeriod] = useState(activePeriod)

  useEffect(() => {
    setPeriod(activePeriod)
  }, [activePeriod])

  const commitPeriod = (nextPeriod: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        period: nextPeriod || undefined,
        page: 1,
      }),
      replace: true,
    })
  }

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-result", activePeriod, search.page, search.size, keyword],
    queryFn: () => listPayrollResults({
      page: search.page,
      size: search.size,
      period: activePeriod,
      keyword,
    }),
    enabled: !!activePeriod,
  })

  const summary = useMemo(() => {
    const rows = data?.items ?? []
    return rows.reduce(
      (acc, row) => {
        const deduction = (row.social_insurance ?? 0) + (row.personal_income_tax ?? 0) + (row.tam_ung ?? 0) + (row.khau_tru_khac ?? 0)
        acc.gross += row.gross_total ?? 0
        acc.deduction += deduction
        acc.net += row.net_total ?? 0
        if ((row.net_total ?? 0) > 0) acc.paidCount += 1
        return acc
      },
      { gross: 0, deduction: 0, net: 0, paidCount: 0 }
    )
  }, [data])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bảng lương</h1>
            <Badge variant="outline" className="rounded-md">Kỳ {activePeriod}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Tổng hợp lương chốt kỳ, bảo hiểm, thuế, phát sinh và thực nhận. Bấm tên nhân viên để xem chi tiết.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-3 shadow-sm">
          <SalaryPeriodStepper
            className="h-14 w-80"
            value={period}
            onChange={setPeriod}
            onCommit={commitPeriod}
          />
          <Button
            className="h-14 px-5"
            variant="outline"
            onClick={() => commitPeriod(period)}
          >
            <Search className="mr-2 h-4 w-4" /> Xem kỳ
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Nhân viên"
          value={(data?.total ?? 0).toLocaleString("vi-VN")}
          hint={`${summary.paidCount.toLocaleString("vi-VN")} dòng có thực nhận trên trang`}
          icon={Users}
          tone="bg-slate-100 text-slate-700"
        />
        <SummaryCard
          title="Tổng thu nhập"
          value={money(summary.gross)}
          hint="Tổng trên trang hiện tại"
          icon={Banknote}
          tone="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          title="Khấu trừ"
          value={money(summary.deduction)}
          hint="BH, thuế, tạm ứng và khoản khác"
          icon={ReceiptText}
          tone="bg-orange-50 text-orange-700"
        />
        <SummaryCard
          title="Thực nhận"
          value={money(summary.net)}
          hint="Sau toàn bộ khấu trừ"
          icon={ShieldCheck}
          tone="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          title="Trạng thái"
          value={isLoading ? "Đang tải" : "Sẵn sàng"}
          hint={`Dữ liệu kỳ ${activePeriod}`}
          icon={Calculator}
          tone="bg-violet-50 text-violet-700"
        />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border bg-card text-muted-foreground shadow-sm">Đang tải...</div>
      ) : data ? (
        <PayrollResultTable
          data={data.items}
          pagination={pagination}
          onPaginationChange={setPagination}
          pageCount={data.total_page}
          keyword={keyword}
          onKeywordChange={setKeyword}
          period={activePeriod}
        />
      ) : null}
    </div>
  )
}
