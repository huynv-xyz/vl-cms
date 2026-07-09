import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { getPayrollResultDetail } from "@/api/salary/payroll-result"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Banknote,
  CircleDollarSign,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react"

type Props = {
  employeeId: number
  period: string
}

const fmt = (value?: number | null, digits = 0) =>
  value == null ? "-" : value.toLocaleString("vi-VN", { maximumFractionDigits: digits })

const pct = (value?: number | null) =>
  value == null ? "-" : `${(value * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`

const progressPct = (value?: number | null) =>
  value == null ? 0 : Math.max(0, Math.min(value * 100, 100))

function money(value?: number | null) {
  return `${fmt(value)} đ`
}

function productUnit(name: string) {
  return name === "Bón lá lỏng" ? "lít" : "kg"
}

function roleLabel(code?: string) {
  switch (code) {
    case "SALE_SELF":
      return "Sale cá nhân"
    case "MGR_PROV":
      return "ASM quản lý"
    case "MGR_REGION":
      return "RM vùng"
    case "TECH_PROV":
      return "Kỹ thuật tỉnh"
    default:
      return code || "-"
  }
}

function completionTone(value?: number | null) {
  if (value == null || value <= 0) return "text-muted-foreground"
  if (value >= 1) return "text-emerald-700"
  if (value >= 0.8) return "text-amber-700"
  return "text-rose-700"
}

function completionBadge(value?: number | null, hasActualData = false) {
  if (!hasActualData) return "bg-slate-600"
  if ((value ?? 0) >= 1) return "bg-emerald-600"
  if ((value ?? 0) >= 0.8) return "bg-amber-600"
  return "bg-rose-600"
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = "text-foreground",
}: {
  label: string
  value: ReactNode
  helper?: ReactNode
  icon: ReactNode
  tone?: string
}) {
  return (
    <div className="rounded-md border bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
          <div className={`mt-2 text-xl font-semibold tabular-nums ${tone}`}>{value}</div>
          {helper ? <div className="mt-1 text-xs text-muted-foreground">{helper}</div> : null}
        </div>
        <div className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</div>
      </div>
    </div>
  )
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-md border bg-background">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function AmountRow({
  label,
  value,
  tone,
  sign,
}: {
  label: string
  value: ReactNode
  tone?: string
  sign?: "+" | "-"
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b py-2 text-sm last:border-0">
      <span className="min-w-0 text-muted-foreground">{label}</span>
      <span className={`text-right font-medium tabular-nums ${tone ?? ""}`}>
        {sign ? `${sign} ` : ""}
        {value}
      </span>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center">
      <div className="font-medium text-muted-foreground">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    </div>
  )
}

function Progress({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value * 100))
  const color = value >= 1 ? "bg-emerald-500" : value >= 0.8 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="h-2 rounded-full bg-muted">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  )
}

