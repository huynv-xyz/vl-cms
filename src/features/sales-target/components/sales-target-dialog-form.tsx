import { type ReactNode, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createSalesTarget,
  updateSalesTarget,
  type CreateSalesTargetRequest,
  type UpdateSalesTargetRequest,
} from "@/api/sales-target"
import { listEmployees } from "@/api/employee"
import { listRegions } from "@/api/region"
import { listProvinces } from "@/api/province"
import { listSalaryRoles } from "@/api/salary/region-pool"
import { listEmployeeScopes, type EmployeeScopeItem } from "@/api/salary/salary-setup"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SalesTarget } from "../data/schema"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Target, UserRound } from "lucide-react"

const EMPTY_VALUE = "__EMPTY__"

type Props = {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  salesTarget?: SalesTarget
}

function formatPeriod(value?: number) {
  if (value) return String(value).slice(0, 4)

  return String(new Date().getFullYear())
}

function toNumber(value: string) {
  if (!value) return 0
  const normalized = value.replace(/[,. ]/g, "")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function toDateText(value: unknown) {
  if (!value) return ""
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }
  const raw = String(value).trim()
  const commaDate = raw.match(/^(\d{4}),(\d{1,2}),(\d{1,2})$/)
  if (commaDate) {
    return `${commaDate[1]}-${commaDate[2].padStart(2, "0")}-${commaDate[3].padStart(2, "0")}`
  }
  return raw.slice(0, 10)
}

function scopeValue(scope: Pick<EmployeeScopeItem, "role_id" | "region_id" | "province_id">) {
  return [
    scope.role_id,
    scope.region_id ?? 0,
    scope.province_id ?? 0,
  ].join("|")
}

function isScopeInYear(scope: EmployeeScopeItem, year: string) {
  if (year.length !== 4) return false

  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const effectiveFrom = toDateText(scope.effective_from)
  const effectiveTo = toDateText(scope.effective_to)
  return effectiveFrom <= yearEnd && (!effectiveTo || effectiveTo >= yearStart)
}

