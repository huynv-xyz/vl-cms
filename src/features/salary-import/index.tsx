import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { importSalaryCustomerWorkbook, type SalaryCustomerImportResult } from "@/api/salary/customer-import"
import { SalaryPeriodStepper } from "@/components/salary/period-stepper"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react"

const currentYear = new Date().getFullYear()

const clearTables = [
  "payrolls",
  "payroll_scopes",
  "employee_salary_budgets",
  "region_salary_aggregations",
  "sales_actuals",
  "sales_targets",
  "employee_scopes",
  "manager_mappings",
  "salary_adjustments",
  "salary_monthly_deductions",
  "sales_transactions",
]

const resultLabels: Array<[keyof SalaryCustomerImportResult, string]> = [
  ["employees", "Nhân viên"],
  ["products", "Vật tư / sản phẩm"],
  ["region_income_configs", "Hệ số quy đổi vùng"],
  ["role_rates", "Tỷ lệ vai trò"],
  ["bonus_split_rules", "Luật chia thưởng"],
  ["insurance_configs", "Cấu hình bảo hiểm"],
  ["tax_brackets", "Bậc thuế"],
  ["tax_exemptions", "Giảm trừ thuế"],
  ["employee_scopes", "Phân công nhân sự"],
  ["sales_targets", "Chỉ tiêu năm"],
  ["manager_mappings", "Sơ đồ quản lý"],
  ["salary_adjustments", "Điều chỉnh lương"],
  ["monthly_items", "Phát sinh kỳ"],
  ["sales_transactions", "Giao dịch bán hàng"],
]

function fmt(value: unknown) {
  return typeof value === "number" ? value.toLocaleString("vi-VN") : "-"
}

export default function SalaryImportPage() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [year, setYear] = useState(String(currentYear))
  const [adjustmentPeriod, setAdjustmentPeriod] = useState(`${currentYear}-01`)
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [result, setResult] = useState<SalaryCustomerImportResult | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Vui lòng chọn file Excel")
      const importYear = Number(year)
      if (!Number.isInteger(importYear) || importYear < 2000) throw new Error("Năm import không hợp lệ")
      return importSalaryCustomerWorkbook({
        file,
        year: importYear,
        adjustmentPeriod,
        replaceExisting,
      })
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success("Import dữ liệu lương thành công")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import dữ liệu lương</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nạp file Excel khách hàng gửi vào các bảng dữ liệu lương để chạy thông luồng tính lương bằng dữ liệu thật.
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50 text-amber-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Import có clear dữ liệu cũ</AlertTitle>
        <AlertDescription>
          Khi bật clear, hệ thống xoá dữ liệu tính lương của năm đang chọn ở các bảng trung gian/kết quả trước khi import lại từ Excel.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">File Excel khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-white p-6 text-center shadow-sm transition hover:bg-muted/40"
              onClick={() => inputRef.current?.click()}
              disabled={mutation.isPending}
            >
              <FileSpreadsheet className="h-10 w-10 text-teal-600" />
              <div>
                <div className="text-base font-semibold">
                  {file ? file.name : "Chọn file Excel"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Hỗ trợ .xlsx/.xls, nên dùng file gốc khách hàng gửi.
                </div>
              </div>
            </button>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Năm import</Label>
                <Input
                  className="h-12 text-base font-semibold"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Kỳ áp điều chỉnh/phát sinh mặc định</Label>
                <SalaryPeriodStepper
                  className="h-12 w-full"
                  inputClassName="text-xl"
                  value={adjustmentPeriod}
                  onChange={setAdjustmentPeriod}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border bg-white p-4 shadow-sm">
              <Checkbox
                id="replaceExisting"
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="replaceExisting" className="font-semibold">Clear dữ liệu cũ trước khi import</Label>
                <p className="text-sm text-muted-foreground">
                  Nên bật khi chạy lại file khách hàng để số liệu không bị cộng dồn hoặc lẫn data test.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="h-12 px-6"
                onClick={() => mutation.mutate()}
                disabled={!file || mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {mutation.isPending ? "Đang import..." : "Import dữ liệu"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">Bảng sẽ clear</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {clearTables.map((table) => (
              <div key={table} className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm">
                <span className="font-mono">{table}</span>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="text-base">Kết quả import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {resultLabels.map(([key, label]) => (
                <div key={String(key)} className="rounded-md border bg-white p-4 shadow-sm">
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <div className="mt-2 text-2xl font-bold tabular-nums">{fmt(result[key])}</div>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <div className="mb-2 text-sm font-semibold">Đồng bộ sales_actuals</div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-3 py-2 text-left">Kỳ</th>
                      <th className="px-3 py-2 text-right">Giao dịch nguồn</th>
                      <th className="px-3 py-2 text-right">Không map NV</th>
                      <th className="px-3 py-2 text-right">Đã xoá</th>
                      <th className="px-3 py-2 text-right">Đã insert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.sales_actual_syncs.map((row) => (
                      <tr key={row.period} className="border-t">
                        <td className="px-3 py-2 font-medium">{row.period}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(row.source_rows)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(row.missing_employees)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(row.deleted)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(row.inserted)}</td>
                      </tr>
                    ))}
                    {result.sales_actual_syncs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                          Chưa có kỳ doanh số nào được đồng bộ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