export default function PayrollDetailPage({ employeeId, period }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payroll-result-detail", period, employeeId],
    queryFn: () => getPayrollResultDetail(period, employeeId),
    enabled: !!period && employeeId > 0,
  })

  const payroll = data?.payroll
  const performance = data?.performance
  const incomeItems = data?.monthly_items.filter((item) => item.item_type === "INCOME") ?? []
  const advanceItems = data?.monthly_items.filter((item) => item.item_type === "ADVANCE") ?? []
  const deductionItems = data?.monthly_items.filter((item) => item.item_type === "DEDUCTION") ?? []
  const annualBonusTotal = data?.annual_bonus.reduce((sum, item) => sum + (item.amount ?? 0), 0) ?? 0
  const budgetTotal = data?.budgets.reduce((sum, item) => sum + (item.total_budget ?? 0), 0) ?? 0
  const hasActualData = (performance?.actual_row_count ?? 0) > 0
  const hasTransactions = (performance?.source_transaction_count ?? 0) > 0
  const hasTargetData = (performance?.target_row_count ?? 0) > 0
  const salesSalaryFromScopes = data?.scopes.reduce((sum, scope) => sum + (scope.sales_salary_amount ?? 0), 0) ?? 0

  const totalDeductions = payroll
    ? payroll.social_insurance + payroll.personal_income_tax + payroll.tam_ung + payroll.khau_tru_khac
    : 0
  const incomeFormulaTotal = payroll
    ? payroll.total_base_salary
      + payroll.total_allowance
      + payroll.sales_salary_amount
      + payroll.total_bonus
      + payroll.support_amount
    : 0
  const isPayrollStale = payroll ? Math.abs(incomeFormulaTotal - payroll.gross_total) > 1 : false

  const productRows: Array<[string, number, number, number, number]> = performance
    ? [
        ["Bón gốc", performance.target_bon_goc / 12, performance.actual_bon_goc, performance.target_bon_goc_qd_month ?? 0, performance.actual_bon_goc_qd ?? 0],
        ["Bón lá bột", performance.target_bon_la_bot / 12, performance.actual_bon_la_bot, performance.target_bon_la_bot_qd_month ?? 0, performance.actual_bon_la_bot_qd ?? 0],
        ["CLCN", performance.target_clcn / 12, performance.actual_clcn, performance.target_clcn_qd_month ?? 0, performance.actual_clcn_qd ?? 0],
        ["Bón lá lỏng", performance.target_bon_la_long / 12, performance.actual_bon_la_long, performance.target_bon_la_long_qd_month ?? 0, performance.actual_bon_la_long_qd ?? 0],
      ]
    : []

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/salary/payroll-result" search={{ period, page: 1, size: 20, keyword: "" }}>
              <ArrowLeft className="mr-2 size-4" />
              Quay lại bảng lương
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chi tiết lương nhân viên</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {payroll ? `${payroll.emp_code} - ${payroll.emp_name} · kỳ ${payroll.period}` : `Kỳ ${period}`}
            </p>
          </div>
        </div>
        {payroll ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{payroll.labor_type || payroll.employee_labor_type || "CT"}</Badge>
            <Badge variant="outline">{payroll.dependent_count} người phụ thuộc</Badge>
            {performance ? (
              <Badge className={completionBadge(performance.completion_rate, hasActualData)}>
                {!hasActualData ? "Chưa có doanh số" : `Hoàn thành ${pct(performance.completion_rate)}`}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="rounded-md border py-16 text-center text-muted-foreground">Đang tải chi tiết...</div>
      ) : isError || !payroll || !data || !performance ? (
        <div className="rounded-md border py-16 text-center text-muted-foreground">
          Không tìm thấy bảng lương của nhân viên trong kỳ này
        </div>
      ) : (
        <>
          {isPayrollStale ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-950">
              <AlertTitle>Dữ liệu bảng lương chưa đồng bộ với công thức hiện tại</AlertTitle>
              <AlertDescription>
                Tổng theo các dòng thu nhập hiện tại là {money(incomeFormulaTotal)}, trong khi bảng lương đã chốt đang là {money(payroll.gross_total)}.
                Cần chạy lại bảng lương kỳ {payroll.period} để cập nhật tổng thu nhập, bảo hiểm, thuế và thực nhận.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
            <section className="rounded-md border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Thực nhận kỳ này</div>
                  <div className="mt-3 text-4xl font-bold tracking-normal text-emerald-700 tabular-nums">
                    {money(payroll.net_total)}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Tổng thu nhập {money(payroll.gross_total)} - khấu trừ {money(totalDeductions)}
                  </div>
                </div>
                <div className="rounded-md bg-emerald-50 p-3 text-emerald-700">
                  <Wallet className="size-6" />
                </div>
              </div>
              <Separator className="my-5" />
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">Lương hồ sơ + doanh số</div>
                  <div className="mt-1 font-semibold tabular-nums">
                    {money(payroll.total_base_salary + payroll.total_allowance + payroll.sales_salary_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Thưởng</div>
                  <div className="mt-1 font-semibold tabular-nums">{money(payroll.total_bonus + annualBonusTotal)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Hỗ trợ/phát sinh</div>
                  <div className="mt-1 font-semibold tabular-nums">{money(payroll.support_amount)}</div>
                </div>
              </div>
            </section>

            <Section
              title="Công thức thực nhận"
              right={<Badge variant="outline">Kết quả từ bảng lương đã tính</Badge>}
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Thu nhập</div>
                  <AmountRow label="Lương cơ bản" value={money(payroll.total_base_salary)} sign="+" />
                  <AmountRow label="Phụ cấp" value={money(payroll.total_allowance)} sign="+" />
                  <AmountRow label="Lương doanh số" value={money(payroll.sales_salary_amount)} sign="+" />
                  <AmountRow label="Thưởng 20%" value={money(payroll.total_bonus)} sign="+" />
                  <AmountRow label="Hỗ trợ + phát sinh" value={money(payroll.support_amount)} sign="+" />
                  <AmountRow label="Tổng thu nhập" value={money(payroll.gross_total)} tone="text-blue-700" />
                </div>
                <div className="hidden w-px bg-border lg:block" />
                <div>
                  <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Khấu trừ</div>
                  <AmountRow label="Bảo hiểm nhân viên đóng" value={money(payroll.social_insurance)} tone="text-orange-700" sign="-" />
                  <AmountRow label="Thuế TNCN" value={money(payroll.personal_income_tax)} tone="text-red-700" sign="-" />
                  <AmountRow label="Tạm ứng" value={money(payroll.tam_ung)} sign="-" />
                  <AmountRow label="Giảm trừ phát sinh" value={money(payroll.khau_tru_khac)} tone="text-rose-700" sign="-" />
                  <AmountRow label="Thực nhận" value={money(payroll.net_total)} tone="text-lg font-bold text-emerald-700" />
                </div>
              </div>
            </Section>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Tổng thu nhập"
              value={money(payroll.gross_total)}
              helper="Trước bảo hiểm, thuế, giảm trừ"
              icon={<CircleDollarSign className="size-5" />}
              tone="text-blue-700"
            />
            <MetricCard
              label="Hoàn thành chỉ tiêu"
              value={hasActualData ? pct(performance.completion_rate) : "Chưa có dữ liệu"}
              helper={hasActualData ? `${fmt(performance.actual_gtqd_month, 1)} / ${fmt(performance.target_gtqd_month, 1)} GTQD` : `${performance.source_transaction_count} giao dịch nguồn`}
              icon={<Target className="size-5" />}
              tone={completionTone(hasActualData ? performance.completion_rate : null)}
            />
            <MetricCard
              label="Thưởng năm"
              value={money(annualBonusTotal)}
              helper="Thưởng vượt chỉ tiêu năm"
              icon={<TrendingUp className="size-5" />}
              tone="text-violet-700"
            />
            <MetricCard
              label="Quỹ lương"
              value={money(budgetTotal)}
              helper="Quỹ nguồn theo scope kỳ này"
              icon={<Banknote className="size-5" />}
              tone="text-slate-700"
            />
          </div>

          <Section
            title="Giải thích lương doanh số tháng"
            right={<Badge variant="outline">{money(salesSalaryFromScopes)}</Badge>}
          >
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Lương doanh số tháng</div>
                  <div className="mt-2 text-2xl font-semibold text-emerald-700 tabular-nums">
                    {money(salesSalaryFromScopes)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Tổng các dòng phân bổ bên dưới</div>
                </div>
                <div className="rounded-md border bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Nguồn tính</div>
                  <div className="mt-2 text-lg font-semibold">Phần lương năm</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Lấy từ quỹ nguồn/doanh số sau khi tách phần lương và phần thưởng.
                  </div>
                </div>
                <div className="rounded-md border bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Công thức</div>
                  <div className="mt-2 text-lg font-semibold">Lương năm / 12</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Lương năm = phần lương năm x tỷ lệ hưởng theo vai trò.
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {data.scopes.map((scope, index) => {
                  const roleRate = scope.salary_portion > 0 ? scope.role_salary_amount / scope.salary_portion : 0
                  const location = [scope.region_code, scope.province_code].filter(Boolean).join(" / ") || "-"
                  return (
                    <div
                      key={`${scope.role_code}-${scope.region_code}-${scope.province_code}-${index}`}
                      className="rounded-md border bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{roleLabel(scope.role_code)}</div>
                          <div className="mt-1 text-sm text-muted-foreground">Phạm vi {location}</div>
                        </div>
                        <Badge variant="outline">Tỷ lệ hưởng {pct(roleRate)}</Badge>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <div className="rounded-md bg-muted/30 px-3 py-2">
                          <div className="text-xs text-muted-foreground">Phần lương năm</div>
                          <div className="mt-1 font-semibold tabular-nums">{money(scope.salary_portion)}</div>
                        </div>
                        <div className="rounded-md bg-muted/30 px-3 py-2">
                          <div className="text-xs text-muted-foreground">Tỷ lệ vai trò</div>
                          <div className="mt-1 font-semibold tabular-nums">{pct(roleRate)}</div>
                        </div>
                        <div className="rounded-md bg-muted/30 px-3 py-2">
                          <div className="text-xs text-muted-foreground">Lương doanh số năm</div>
                          <div className="mt-1 font-semibold tabular-nums">{money(scope.role_salary_amount)}</div>
                        </div>
                        <div className="rounded-md bg-emerald-50 px-3 py-2">
                          <div className="text-xs text-emerald-700">Lương doanh số tháng</div>
                          <div className="mt-1 font-semibold text-emerald-800 tabular-nums">{money(scope.sales_salary_amount)}</div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                        {fmt(scope.salary_portion)} x {pct(roleRate)} = {fmt(scope.role_salary_amount)}; {fmt(scope.role_salary_amount)} / 12 ={" "}
                        <span className="font-semibold text-foreground">{money(scope.sales_salary_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Section>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <Section
              title="Hiệu quả kinh doanh"
              right={<Badge variant="outline">{hasActualData ? `Thu nợ ${pct(performance.debt_rate)}` : "Chưa có thực hiện"}</Badge>}
            >
              <div className="space-y-4">
                {!hasTransactions ? (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Chưa có giao dịch bán hàng trong sales_transactions cho kỳ {period}.
                  </div>
                ) : !hasActualData ? (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Có {performance.source_transaction_count} giao dịch nhưng chưa match sales_actuals cho nhân viên này.
                  </div>
                ) : null}
                {!hasTargetData ? (
                  <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    Nhân viên chưa có chỉ tiêu năm {period.slice(0, 4)}, tỷ lệ hoàn thành chưa thể tính đúng.
                  </div>
                ) : null}

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">GTQD tháng</span>
                    <span className={`font-semibold ${completionTone(hasActualData ? performance.completion_rate : null)}`}>
                      {hasActualData ? pct(performance.completion_rate) : "-"}
                    </span>
                  </div>
                  <Progress value={hasActualData ? progressPct(performance.completion_rate) : 0} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-3 py-2">Nhóm hàng</th>
                        <th className="px-3 py-2 text-right">Đơn vị</th>
                        <th className="px-3 py-2 text-right">Chỉ tiêu</th>
                        <th className="px-3 py-2 text-right">Thực hiện</th>
                        <th className="px-3 py-2 text-right">CT quy đổi</th>
                        <th className="px-3 py-2 text-right">TH quy đổi</th>
                        <th className="px-3 py-2 text-right">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productRows.map(([name, target, actual, targetQd, actualQd]) => {
                        const rate = targetQd > 0 ? actualQd / targetQd : 0
                        return (
                          <tr key={name} className="border-t">
                            <td className="px-3 py-2 font-medium">{name}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{productUnit(name)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(target, 1)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{hasActualData ? fmt(actual, 1) : "-"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(targetQd, 1)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{hasActualData ? fmt(actualQd, 1) : "-"}</td>
                            <td className={`px-3 py-2 text-right font-semibold tabular-nums ${completionTone(hasActualData && targetQd > 0 ? rate : null)}`}>
                              {hasActualData && targetQd > 0 ? pct(rate) : "-"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Section>

            <Section title="Căn cứ khấu trừ">
              <div className="text-sm">
                <AmountRow label="Loại lao động" value={payroll.labor_type || payroll.employee_labor_type || "-"} />
                <AmountRow label="Lương đóng bảo hiểm" value={money(payroll.luong_dong_bh)} />
                <AmountRow label="Số người phụ thuộc" value={payroll.dependent_count} />
                <AmountRow label="Thu nhập chịu thuế" value={money(payroll.taxable_income)} />
                <AmountRow label="Miễn/giảm thuế" value={money(payroll.tax_exempt_amount)} />
              </div>
              <Separator className="my-4" />
              <div className="text-sm">
                <AmountRow label={`BHXH ${pct(data.insurance_rates.find((r) => r.insurance_type === "BHXH")?.employee_rate)}`} value={money(payroll.bhxh_nv)} />
                <AmountRow label={`BHYT ${pct(data.insurance_rates.find((r) => r.insurance_type === "BHYT")?.employee_rate)}`} value={money(payroll.bhyt_nv)} />
                <AmountRow label={`BHTN ${pct(data.insurance_rates.find((r) => r.insurance_type === "BHTN")?.employee_rate)}`} value={money(payroll.bhtn_nv)} />
                <AmountRow label={`KPCD ${pct(data.insurance_rates.find((r) => r.insurance_type === "KPCD")?.employee_rate)}`} value={money(payroll.kpcd_nv)} />
              </div>
            </Section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="Phát sinh trong kỳ">
              {incomeItems.length === 0 && advanceItems.length === 0 && deductionItems.length === 0 && data.adjustments.length === 0 ? (
                <EmptyState title="Không có phát sinh" description="Kỳ lương này không có khoản cộng hoặc khoản trừ riêng." />
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-3 py-2">Loại</th>
                        <th className="px-3 py-2">Ghi chú</th>
                        <th className="px-3 py-2 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.adjustments.map((item, index) => (
                        <tr key={`adjustment-${index}`} className="border-t">
                          <td className="px-3 py-2">
                            <Badge className="bg-blue-600">Điều chỉnh</Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {[
                              item.luong_cb_dieu_chinh != null ? `Lương CB chốt ${money(item.luong_cb_dieu_chinh)}` : "",
                              item.phu_cap_dieu_chinh != null ? `Phụ cấp chốt ${money(item.phu_cap_dieu_chinh)}` : "",
                              item.ho_tro != null ? `Hỗ trợ ${money(item.ho_tro)}` : "",
                              item.ghi_chu || "",
                            ].filter(Boolean).join(" · ") || "Điều chỉnh lương"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums text-blue-700">
                            {item.ho_tro != null ? `+ ${money(item.ho_tro)}` : "-"}
                          </td>
                        </tr>
                      ))}
                      {[...incomeItems, ...advanceItems, ...deductionItems].map((item, index) => {
                        const isIncome = item.item_type === "INCOME"
                        const isAdvance = item.item_type === "ADVANCE"
                        return (
                          <tr key={`${item.item_type}-${index}`} className="border-t">
                            <td className="px-3 py-2">
                              <Badge className={isIncome ? "bg-emerald-600" : isAdvance ? "bg-amber-600" : "bg-rose-600"}>
                                {isIncome ? "Khoản cộng" : isAdvance ? "Tạm ứng" : "Khoản trừ"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {item.note || (isIncome ? "Thu nhập phát sinh" : isAdvance ? "Tạm ứng trong kỳ" : "Giảm trừ phát sinh")}
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold tabular-nums ${isIncome ? "text-emerald-700" : isAdvance ? "text-amber-700" : "text-rose-700"}`}>
                              {isIncome ? "+" : "-"} {money(item.amount)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section
              title="Thưởng vượt chỉ tiêu năm"
              right={<Badge variant="outline">{money(annualBonusTotal)}</Badge>}
            >
              {data.annual_bonus.length === 0 ? (
                <EmptyState
                  title="Chưa có thưởng vượt năm"
                  description="Chưa phát sinh dòng thưởng năm cho nhân viên ở kỳ này."
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md bg-violet-50 px-3 py-3">
                      <div className="text-xs font-medium uppercase text-violet-700">Tổng thưởng</div>
                      <div className="mt-1 font-semibold text-violet-800 tabular-nums">{money(annualBonusTotal)}</div>
                    </div>
                    <div className="rounded-md bg-slate-50 px-3 py-3">
                      <div className="text-xs font-medium uppercase text-slate-600">Số dòng</div>
                      <div className="mt-1 font-semibold tabular-nums">{data.annual_bonus.length}</div>
                    </div>
                    <div className="rounded-md bg-slate-50 px-3 py-3">
                      <div className="text-xs font-medium uppercase text-slate-600">Nguồn tính</div>
                      <div className="mt-1 font-semibold">Vượt chỉ tiêu năm</div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-muted/40 text-left">
                        <tr>
                          <th className="px-3 py-2">Vai trò</th>
                          <th className="px-3 py-2">Vùng</th>
                          <th className="px-3 py-2 text-right">% vượt</th>
                          <th className="px-3 py-2 text-right">Mốc</th>
                          <th className="px-3 py-2 text-right">Thưởng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.annual_bonus.map((item, index) => (
                          <tr key={`${item.role_code}-${item.region_code}-${index}`} className="border-t">
                            <td className="px-3 py-2 font-medium">{item.role_code || "-"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{item.region_code || "-"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{pct(item.actual_pct_over)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{pct(item.applied_tier_rate)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-violet-700 tabular-nums">{money(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Section>
          </div>

          <Section
            title="Scope lương và quỹ"
            right={<Badge variant="outline">{data.scopes.length} dòng phân bổ</Badge>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-3 py-2">Vai trò</th>
                    <th className="px-3 py-2">Vùng</th>
                    <th className="px-3 py-2 text-right">Quỹ nguồn</th>
                    <th className="px-3 py-2 text-right">Phần 80%</th>
                    <th className="px-3 py-2 text-right">Phần 20%</th>
                    <th className="px-3 py-2 text-right">Lương DS tháng</th>
                    <th className="px-3 py-2 text-right">Thưởng</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scopes.map((scope, index) => {
                    const budget = data.budgets.find((item) =>
                      item.role_code === scope.role_code &&
                      item.region_code === scope.region_code &&
                      (item.province_code || "") === (scope.province_code || "")
                    )
                    return (
                      <tr key={`${scope.role_code}-${scope.region_code}-${index}`} className="border-t">
                        <td className="px-3 py-2 font-medium">{scope.role_code}</td>
                        <td className="px-3 py-2">{scope.region_code || "-"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(budget?.total_budget)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(budget?.budget_80)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(budget?.budget_20)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(scope.sales_salary_amount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(scope.role_bonus_amount)}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{money(scope.final_gross)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span>
              Số liệu lấy từ bảng lương đã tính, chỉ tiêu, doanh số thực hiện, quỹ lương, phát sinh, điều chỉnh,
              cấu hình bảo hiểm và thuế.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
