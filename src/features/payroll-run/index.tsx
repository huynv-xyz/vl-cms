import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { runPayroll, type PipelineResult } from "@/api/salary/payroll-run"
import { Button } from "@/components/ui/button"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, PlayCircle, AlertTriangle } from "lucide-react"

const STEPS = [
  { key: "step1_done", label: "Bước 1 – Tính ngân sách lương" },
  { key: "step2_done", label: "Bước 2 – Tổng hợp vùng cho RM", countKey: "step2_count" },
  { key: "step3_done", label: "Bước 3 – Phân bổ lương theo vai trò", countKey: "step3_count" },
  { key: "step4_done", label: "Bước 4 – Áp điều chỉnh & hỗ trợ vùng", countKey: "step4_count" },
  { key: "step5_done", label: "Bước 5 – Tính BH, thuế TNCN, thực nhận", countKey: "step5_count" },
] as const

export default function PayrollRunPage() {
  const [period, setPeriod] = useState(currentSalaryPeriod())
  const [result, setResult] = useState<PipelineResult | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => runPayroll(period),
    onSuccess: (data) => {
      setResult(data)
      if (data.success) {
        toast.success(`Tính lương kỳ ${period} thành công`)
      } else {
        toast.error(`Lỗi: ${data.error}`)
      }
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chạy bảng lương</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pipeline 5 bước: Ngân sách → Tổng hợp vùng → Phân bổ → Điều chỉnh → Thuế & Thực nhận
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kỳ tính lương</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <SalaryPeriodStepper value={period} onChange={setPeriod} />
          <Button
            className="h-14 px-5"
            onClick={() => mutate()}
            disabled={isPending || !period.match(/^\d{4}-\d{2}$/)}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tính...</>
            ) : (
              <><PlayCircle className="mr-2 h-4 w-4" /> Chạy bảng lương</>
            )}
          </Button>
        </CardContent>
      </Card>

      {(isPending || result) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Kết quả
              {result && (
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Thành công" : "Lỗi"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STEPS.map((step, idx) => {
              const done = result ? (result as any)[step.key] as boolean : false
              const count = "countKey" in step && result ? (result as any)[step.countKey] as number : undefined
              const isRunning = isPending && !done

              return (
                <div key={step.key} className="flex items-center gap-3">
                  {isPending && !result ? (
                    idx === 0 ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                    )
                  ) : done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : result && !result.success ? (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${done ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                  {count !== undefined && done && (
                    <Badge variant="secondary" className="text-xs">{count.toLocaleString()} dòng</Badge>
                  )}
                </div>
              )
            })}

            {result?.error && (
              <div className="flex items-start gap-2 mt-4 p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{result.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
