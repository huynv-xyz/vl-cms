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
  const [luongCb, setLuongCb] = useState("")
  const [phuCap, setPhuCap] = useState("")
  const [hoTro, setHoTro] = useState("")
  const [ghiChu, setGhiChu] = useState("")

  useEffect(() => {
    if (!open) return
    setFormPeriod(item?.period ?? period)
    setEmpId(item?.employee_id ? String(item.employee_id) : "")
    setLuongCb(formatMoneyInput(item?.luong_cb_dieu_chinh))
    setPhuCap(formatMoneyInput(item?.phu_cap_dieu_chinh))
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
        luong_cb_dieu_chinh: luongCb.trim() ? parseNum(luongCb) : null,
        phu_cap_dieu_chinh: phuCap.trim() ? parseNum(phuCap) : null,
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
            Điều chỉnh thủ công theo kỳ lương đã chọn. Trường để trống ở lương/phụ cấp nghĩa là giữ nguyên kết quả tính tự động.
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

          <Field label="Lương cơ bản điều chỉnh" hint="Nhập khi cần override lương cơ bản trong kỳ. Bỏ trống = giữ theo dữ liệu nhân viên/công thức.">
            <Input
              inputMode="decimal"
              value={luongCb}
              onChange={(e) => setLuongCb(e.target.value)}
              placeholder="Ví dụ: 12000000"
            />
          </Field>

          <Field label="Phụ cấp điều chỉnh" hint="Nhập khi cần override phụ cấp cố định trong kỳ. Bỏ trống = giữ nguyên.">
            <Input
              inputMode="decimal"
              value={phuCap}
              onChange={(e) => setPhuCap(e.target.value)}
              placeholder="Ví dụ: 2000000"
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
