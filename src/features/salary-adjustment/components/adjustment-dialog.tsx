import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createAdjustment, updateAdjustment, type CreateAdjustmentRequest } from "@/api/salary/salary-adjustment"
import type { SalaryAdjustmentItem } from "../data/schema"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  period: string
  item?: SalaryAdjustmentItem | null
}

function parseNum(v: string) {
  const n = Number(v.replace(/,/g, ""))
  return isNaN(n) ? null : n
}

export function AdjustmentDialog({ open, onOpenChange, period, item }: Props) {
  const isEdit = !!item
  const qc = useQueryClient()

  const [empId, setEmpId] = useState(String(item?.employee_id ?? ""))
  const [regionCode, setRegionCode] = useState(item?.region_code ?? "")
  const [luongCb, setLuongCb] = useState(item?.luong_cb_dieu_chinh != null ? String(item.luong_cb_dieu_chinh) : "")
  const [phuCap, setPhuCap] = useState(item?.phu_cap_dieu_chinh != null ? String(item.phu_cap_dieu_chinh) : "")
  const [hoTro, setHoTro] = useState(item?.ho_tro != null ? String(item.ho_tro) : "")
  const [ghiChu, setGhiChu] = useState(item?.ghi_chu ?? "")

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const body: CreateAdjustmentRequest = {
        period,
        employee_id: Number(empId),
        region_code: regionCode || undefined,
        luong_cb_dieu_chinh: luongCb ? parseNum(luongCb) : null,
        phu_cap_dieu_chinh: phuCap ? parseNum(phuCap) : null,
        ho_tro: hoTro ? parseNum(hoTro) : null,
        ghi_chu: ghiChu || undefined,
      }
      return isEdit ? updateAdjustment(item!.id, body) : createAdjustment(body)
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật" : "Đã tạo điều chỉnh")
      qc.invalidateQueries({ queryKey: ["salary-adjustments"] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa điều chỉnh lương" : "Thêm điều chỉnh lương"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>ID Nhân viên <span className="text-red-500">*</span></Label>
              <Input value={empId} onChange={e => setEmpId(e.target.value)} disabled={isEdit} placeholder="1234" />
            </div>
            <div className="space-y-1">
              <Label>Mã vùng</Label>
              <Input value={regionCode} onChange={e => setRegionCode(e.target.value)} placeholder="R01 (để trống = tất cả)" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Lương CB điều chỉnh</Label>
              <Input value={luongCb} onChange={e => setLuongCb(e.target.value)} placeholder="NULL = giữ nguyên" />
            </div>
            <div className="space-y-1">
              <Label>Phụ cấp điều chỉnh</Label>
              <Input value={phuCap} onChange={e => setPhuCap(e.target.value)} placeholder="NULL = giữ nguyên" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Khoản hỗ trợ thêm</Label>
            <Input value={hoTro} onChange={e => setHoTro(e.target.value)} placeholder="0 = không hỗ trợ" />
          </div>
          <div className="space-y-1">
            <Label>Ghi chú / Lý do</Label>
            <Textarea value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => mutate()} disabled={isPending || !empId}>
            {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
