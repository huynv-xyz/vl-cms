import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { listPayrollScopes, listSalaryBudgets } from "@/api/salary/salary-audit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

const fmt = (v?: number | null) => (v == null ? "-" : v.toLocaleString("vi-VN", { maximumFractionDigits: 0 }))
const pct = (v?: number | null) => (v == null ? "-" : `${(v * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`)

function EmployeeName({ code, name, id }: { code?: string | null; name?: string | null; id?: number | null }) {
  return (
    <div className="font-medium">
      {name || code || "-"}
      <div className="text-xs text-muted-foreground">{code || (id ? `#${id}` : "")}</div>
    </div>
  )
}

export default function SalaryAuditPage() {
  const [periodDraft, setPeriodDraft] = useState(currentSalaryPeriod())
  const [period, setPeriod] = useState(currentSalaryPeriod())
  const [keyword, setKeyword] = useState("")
  const params = { page: 1, size: 200, period, keyword }

  const budgets = useQuery({
    queryKey: ["salary-audit", "budgets", params],
    queryFn: () => listSalaryBudgets(params),
  })

  const scopes = useQuery({
    queryKey: ["salary-audit", "scopes", params],
    queryFn: () => listPayrollScopes(params),
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Đối soát lương</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem các bảng trung gian do pipeline tính lương sinh ra: ngân sách cá nhân và phân bổ theo scope.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SalaryPeriodStepper value={periodDraft} onChange={setPeriodDraft} onCommit={setPeriod} />
        <Input
          className="w-72"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm nhân viên, vai trò, vùng..."
        />
        <Button className="h-14 px-5" onClick={() => setPeriod(periodDraft)}>
          <Search className="mr-2 h-4 w-4" /> Xem kỳ
        </Button>
      </div>

      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budgets">Ngân sách cá nhân</TabsTrigger>
          <TabsTrigger value="scopes">Phân bổ scope</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Vùng/Tỉnh</TableHead>
                <TableHead className="text-right">Tổng quỹ</TableHead>
                <TableHead className="text-right">80% lương</TableHead>
                <TableHead className="text-right">20% thưởng</TableHead>
                <TableHead className="text-center">ASM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(budgets.data?.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell><EmployeeName code={item.emp_code} name={item.emp_name} id={item.employee_id} /></TableCell>
                  <TableCell><Badge variant="outline">{item.role_code}</Badge></TableCell>
                  <TableCell>{item.region_code || "-"} / {item.province_code || "-"}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(item.total_budget)}</TableCell>
                  <TableCell className="text-right">{fmt(item.budget_80)}</TableCell>
                  <TableCell className="text-right">{fmt(item.budget_20)}</TableCell>
                  <TableCell className="text-center">{item.has_asm ? "Có" : "Không"}</TableCell>
                </TableRow>
              ))}
              {!budgets.isLoading && (budgets.data?.items ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Chưa có ngân sách cá nhân cho kỳ {period}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="scopes" className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Vùng/Tỉnh</TableHead>
                <TableHead className="text-right">Lương DS tháng</TableHead>
                <TableHead className="text-right">Thưởng role</TableHead>
                <TableHead className="text-right">% HT</TableHead>
                <TableHead className="text-right">Nợ</TableHead>
                <TableHead className="text-right">Hỗ trợ</TableHead>
                <TableHead className="text-right">Tổng cuối</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(scopes.data?.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell><EmployeeName code={item.emp_code} name={item.emp_name} id={item.employee_id} /></TableCell>
                  <TableCell><Badge variant="outline">{item.role_code}</Badge></TableCell>
                  <TableCell>{item.region_code || "-"} / {item.province_code || "-"}</TableCell>
                  <TableCell className="text-right">{fmt(item.sales_salary_amount)}</TableCell>
                  <TableCell className="text-right">{fmt(item.role_bonus_amount)}</TableCell>
                  <TableCell className="text-right">{pct(item.completion_rate)}</TableCell>
                  <TableCell className="text-right">{pct(item.debt_rate)}</TableCell>
                  <TableCell className="text-right">{fmt(item.support_amount)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(item.final_gross)}</TableCell>
                </TableRow>
              ))}
              {!scopes.isLoading && (scopes.data?.items ?? []).length === 0 && (
                <TableRow><TableCell colSpan={9} className="h-28 text-center text-muted-foreground">Chưa có phân bổ scope cho kỳ {period}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}