function formatScopeLabel(
  scope: EmployeeScopeItem,
  roleNames: Map<number, string>,
  regionNames: Map<number, string>,
  provinceNames: Map<number, string>,
) {
  return [
    roleNames.get(scope.role_id) ?? `Role ID ${scope.role_id}`,
    scope.region_id ? (regionNames.get(scope.region_id) ?? `Vùng ID ${scope.region_id}`) : "Không vùng",
    scope.province_id ? (provinceNames.get(scope.province_id) ?? `Tỉnh ID ${scope.province_id}`) : "Không tỉnh",
  ].join(" / ")
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-md border">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-sm font-semibold">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </div>
      <div className="grid gap-4 p-4">{children}</div>
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        className="h-10 text-right tabular-nums"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function SalesTargetDialogForm({
  mode,
  open,
  onOpenChange,
  salesTarget,
}: Props) {
  const queryClient = useQueryClient()
  const isEdit = mode === "edit"

  const [employeeId, setEmployeeId] = useState("")
  const [scopeKey, setScopeKey] = useState(EMPTY_VALUE)
  const [period, setPeriod] = useState(formatPeriod())
  const [bonGoc, setBonGoc] = useState("0")
  const [bonLaBot, setBonLaBot] = useState("0")
  const [clcn, setClcn] = useState("0")
  const [bonLaLong, setBonLaLong] = useState("0")

  useEffect(() => {
    if (!open) return

    setEmployeeId(salesTarget?.employee_id ? String(salesTarget.employee_id) : "")
    setScopeKey(
      salesTarget?.role_id
        ? scopeValue({
          role_id: salesTarget.role_id,
          region_id: salesTarget.region_id,
          province_id: salesTarget.province_id,
        })
        : EMPTY_VALUE,
    )
    setPeriod(formatPeriod(salesTarget?.period))
    setBonGoc(String(salesTarget?.bon_goc ?? 0))
    setBonLaBot(String(salesTarget?.bon_la_bot ?? 0))
    setClcn(String(salesTarget?.clcn ?? 0))
    setBonLaLong(String(salesTarget?.bon_la_long ?? 0))
  }, [open, salesTarget])

  const { data: employeesData } = useQuery({
    queryKey: ["sales-target-form-employees"],
    queryFn: () => listEmployees({ page: 1, size: 500, status: "1" }),
    enabled: open,
  })
  const { data: rolesData } = useQuery({
    queryKey: ["sales-target-form-roles"],
    queryFn: listSalaryRoles,
    enabled: open,
  })
  const { data: regionsData } = useQuery({
    queryKey: ["sales-target-form-regions"],
    queryFn: () => listRegions({ page: 1, size: 500 }),
    enabled: open,
  })
  const { data: provincesData } = useQuery({
    queryKey: ["sales-target-form-provinces"],
    queryFn: () => listProvinces({ page: 1, size: 500 }),
    enabled: open,
  })
  const { data: scopesData } = useQuery({
    queryKey: ["sales-target-form-scopes", employeeId, period],
    queryFn: () => listEmployeeScopes({
      employee_id: employeeId,
      status: 1,
    }),
    enabled: open && Boolean(employeeId) && period.length === 4,
  })

  const employees = employeesData?.items ?? []
  const roles = rolesData?.items ?? []
  const regions = regionsData?.items ?? []
  const provinces = provincesData?.items ?? []
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, index) => String(currentYear - 2 + index))
  }, [])
  const scopes = useMemo(
    () => (scopesData?.items ?? []).filter((scope) => isScopeInYear(scope, period)),
    [scopesData, period],
  )
  const roleNames = useMemo(() => new Map(roles.map((item) => [item.id, `${item.code} - ${item.name}`])), [roles])
  const regionNames = useMemo(() => new Map(regions.map((item) => [item.id, `${item.code} - ${item.name}`])), [regions])
  const provinceNames = useMemo(() => new Map(provinces.map((item) => [item.id, `${item.code} - ${item.name}`])), [provinces])
  const selectedScope = scopes.find((scope) => scopeValue(scope) === scopeKey)
  useEffect(() => {
    if (!open || scopeKey !== EMPTY_VALUE || scopes.length !== 1) return
    setScopeKey(scopeValue(scopes[0]))
  }, [open, scopeKey, scopes])

  const canSubmit = useMemo(
    () => Boolean(employeeId && period.length === 4 && selectedScope),
    [employeeId, period, selectedScope],
  )

  const mutation = useMutation({
    mutationFn: () => {
      if (!canSubmit) {
        throw new Error("Vui lòng chọn nhân viên, năm chỉ tiêu và dòng phân công")
      }

      const body = {
        employee_id: Number(employeeId),
        role_id: selectedScope!.role_id,
        region_id: selectedScope!.region_id ?? null,
        province_id: selectedScope!.province_id ?? null,
        period: Number(period),
        main: 0,
        bon_goc: toNumber(bonGoc),
        bon_la_bot: toNumber(bonLaBot),
        clcn: toNumber(clcn),
        bon_la_long: toNumber(bonLaLong),
      }

      if (isEdit && salesTarget) {
        const updateBody: UpdateSalesTargetRequest = {
          ...body,
          id: salesTarget.id,
        }
        return updateSalesTarget(updateBody)
      }

      return createSalesTarget(body satisfies CreateSalesTargetRequest)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật chỉ tiêu" : "Đã tạo chỉ tiêu")
      queryClient.invalidateQueries({ queryKey: ["sales-target"] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không lưu được chỉ tiêu")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b bg-muted/20 px-6 py-5 pr-12">
          <DialogTitle>{isEdit ? "Sửa chỉ tiêu" : "Thêm chỉ tiêu"}</DialogTitle>
          <DialogDescription>
            Chỉ tiêu năm phải bám đúng dòng phân công đang hiệu lực của nhân viên.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto px-6 py-5">
          <FormSection title="Nhân viên và năm chỉ tiêu" icon={<UserRound className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
              <div className="space-y-1.5">
                <Label>Nhân viên</Label>
                <Select
                  value={employeeId}
                  onValueChange={(nextEmployeeId) => {
                    setEmployeeId(nextEmployeeId)
                    setScopeKey(EMPTY_VALUE)
                  }}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.code} - {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Năm chỉ tiêu</Label>
                <Select
                  value={period}
                  onValueChange={(nextPeriod) => {
                    setPeriod(nextPeriod)
                    setScopeKey(EMPTY_VALUE)
                  }}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FormSection>

          <FormSection title="Dòng phân công áp dụng" icon={<CalendarDays className="h-4 w-4" />}>
            {employeeId && period.length === 4 ? (
              <div className="space-y-2">
                {scopes.length === 0 && (
                  <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Chưa có dòng phân công hiệu lực cho nhân viên trong năm này. Vào Cấu hình lương để thêm phân công trước.
                  </p>
                )}

                {scopes.length === 1 && (
                  <div className="rounded-md border bg-muted/40 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {formatScopeLabel(scopes[0], roleNames, regionNames, provinceNames)}
                      <Badge variant="secondary">Tự chọn</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Dòng phân công này đang hiệu lực trong năm {period}.
                    </p>
                  </div>
                )}

                {scopes.length > 1 && (
                  <>
                    <Select value={scopeKey} onValueChange={setScopeKey}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Chọn dòng phân công cần nhập chỉ tiêu" />
                      </SelectTrigger>
                      <SelectContent>
                        {scopes.map((scope) => (
                          <SelectItem key={scope.id} value={scopeValue(scope)}>
                            {formatScopeLabel(scope, roleNames, regionNames, provinceNames)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Nhân viên có nhiều dòng phân công trong năm này, chọn dòng cần nhập chỉ tiêu.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Chọn nhân viên và năm để tải các dòng phân công hiệu lực.
              </p>
            )}
          </FormSection>

          <FormSection title="Chỉ tiêu sản lượng năm" icon={<Target className="h-4 w-4" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <NumberField label="Bón gốc (kg)" value={bonGoc} onChange={setBonGoc} />
              <NumberField label="Bón lá bột (kg)" value={bonLaBot} onChange={setBonLaBot} />
              <NumberField label="CLCN (kg)" value={clcn} onChange={setClcn} />
              <NumberField label="Bón lá lỏng (lít)" value={bonLaLong} onChange={setBonLaLong} />
            </div>
          </FormSection>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="button" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
