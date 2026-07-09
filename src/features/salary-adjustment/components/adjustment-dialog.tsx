import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SalaryPeriodStepper } from "@/components/salary/period-stepper"
import { createAdjustment, updateAdjustment, type CreateAdjustmentRequest } from "@/api/salary/salary-adjustment"
import { getEmployee, listEmployees } from "@/api/employee"
import type { SalaryAdjustmentItem } from "../data/schema"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  period: string
  item?: SalaryAdjustmentItem | null
}

function parseNum(v: string) {
  const normalized = v.replace(/\./g, "").replace(/,/g, "")
  const n = Number(normalized)
  return Number.isNaN(n) ? null : n
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  )
}

function formatMoneyInput(value?: number | null) {
  return value != null ? String(value) : ""
}

export function AdjustmentDialog({ open, onOpenChange, period, item }: Props) {
  const isEdit = !!item
  const qc = useQueryClient()

  const [formPeriod, setFormPeriod] = useState(period)
  const [empId, setEmpId] = useState<string>("")
  const [baseSalaryAdjust, setBaseSalaryAdjust] = useState("")
  const [allowanceAdjust, setAllowanceAdjust] = useState("")
  const [hoTro, setHoTro] = useState("")
  const [ghiChu, setGhiChu] = useState("")

  useEffect(() => {
    if (!open) return
    setFormPeriod(item?.period ?? period)
    setEmpId(item?.employee_id ? String(item.employee_id) : "")
    setBaseSalaryAdjust(formatMoneyInput(item?.luong_cb_dieu_chinh))
    setAllowanceAdjust(formatMoneyInput(item?.phu_cap_dieu_chinh))
    setHoTro(formatMoneyInput(item?.ho_tro))
    setGhiChu(item?.ghi_chu ?? "")
  }, [open, item, period])

  const employeeInitialOption = useMemo(() => {
    if (!item?.employee_id) return undefined
    return {
      value: item.employee_id,
      label: `${item.emp_code} - ${item.emp_name}`,
      raw: item,
    }
  }, [item])

  const employeeDataSource = useMemo(
    () => ({
      getList: (params: any) => listEmployees({ page: 1, size: 20, status: "1", ...params }),
      getById: getEmployee,
      params: { page: 1, size: 20, status: "1" },
    }),
    [],
  )

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const body: CreateAdjustmentRequest = {
        period: formPeriod,
        employee_id: Number(empId),
        luong_cb_dieu_chinh: baseSalaryAdjust.trim() ? parseNum(baseSalaryAdjust) : null,
        phu_cap_dieu_chinh: allowanceAdjust.trim() ? parseNum(allowanceAdjust) : null,
        ho_tro: hoTro.trim() ? parseNum(hoTro) : null,
        ghi_chu: ghiChu.trim() || undefined,
      }
      return isEdit ? updateAdjustment(item!.id, body) : createAdjustment(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật điều chỉnh" : "Đã tạo điều chỉnh")
      qc.invalidateQueries({ queryKey: ["salary-adjustments"] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canSubmit = Boolean(formPeriod && empId) && !isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>{isEdit ? "Sửa điều chỉnh lương" : "Thêm điều chỉnh lương"}</DialogTitle>
          <DialogDescription>
            Chốt lương cơ bản/phụ cấp cho kỳ này hoặc cộng thêm khoản hỗ trợ. Để trống field nào thì giữ nguyên từ hồ sơ nhân viên.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Field label="Kỳ lương">
            <SalaryPeriodStepper className="w-full" value={formPeriod} onChange={setFormPeriod} />
          </Field>

          <Field label="Nhân viên" required hint="Gõ mã hoặc tên nhân viên để tìm nhanh.">
            <AsyncSelect
              value={empId ? Number(empId) : undefined}
              onChange={(value: number | undefined) => setEmpId(value ? String(value) : "")}
              dataSource={employeeDataSource}
              mapOption={(x: any) => ({
                value: x.id,
                label: `${x.code} - ${x.name}`,
                raw: x,
              })}
              initialOption={employeeInitialOption}
              placeholder="Chọn nhân viên"
              searchPlaceholder="Tìm theo mã hoặc tên nhân viên..."
              emptyText="Không tìm thấy nhân viên"
              required
            />
          </Field>

          <Field label="Lương cơ bản chốt kỳ" hint="Nếu nhập, bảng lương kỳ này dùng số này thay lương cơ bản trong hồ sơ nhân viên.">
            <Input
              inputMode="decimal"
              value={baseSalaryAdjust}
              onChange={(e) => setBaseSalaryAdjust(e.target.value)}
              placeholder="Để trống nếu giữ nguyên hồ sơ"
            />
          </Field>

          <Field label="Phụ cấp chốt kỳ" hint="Nếu nhập, bảng lương kỳ này dùng số này thay phụ cấp trong hồ sơ nhân viên.">
            <Input
              inputMode="decimal"
              value={allowanceAdjust}
              onChange={(e) => setAllowanceAdjust(e.target.value)}
              placeholder="Để trống nếu giữ nguyên hồ sơ"
            />
          </Field>

          <Field label="Khoản hỗ trợ thêm" hint="Khoản cộng thêm ngoài công thức lương, chỉ áp dụng cho kỳ này.">
            <Input
              inputMode="decimal"
              value={hoTro}
              onChange={(e) => setHoTro(e.target.value)}
              placeholder="Ví dụ: 500000"
            />
          </Field>

          <Field label="Ghi chú / lý do">
            <Textarea
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              rows={4}
              placeholder="Nhập lý do điều chỉnh để kế toán/HR đối soát sau này..."
            />
          </Field>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => mutate()} disabled={!canSubmit}>
            {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm điều chỉnh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
