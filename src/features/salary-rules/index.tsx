import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createBonusSplitRule,
  deleteBonusSplitRule,
  listBonusSplitRules,
  updateBonusSplitRule,
} from "@/api/salary/salary-rules"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Plus, Trash2 } from "lucide-react"

type FormState = Record<string, string>

const pct = (v?: number | string | null) => (v == null || v === "" ? "-" : `${(Number(v) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`)

function today() {
  return new Date().toISOString().slice(0, 10)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  )
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  )
}

function RuleDialog({
  title,
  open,
  children,
  onSubmit,
  onOpenChange,
}: {
  title: string
  open: boolean
  children: ReactNode
  onSubmit: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={onSubmit}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SalaryRulesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<FormState>({})
  const { data } = useQuery({ queryKey: ["salary-rules", "split"], queryFn: listBonusSplitRules })
  const rows = data?.items ?? []

  const save = useMutation({
    mutationFn: () => {
      const body = {
        code: form.code || (form.hasAsm === "1" ? "SPLIT_HAS_ASM" : "SPLIT_NO_ASM"),
        hasAsm: Number(form.hasAsm || 0),
        salesRate: Number(form.salesRate || 0) / 100,
        asmRate: Number(form.asmRate || 0) / 100,
        rmRate: Number(form.rmRate || 0) / 100,
        effectiveFrom: form.effectiveFrom || today(),
        effectiveTo: form.effectiveTo || null,
        status: 1,
        description: form.description,
      }
      return editing?.id ? updateBonusSplitRule(editing.id, body) : createBonusSplitRule(body)
    },
    onSuccess: () => {
      toast.success("Đã lưu quy tắc chia thưởng")
      setEditing(null)
      qc.invalidateQueries({ queryKey: ["salary-rules", "split"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: deleteBonusSplitRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salary-rules", "split"] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const open = (row?: any) => {
    setEditing(row ?? {})
    setForm({
      code: row?.code ?? "",
      hasAsm: String(row?.has_asm ?? 0),
      salesRate: String((row?.sales_rate ?? 0) * 100),
      asmRate: String((row?.asm_rate ?? 0) * 100),
      rmRate: String((row?.rm_rate ?? 0) * 100),
      effectiveFrom: row?.effective_from ?? today(),
      effectiveTo: row?.effective_to ?? "",
      description: row?.description ?? "",
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quy tắc chia thưởng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấu hình tỷ lệ phân bổ thưởng cho Sale, ASM và RM. Các quy tắc khác đã được đưa về đúng màn hình nghiệp vụ.
          </p>
        </div>
        <Button onClick={() => open()}><Plus className="mr-2 h-4 w-4" /> Thêm quy tắc</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Có ASM</TableHead>
              <TableHead className="text-right">Sale</TableHead>
              <TableHead className="text-right">ASM</TableHead>
              <TableHead className="text-right">RM</TableHead>
              <TableHead>Hiệu lực</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.code}</TableCell>
                <TableCell><Badge variant={row.has_asm ? "default" : "secondary"}>{row.has_asm ? "Có" : "Không"}</Badge></TableCell>
                <TableCell className="text-right">{pct(row.sales_rate)}</TableCell>
                <TableCell className="text-right">{pct(row.asm_rate)}</TableCell>
                <TableCell className="text-right">{pct(row.rm_rate)}</TableCell>
                <TableCell>{row.effective_from} → {row.effective_to || "..."}</TableCell>
                <TableCell><ActionButtons onEdit={() => open(row)} onDelete={() => remove.mutate(row.id)} /></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Chưa có quy tắc chia thưởng</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <RuleDialog title={editing?.id ? "Sửa quy tắc chia thưởng" : "Thêm quy tắc chia thưởng"} open={editing !== null} onSubmit={() => save.mutate()} onOpenChange={(v) => !v && setEditing(null)}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mã"><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Có ASM"><Select value={form.hasAsm ?? "0"} onValueChange={(v) => setForm({ ...form, hasAsm: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Không</SelectItem><SelectItem value="1">Có</SelectItem></SelectContent></Select></Field>
          <Field label="% Sale"><Input type="number" value={form.salesRate ?? "0"} onChange={(e) => setForm({ ...form, salesRate: e.target.value })} /></Field>
          <Field label="% ASM"><Input type="number" value={form.asmRate ?? "0"} onChange={(e) => setForm({ ...form, asmRate: e.target.value })} /></Field>
          <Field label="% RM"><Input type="number" value={form.rmRate ?? "0"} onChange={(e) => setForm({ ...form, rmRate: e.target.value })} /></Field>
          <Field label="Từ ngày"><Input type="date" value={form.effectiveFrom ?? ""} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></Field>
        </div>
        <Field label="Ghi chú"><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </RuleDialog>
    </div>
  )
}
