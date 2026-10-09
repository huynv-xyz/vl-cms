import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, Loader2, MapPin, UserRoundCog } from "lucide-react"
import { toast } from "sonner"
import { apiPost } from "@/api/client"
import { getCustomer, listCustomers } from "@/api/customer"
import { getEmployee, listEmployees } from "@/api/employee"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import { getDeliveryStatusMeta } from "../../delivery/components/delivery-status"

type Address = { deliveryId: number; address: string | null }
type Request = { customerId: number; employeeId: number; addresses: Address[]; reason: string }
type Preview = {
  token: string
  orderAmount: number
  transferredDebt: number
  oldDebtBefore: number
  oldDebtAfter: number
  newDebtBefore: number
  newDebtAfter: number
  deliveries: number
  exports: number
  returns: number
  transactions: number
}

export function OrderCustomerTransferDialog({ open, order, onOpenChange }: {
  open: boolean
  order: any
  onOpenChange: (open: boolean) => void
}) {
  const client = useQueryClient()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<any>(null)
  const [employeeId, setEmployeeId] = useState<number | undefined>()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [checked, setChecked] = useState<{ preview: Preview; request: Request } | null>(null)

  useEffect(() => {
    if (!open) return
    setCustomer(null)
    setEmployeeId(undefined)
    setAddresses((order.deliveries ?? []).map((delivery: any) => ({ deliveryId: Number(delivery.id), address: delivery.delivery_address ?? null })))
    setReason("")
    setError("")
    setChecked(null)
  }, [open, order.id])

  const invalidate = () => { setChecked(null); setError("") }
  const changeAddress = (deliveryId: number, address: string) => {
    setAddresses((rows) => rows.map((row) => row.deliveryId === deliveryId ? { ...row, address } : row))
    invalidate()
  }
  const check = async () => {
    if (!customer?.id || !employeeId) return
    const request: Request = { customerId: Number(customer.id), employeeId, addresses, reason: reason.trim() }
    setBusy(true)
    invalidate()
    try {
      const preview = await apiPost<Preview>(`/sales/orders/${order.id}/customer-transfer/check`, request)
      setChecked({ preview, request })
    } catch (e: any) { setError(e?.response?.data?.message || e?.message || "Không thể kiểm tra chuyển khách hàng") }
    finally { setBusy(false) }
  }
  const apply = async () => {
    if (!checked) return
    setBusy(true)
    setError("")
    try {
      await apiPost(`/sales/orders/${order.id}/customer-transfer`, { ...checked.request, token: checked.preview.token })
      toast.success("Đã chuyển khách hàng và đồng bộ nhân viên, địa chỉ giao, công nợ, doanh số")
      onOpenChange(false)
      await navigate({ to: "/sales/orders", search: {
        page: 1, size: 20, keyword: "", status: undefined, export_progress: undefined,
        customer_id: undefined, employee_id: undefined, from_date: undefined, to_date: undefined, order_date_sort: "desc",
      } })
      await client.invalidateQueries()
    } catch (e: any) {
      setChecked(null)
      setError(e?.response?.data?.message || e?.message || "Không thể chuyển khách hàng; vui lòng kiểm tra lại")
    } finally { setBusy(false) }
  }

  return <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value) }}>
    <DialogContent className="flex max-h-[90dvh] w-[min(96vw,920px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[920px]">
      <DialogHeader className="border-b px-5 py-4">
        <DialogTitle className="flex flex-wrap items-center gap-2">Chuyển khách hàng <span className="text-primary">{order.order_no}</span></DialogTitle>
      </DialogHeader>
      <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-4">
        <div className="grid gap-4 border-b pb-4 text-sm sm:grid-cols-2">
          <div><div className="text-muted-foreground">Khách hàng hiện tại</div><div className="font-medium">{order.customer?.code} - {order.customer?.name}</div></div>
          <div><div className="text-muted-foreground">Nhân viên hiện tại</div><div className="font-medium">{order.employee?.name ?? "-"}</div></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Khách hàng mới</label>
            <AsyncSelect value={customer?.id} disabled={busy} placeholder="Chọn khách hàng"
              onChange={(_value: any, option: any) => {
                setCustomer(option?.raw ?? null)
                setEmployeeId(option?.raw?.employee_id ?? option?.raw?.employee?.id ?? undefined)
                invalidate()
              }}
              dataSource={{ getList: (params: any) => listCustomers({ ...params, status: "1" }), getById: getCustomer }}
              mapOption={(row: any) => ({ value: row.id, label: `${row.code} - ${row.name}`, raw: row })}
              optionWrapLabel popoverContentClassName="w-[480px] max-w-[calc(100vw-2rem)]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nhân viên bán mới</label>
            <AsyncSelect value={employeeId} disabled={busy} placeholder="Chọn nhân viên"
              onChange={(value: any) => { setEmployeeId(value ? Number(value) : undefined); invalidate() }}
              dataSource={{ getList: (params: any) => listEmployees({ ...params, status: "1" }), getById: getEmployee }}
              mapOption={(row: any) => ({ value: row.id, label: `${row.code} - ${row.name}`, raw: row })} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold">Địa chỉ các phiếu giao</div>
          {addresses.length === 0 ? <div className="text-sm text-muted-foreground">Chưa có phiếu giao</div> :
            <div className="overflow-x-auto border">
              <table className="block w-full table-fixed text-sm sm:table">
                <thead className="hidden bg-muted/40 text-left sm:table-header-group"><tr><th className="w-[140px] px-3 py-2 font-medium">Phiếu giao</th><th className="w-[100px] px-3 py-2 font-medium">Trạng thái</th><th className="px-3 py-2 font-medium">Địa chỉ sau sửa</th></tr></thead>
                <tbody className="block sm:table-row-group">{addresses.map((row) => {
                  const delivery = (order.deliveries ?? []).find((entry: any) => Number(entry.id) === row.deliveryId)
                  return <tr key={row.deliveryId} className="block border-t align-top sm:table-row">
                    <td className="inline-block w-3/5 break-words px-3 pt-3 font-medium sm:table-cell sm:w-auto sm:py-3 sm:font-normal">{delivery?.delivery_no ?? `#${row.deliveryId}`}</td>
                    <td className="inline-block w-2/5 px-3 pt-3 sm:table-cell sm:w-auto sm:py-3">{getDeliveryStatusMeta(delivery?.status).label}</td>
                    <td className="block w-full space-y-2 px-3 py-3 sm:table-cell sm:w-auto">
                      <div className="break-words text-xs text-muted-foreground">Hiện tại: {delivery?.delivery_address || "-"}</div>
                      <Textarea aria-label={`Địa chỉ phiếu ${delivery?.delivery_no ?? row.deliveryId}`} rows={2} maxLength={1000} value={row.address ?? ""} disabled={busy} onChange={(event) => changeAddress(row.deliveryId, event.target.value)} />
                      {customer?.address && <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-0 text-xs" disabled={busy} onClick={() => changeAddress(row.deliveryId, customer.address)}><MapPin className="size-3.5" />Lấy địa chỉ khách mới</Button>}
                    </td>
                  </tr>
                })}</tbody>
              </table>
            </div>}
        </div>
        <label className="block space-y-1.5 text-sm font-medium"><span>Lý do sửa sai</span><Input maxLength={500} value={reason} disabled={busy} onChange={(event) => { setReason(event.target.value); invalidate() }} /></label>
        {checked && <div className="space-y-3 border-t pt-4 text-sm">
          <div className="font-semibold">Kết quả kiểm tra</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><div className="text-muted-foreground">Giá trị đơn</div><strong>{formatCurrency(checked.preview.orderAmount)}</strong></div>
            <div><div className="text-muted-foreground">Công nợ chuyển sang khách mới</div><strong>{formatCurrency(checked.preview.transferredDebt)}</strong></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Debt label="Số dư sổ công nợ khách hiện tại" before={checked.preview.oldDebtBefore} after={checked.preview.oldDebtAfter} />
            <Debt label="Số dư sổ công nợ khách mới" before={checked.preview.newDebtBefore} after={checked.preview.newDebtAfter} />
          </div>
          <div className="text-muted-foreground">{checked.preview.deliveries} phiếu giao, {checked.preview.exports} phiếu xuất, {checked.preview.returns} phiếu trả, {checked.preview.transactions} giao dịch.</div>
        </div>}
        {error && <div role="alert" className="break-words text-sm text-destructive">{error}</div>}
      </div>
      <DialogFooter className="gap-2 border-t px-5 py-4 sm:gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Đóng</Button>
        <Button type="button" variant="outline" disabled={busy || !customer?.id || Number(customer.id) === Number(order.customer_id) || !employeeId || !reason.trim()} onClick={check}>{busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}Kiểm tra</Button>
        <Button type="button" disabled={busy || !checked} onClick={apply}><UserRoundCog className="mr-1.5 size-4" />Xác nhận chuyển</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

function Debt({ label, before, after }: { label: string; before: number; after: number }) {
  return <div><div className="text-muted-foreground">{label}</div><div className="mt-1 flex flex-wrap items-center gap-2 font-medium"><span>{formatCurrency(before)}</span><ArrowRight className="size-3.5 text-muted-foreground" /><span>{formatCurrency(after)}</span></div></div>
}
