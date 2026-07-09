import { useEffect, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type PaginationState } from "@tanstack/react-table"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import {
  payrollConfigApi,
  type EmployeeDeductionItem,
  type InsuranceConfigItem,
  type TaxBracketItem,
} from "@/api/salary/payroll-config"
import {
  createSystemConfig,
  deleteSystemConfig,
  listSystemConfigs,
  updateSystemConfig,
} from "@/api/salary/salary-rules"
import { getEmployee, listEmployees } from "@/api/employee"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SalaryPeriodStepper, currentSalaryPeriod } from "@/components/salary/period-stepper"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const fmt = (v?: number | null) => v == null ? "-" : v.toLocaleString("vi-VN")
const pct = (v?: number | null) => v == null ? "-" : `${(v * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`
const num = (v: string) => v.trim() === "" ? 0 : Number(v.replace(/,/g, ""))
const laborLabel = (value?: string | null) => ({
  CT: "Chính thức",
  CTV: "Cộng tác viên",
  TV: "Thời vụ",
}[value || ""] ?? value ?? "-")
const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i)

const insuranceDefaults: Record<string, Record<string, { employee: string; company: string }>> = {
  CT: {
    BHXH: { employee: "8", company: "17.5" },
    BHYT: { employee: "1.5", company: "3" },
    BHTN: { employee: "1", company: "1" },
    KPCD: { employee: "0.5", company: "2" },
  },
  CTV: {
    BHXH: { employee: "0", company: "0" },
    BHYT: { employee: "0", company: "0" },
    BHTN: { employee: "0", company: "0" },
    KPCD: { employee: "0", company: "0" },
  },
  TV: {
    BHXH: { employee: "0", company: "0" },
    BHYT: { employee: "0", company: "0" },
    BHTN: { employee: "0", company: "0" },
    KPCD: { employee: "0", company: "0" },
  },
}

function applyInsuranceDefault(form: InsuranceFormState, insuranceType = form.insuranceType, laborType = form.laborType): InsuranceFormState {
  const defaults = insuranceDefaults[laborType]?.[insuranceType] ?? { employee: "0", company: "0" }
  return {
    ...form,
    insuranceType,
    laborType,
    employeeRate: defaults.employee,
    companyRate: defaults.company,
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      {onDelete && (
        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  )
}

type InsuranceFormState = {
  insuranceType: string
  laborType: string
  employeeRate: string
  companyRate: string
}

function InsuranceDialog({
  open,
  item,
  onClose,
}: {
  open: boolean
  item: InsuranceConfigItem | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<InsuranceFormState>({
    insuranceType: "BHXH",
    laborType: "CT",
    employeeRate: "8",
    companyRate: "17.5",
  })

  useEffect(() => {
    if (!open || !item) return
    setForm({
      insuranceType: item.insurance_type,
      laborType: item.labor_type,
      employeeRate: String(item.employee_rate * 100),
      companyRate: String(item.company_rate * 100),
    })
  }, [item, open])

  const mutation = useMutation({
    mutationFn: () => {
      if (!item) throw new Error("Chưa chọn cấu hình bảo hiểm")
      const body = {
        insuranceType: form.insuranceType,
        laborType: form.laborType,
        employeeRate: num(form.employeeRate) / 100,
        companyRate: num(form.companyRate) / 100,
      }
      return payrollConfigApi.updateInsurance(item.id, body)
    },
    onSuccess: () => {
      toast.success("Đã cập nhật tỷ lệ bảo hiểm")
      qc.invalidateQueries({ queryKey: ["payroll-config", "insurance"] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sửa tỷ lệ bảo hiểm</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Loại bảo hiểm</div>
            <div className="font-medium">{form.insuranceType}</div>
          </div>
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Loại lao động</div>
            <div className="font-medium">{laborLabel(form.laborType)}</div>
          </div>
          <Field label="Nhân viên đóng (%)">
            <Input value={form.employeeRate} onChange={e => setForm({ ...form, employeeRate: e.target.value })} />
          </Field>
          <Field label="Công ty đóng (%)">
            <Input value={form.companyRate} onChange={e => setForm({ ...form, companyRate: e.target.value })} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setForm(applyInsuranceDefault(form))}>
            Mặc định
          </Button>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !item}>
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InsuranceTab() {
  const [editing, setEditing] = useState<InsuranceConfigItem | null>(null)
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-config", "insurance"],
    queryFn: payrollConfigApi.listInsurance,
  })

  const items = data?.items ?? []
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">Tỷ lệ bảo hiểm hiện hành</h2>
        <p className="text-sm text-muted-foreground">
          Tỷ lệ theo luật dùng chung khi tính BHXH/BHYT/BHTN/KPCĐ, không cấu hình theo từng nhân viên.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["BHXH", "BHYT", "BHTN", "KPCD"].map(type => {
          const current = items.find(item => item.insurance_type === type && item.labor_type === "CT")
          return (
            <div key={type} className="rounded-md border bg-background p-4">
              <div className="text-sm font-semibold">{type}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">NV đóng</div>
                  <div className="font-semibold tabular-nums">{pct(current?.employee_rate)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Công ty đóng</div>
                  <div className="font-semibold tabular-nums">{pct(current?.company_rate)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="overflow-hidden rounded-md border bg-background">
        <div className="border-b px-4 py-3">
          <h3 className="font-medium">Chi tiết theo loại lao động</h3>
          <p className="text-sm text-muted-foreground">Chỉ chỉnh tỷ lệ khi chính sách nhà nước thay đổi.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Loại bảo hiểm</th>
              <th className="px-4 py-3">Loại lao động</th>
              <th className="px-4 py-3 text-right">Nhân viên đóng</th>
              <th className="px-4 py-3 text-right">Công ty đóng</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>Chưa có cấu hình bảo hiểm</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-medium">{item.insurance_type}</td>
                <td className="px-4 py-3">{laborLabel(item.labor_type)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{pct(item.employee_rate)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{pct(item.company_rate)}</td>
                <td className="px-4 py-3">
                  <ActionButtons onEdit={() => { setEditing(item); setOpen(true) }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InsuranceDialog open={open} item={editing} onClose={() => setOpen(false)} />
    </section>
  )
}

type TaxBracketFormState = {
  year: string
  bracketNo: string
  incomeFrom: string
  incomeTo: string
  taxRate: string
}

function TaxBracketDialog({
  open,
  item,
  onClose,
}: {
  open: boolean
  item: TaxBracketItem | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<TaxBracketFormState>({
    year: String(new Date().getFullYear()),
    bracketNo: "",
    incomeFrom: "",
    incomeTo: "",
    taxRate: "",
  })

  useEffect(() => {
    if (!open) return
    setForm(item ? {
      year: String(item.year),
      bracketNo: String(item.bracket_no),
      incomeFrom: String(item.income_from),
      incomeTo: item.income_to == null ? "" : String(item.income_to),
      taxRate: String(item.tax_rate * 100),
    } : {
      year: String(new Date().getFullYear()),
      bracketNo: "",
      incomeFrom: "",
      incomeTo: "",
      taxRate: "",
    })
  }, [item, open])

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        year: Number(form.year),
        bracketNo: Number(form.bracketNo),
        incomeFrom: num(form.incomeFrom),
        incomeTo: form.incomeTo.trim() === "" ? null : num(form.incomeTo),
        taxRate: num(form.taxRate) / 100,
      }
      return item ? payrollConfigApi.updateTaxBracket(item.id, body) : payrollConfigApi.createTaxBracket(body)
    },
    onSuccess: () => {
      toast.success(item ? "Đã cập nhật bậc thuế" : "Đã thêm bậc thuế")
      qc.invalidateQueries({ queryKey: ["payroll-config", "tax-brackets"] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Sửa bậc thuế TNCN" : "Thêm bậc thuế TNCN"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="Năm">
            <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Bậc">
            <Input value={form.bracketNo} onChange={e => setForm({ ...form, bracketNo: e.target.value })} />
          </Field>
          <Field label="Thuế suất (%)">
            <Input value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} />
          </Field>
          <Field label="Thu nhập từ">
            <Input value={form.incomeFrom} onChange={e => setForm({ ...form, incomeFrom: e.target.value })} />
          </Field>
          <Field label="Thu nhập tới">
            <Input value={form.incomeTo} onChange={e => setForm({ ...form, incomeTo: e.target.value })} placeholder="Trống = không giới hạn" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.year || !form.bracketNo}>
            {item ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TaxBracketTab() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<TaxBracketItem | null>(null)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [activeYear, setActiveYear] = useState(new Date().getFullYear())
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-config", "tax-brackets", activeYear],
    queryFn: () => payrollConfigApi.listTaxBrackets({ year: activeYear }),
  })
  const del = useMutation({
    mutationFn: payrollConfigApi.deleteTaxBracket,
    onSuccess: () => {
      toast.success("Đã xoá bậc thuế")
      qc.invalidateQueries({ queryKey: ["payroll-config", "tax-brackets"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Bậc thuế TNCN</h2>
          <p className="text-sm text-muted-foreground">Cấu hình theo năm, dùng cho lao động chính thức và tính lũy tiến theo từng bậc.</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setActiveYear(year)}>
            <Search className="mr-2 size-4" /> Xem
          </Button>
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="mr-2 size-4" /> Thêm
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Bậc</th>
              <th className="px-4 py-3">Năm</th>
              <th className="px-4 py-3 text-right">Từ</th>
              <th className="px-4 py-3 text-right">Tới</th>
              <th className="px-4 py-3 text-right">Thuế suất</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>Chưa có bậc thuế năm {activeYear}</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-medium">{item.bracket_no}</td>
                <td className="px-4 py-3">{item.year}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(item.income_from)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{item.income_to == null ? "Không giới hạn" : fmt(item.income_to)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{pct(item.tax_rate)}</td>
                <td className="px-4 py-3">
                  <ActionButtons
                    onEdit={() => { setEditing(item); setOpen(true) }}
                    onDelete={() => window.confirm("Xoá bậc thuế này?") && del.mutate(item.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TaxBracketDialog open={open} item={editing} onClose={() => setOpen(false)} />
    </section>
  )
}

type EmployeeDeductionFormState = {
  period: string
  employeeId: string
  itemType: "INCOME" | "ADVANCE" | "DEDUCTION"
  amount: string
  note: string
}

const monthlyIncomeTypeLabel = (value?: string | null) => {
  if (value === "ADVANCE") return "Tạm ứng"
  if (value === "DEDUCTION") return "Giảm trừ"
  return "Thu nhập"
}

const monthlyIncomeTypeTone = (value?: string | null) => {
  if (value === "ADVANCE") return "border-amber-200 text-amber-700"
  if (value === "DEDUCTION") return "border-rose-200 text-rose-700"
  return "border-emerald-200 text-emerald-700"
}

const monthlyIncomeAmountTone = (value?: string | null) => {
  if (value === "ADVANCE") return "text-amber-700"
  if (value === "DEDUCTION") return "text-rose-700"
  return "text-emerald-700"
}

function MonthlyIncomeDialog({
  open,
  item,
  period,
  onClose,
}: {
  open: boolean
  item: EmployeeDeductionItem | null
  period: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<EmployeeDeductionFormState>({
    period,
    employeeId: "",
    itemType: "INCOME",
    amount: "0",
    note: "",
  })
  useEffect(() => {
    if (!open) return
    setForm(item ? {
      period: item.period || period,
      employeeId: String(item.employee_id),
      itemType: item.item_type,
      amount: String(item.amount ?? 0),
      note: item.note ?? "",
    } : {
      period,
      employeeId: "",
      itemType: "INCOME",
      amount: "0",
      note: "",
    })
  }, [item, open, period])

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        period: form.period,
        employeeId: Number(form.employeeId),
        itemType: form.itemType,
        amount: num(form.amount),
        note: form.note.trim() || null,
      }
      return item ? payrollConfigApi.updateMonthlyIncome(item.id, body) : payrollConfigApi.createMonthlyIncome(body)
    },
    onSuccess: () => {
      toast.success(item ? "Đã cập nhật thu nhập phát sinh" : "Đã thêm thu nhập phát sinh")
      qc.invalidateQueries({ queryKey: ["payroll-config", "monthly-incomes"] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Sửa thu nhập phát sinh" : "Thêm thu nhập phát sinh"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Kỳ lương">
            <SalaryPeriodStepper className="w-full" value={form.period} onChange={(value) => setForm({ ...form, period: value })} />
          </Field>
          <Field label="Nhân viên">
            <AsyncSelect
              value={form.employeeId || undefined}
              onChange={(value: string | number | undefined) => setForm({ ...form, employeeId: value ? String(value) : "" })}
              dataSource={{
                getList: (params: any) => listEmployees({ page: 1, size: 30, status: "1", keyword: params.keyword }),
                getById: getEmployee,
              }}
              mapOption={(emp: any) => ({
                value: String(emp.id),
                label: `${emp.code || `#${emp.id}`} - ${emp.name || ""}`,
                raw: emp,
              })}
              initialOption={item ? {
                value: String(item.employee_id),
                label: `${item.code || `#${item.employee_id}`} - ${item.name || ""}`,
              } : undefined}
              placeholder="Chọn nhân viên"
              searchPlaceholder="Gõ mã hoặc tên nhân viên..."
              emptyText="Không tìm thấy nhân viên"
              clearText="Bỏ chọn nhân viên"
              required
            />
          </Field>
          <Field label="Loại">
            <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v as "INCOME" | "ADVANCE" | "DEDUCTION" })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Thu nhập</SelectItem>
                <SelectItem value="ADVANCE">Tạm ứng</SelectItem>
                <SelectItem value="DEDUCTION">Giảm trừ</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Số tiền">
            <Input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <Field label="Ghi chú">
              <Textarea
                className="min-h-24 resize-y"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="Lý do phát sinh trong kỳ"
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.period || !form.employeeId}>
            {item ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MonthlyIncomeTab() {
  const qc = useQueryClient()
  const [keyword, setKeyword] = useState("")
  const [activeKeyword, setActiveKeyword] = useState("")
  const [period, setPeriod] = useState(currentSalaryPeriod())
  const [activePeriod, setActivePeriod] = useState(currentSalaryPeriod())
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [editing, setEditing] = useState<EmployeeDeductionItem | null>(null)
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["payroll-config", "monthly-incomes", activePeriod, activeKeyword, pagination],
    queryFn: () => payrollConfigApi.listMonthlyIncomes({
      page: pagination.pageIndex + 1,
      size: pagination.pageSize,
      period: activePeriod,
      keyword: activeKeyword,
    }),
  })
  const del = useMutation({
    mutationFn: payrollConfigApi.deleteMonthlyIncome,
    onSuccess: () => {
      toast.success("Đã xoá thu nhập phát sinh")
      qc.invalidateQueries({ queryKey: ["payroll-config", "monthly-incomes"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const items = data?.items ?? []
  const totalIncome = items
    .filter(item => item.item_type === "INCOME")
    .reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const totalAdvance = items
    .filter(item => item.item_type === "ADVANCE")
    .reduce((sum, item) => sum + (item.amount ?? 0), 0)
  const totalDeduction = items
    .filter(item => item.item_type === "DEDUCTION")
    .reduce((sum, item) => sum + (item.amount ?? 0), 0)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Thu nhập phát sinh theo kỳ</h2>
          <p className="text-sm text-muted-foreground">Một nhân viên trong một kỳ có tối đa một dòng phát sinh: khoản cộng, tạm ứng, khấu trừ và ghi chú.</p>
        </div>
        <div className="flex gap-2">
          <SalaryPeriodStepper
            className="w-80"
            value={period}
            onChange={setPeriod}
            onCommit={(next) => {
              setActivePeriod(next)
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          />
          <Input
            className="w-64"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setActivePeriod(period)
                setActiveKeyword(keyword)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }
            }}
            placeholder="Tìm nhân viên..."
          />
          <Button className="h-14 px-5" variant="outline" onClick={() => {
            setActivePeriod(period)
            setActiveKeyword(keyword)
            setPagination(p => ({ ...p, pageIndex: 0 }))
          }}>
            <Search className="mr-2 size-4" /> Tìm
          </Button>
          <Button onClick={() => { setEditing(null); setOpen(true) }}>
            <Plus className="mr-2 size-4" /> Thêm
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-emerald-50 px-4 py-3 text-emerald-900">
          <div className="text-xs font-medium uppercase">Tổng thu nhập</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totalIncome)}</div>
        </div>
        <div className="rounded-md border bg-amber-50 px-4 py-3 text-amber-900">
          <div className="text-xs font-medium uppercase">Tổng tạm ứng</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totalAdvance)}</div>
        </div>
        <div className="rounded-md border bg-rose-50 px-4 py-3 text-rose-900">
          <div className="text-xs font-medium uppercase">Tổng giảm trừ</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{fmt(totalDeduction)}</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Nhân viên</th>
              <th className="px-4 py-3">Kỳ</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3 text-right">Số tiền</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>Chưa có thu nhập phát sinh kỳ {activePeriod}</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name || item.code}</div>
                  <div className="text-xs text-muted-foreground">{item.code}</div>
                </td>
                <td className="px-4 py-3"><Badge variant="outline">{item.period}</Badge></td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={monthlyIncomeTypeTone(item.item_type)}>
                    {monthlyIncomeTypeLabel(item.item_type)}
                  </Badge>
                </td>
                <td className={`px-4 py-3 text-right font-medium tabular-nums ${monthlyIncomeAmountTone(item.item_type)}`}>
                  {fmt(item.amount)}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{item.note || "-"}</td>
                <td className="px-4 py-3">
                  <ActionButtons
                    onEdit={() => { setEditing(item); setOpen(true) }}
                    onDelete={() => window.confirm("Xoá thu nhập phát sinh này?") && del.mutate(item.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{data ? `${data.total} dòng phát sinh` : ""}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.pageIndex === 0}
            onClick={() => setPagination(p => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
          >
            Trước
          </Button>
          <span>Trang {pagination.pageIndex + 1}/{data?.total_page ?? 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.pageIndex + 1 >= (data?.total_page ?? 1)}
            onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
          >
            Sau
          </Button>
        </div>
      </div>
      <MonthlyIncomeDialog
        open={open}
        item={editing}
        period={activePeriod}
        onClose={() => { setOpen(false); setEditing(null) }}
      />
    </section>
  )
}

type SystemConfigFormState = {
  configKey: string
  configValue: string
  effectiveFrom: string
  effectiveTo: string
  description: string
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function SystemConfigDialog({
  open,
  item,
  onClose,
}: {
  open: boolean
  item: any | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<SystemConfigFormState>({
    configKey: "",
    configValue: "0",
    effectiveFrom: today(),
    effectiveTo: "",
    description: "",
  })

  useEffect(() => {
    if (!open) return
    setForm(item ? {
      configKey: item.config_key ?? "",
      configValue: String(item.config_value ?? 0),
      effectiveFrom: item.effective_from ?? today(),
      effectiveTo: item.effective_to ?? "",
      description: item.description ?? "",
    } : {
      configKey: "",
      configValue: "0",
      effectiveFrom: today(),
      effectiveTo: "",
      description: "",
    })
  }, [item, open])

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        configKey: form.configKey.trim(),
        configValue: num(form.configValue),
        effectiveFrom: form.effectiveFrom || today(),
        effectiveTo: form.effectiveTo || null,
        status: 1,
        description: form.description.trim() || null,
      }
      return item ? updateSystemConfig(item.id, body) : createSystemConfig(body)
    },
    onSuccess: () => {
      toast.success(item ? "Đã cập nhật tham số" : "Đã thêm tham số")
      qc.invalidateQueries({ queryKey: ["payroll-config", "system-configs"] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Sửa tham số chung" : "Thêm tham số chung"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="Mã tham số">
            <Input value={form.configKey} onChange={e => setForm({ ...form, configKey: e.target.value })} placeholder="PERSONAL_DEDUCTION" />
          </Field>
          <Field label="Giá trị">
            <Input value={form.configValue} onChange={e => setForm({ ...form, configValue: e.target.value })} />
          </Field>
          <Field label="Từ ngày">
            <Input type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} />
          </Field>
          <Field label="Tới ngày">
            <Input type="date" value={form.effectiveTo} onChange={e => setForm({ ...form, effectiveTo: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <Field label="Ghi chú">
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.configKey.trim()}>
            {item ? "Cập nhật" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SystemConfigTab() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-config", "system-configs"],
    queryFn: listSystemConfigs,
  })
  const del = useMutation({
    mutationFn: deleteSystemConfig,
    onSuccess: () => {
      toast.success("Đã xoá tham số")
      qc.invalidateQueries({ queryKey: ["payroll-config", "system-configs"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const items = data?.items ?? []

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tham số chung</h2>
          <p className="text-sm text-muted-foreground">Các tham số công thức dùng chung trong pipeline tính lương như giảm trừ bản thân, giảm trừ phụ thuộc, hệ số chia quỹ.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true) }}>
          <Plus className="mr-2 size-4" /> Thêm
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Tham số</th>
              <th className="px-4 py-3 text-right">Giá trị</th>
              <th className="px-4 py-3">Hiệu lực</th>
              <th className="px-4 py-3">Ghi chú</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>Chưa có tham số chung</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3 font-medium">{item.config_key}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(item.config_value)}</td>
                <td className="px-4 py-3">{item.effective_from} → {item.effective_to || "..."}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.description || "-"}</td>
                <td className="px-4 py-3">
                  <ActionButtons
                    onEdit={() => { setEditing(item); setOpen(true) }}
                    onDelete={() => window.confirm("Xoá tham số này?") && del.mutate(item.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SystemConfigDialog open={open} item={editing} onClose={() => { setOpen(false); setEditing(null) }} />
    </section>
  )
}

export default function PayrollConfigPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Cấu hình lương</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý các tham số ổn định dùng ở bước tính bảng lương: bảo hiểm, thuế TNCN và tham số chung.
        </p>
      </div>

      <Tabs defaultValue="insurance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insurance">Bảo hiểm</TabsTrigger>
          <TabsTrigger value="tax-brackets">Bậc thuế</TabsTrigger>
          <TabsTrigger value="system-configs">Tham số chung</TabsTrigger>
        </TabsList>
        <TabsContent value="insurance"><InsuranceTab /></TabsContent>
        <TabsContent value="tax-brackets"><TaxBracketTab /></TabsContent>
        <TabsContent value="system-configs"><SystemConfigTab /></TabsContent>
      </Tabs>
    </div>
  )
}

export function MonthlyIncomePage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Thu nhập phát sinh</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập các khoản thu nhập hoặc giảm trừ phát sinh theo từng kỳ lương của nhân viên.
        </p>
      </div>
      <MonthlyIncomeTab />
    </div>
  )
}
