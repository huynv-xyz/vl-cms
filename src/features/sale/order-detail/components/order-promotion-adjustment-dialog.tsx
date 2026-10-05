import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import Decimal from "decimal.js-light"

import { apiPost } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { getInclusiveUnitPrice, getPriceBasis, toPreVatInputPrice, type PriceBasis } from "../../order/data/order-money"
import { PriceBasisSelect } from "../../order/components/price-basis-select"

type Preview = {
  token: string
  beforeTotal: number
  afterTotal: number
  arBefore: number
  arAfter: number
  exports: number
  returns: number
  transactions: number
}

export function OrderPromotionAdjustmentDialog({
  open,
  onOpenChange,
  order,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  item: any
}) {
  const client = useQueryClient()
  const targetPromotion = item?.line_type !== "PROMOTION"
  const originalBasis = item ? getPriceBasis(item) : "LEGACY"
  const [price, setPrice] = useState("")
  const [priceBasis, setPriceBasis] = useState<PriceBasis>(originalBasis)
  const [vatCode, setVatCode] = useState("NONE")
  const [reason, setReason] = useState("")
  const [checked, setChecked] = useState<{ preview: Preview; request: object } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setPrice("")
    setPriceBasis(originalBasis)
    setVatCode(item?.vat_code ?? "NONE")
    setReason("")
    setChecked(null)
    setError("")
  }, [open, item?.id])

  const change = (setter: (value: string) => void, value: string) => {
    setter(value)
    setChecked(null)
    setError("")
  }

  const check = async () => {
    if (!item) return
    const request = {
      itemId: item.id,
      promotion: targetPromotion,
      price: targetPromotion ? "0" : price.trim(),
      priceBasis: targetPromotion ? undefined : priceBasis,
      vatCode: targetPromotion ? undefined : vatCode,
      reason: reason.trim(),
    }
    setBusy(true)
    setError("")
    setChecked(null)
    try {
      const preview = await apiPost<Preview>(`/sales/orders/${order.id}/promotion-adjustment/check`, request)
      setChecked({ preview, request })
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Không thể kiểm tra thay đổi")
    } finally {
      setBusy(false)
    }
  }

  const apply = async () => {
    if (!checked) return
    setBusy(true)
    setError("")
    try {
      await apiPost(`/sales/orders/${order.id}/promotion-adjustment`, {
        ...checked.request,
        token: checked.preview.token,
      })
      await client.invalidateQueries()
      toast.success("Đã cập nhật khuyến mãi và đồng bộ công nợ, giao dịch bán hàng")
      onOpenChange(false)
    } catch (e: any) {
      setChecked(null)
      setError(e?.response?.data?.message || e?.message || "Không thể cập nhật; vui lòng kiểm tra lại")
    } finally {
      setBusy(false)
    }
  }

  const validPrice = targetPromotion || (price.trim() !== "" && Number.isFinite(Number(price)) && Number(price) > 0)
  const selectedVat = vatCode === "NONE" ? undefined : vatCode
  const inclusivePrice = price.trim() === "" ? "" : priceBasis === "VAT_INCLUSIVE"
    ? price
    : String(getInclusiveUnitPrice({ price_basis: priceBasis, unit_price: Number(price), vat_code: selectedVat }))
  const preVatPrice = price.trim() === "" ? "" : priceBasis === "VAT_INCLUSIVE"
    ? String(toPreVatInputPrice(Number(price), selectedVat, Number(item?.quantity)))
    : price
  const changeBasis = (next: PriceBasis) => {
    if (next === priceBasis) return
    const nextPrice = next === "VAT_INCLUSIVE" || next === "LEGACY" ? inclusivePrice : preVatPrice
    change(setPrice, nextPrice === "" ? "" : next === "VAT_INCLUSIVE"
      ? new Decimal(nextPrice).toDecimalPlaces(6).toString() : nextPrice)
    setPriceBasis(next)
    if (next === "LEGACY") setVatCode("NONE")
  }
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value) }}>
      <DialogContent className="max-h-[90dvh] w-[min(96vw,620px)] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Sửa khuyến mãi</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-1">
          <div className="border-b pb-4">
            <div className="font-medium">{item?.product?.name ?? "Sản phẩm"}</div>
            <div className="text-sm text-muted-foreground">{item?.product?.code ?? "-"} · SL {item?.quantity}</div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Hiện tại</div>
              <div className="font-medium">{targetPromotion ? "Hàng bán" : "Hàng khuyến mãi"}</div>
            </div>
            <span aria-hidden="true" className="text-muted-foreground">→</span>
            <div>
              <div className="text-muted-foreground">Sau khi sửa</div>
              <div className="font-medium">{targetPromotion ? "Hàng khuyến mãi" : "Hàng bán"}</div>
            </div>
          </div>
          {!targetPromotion && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-sm font-medium">
                  <span>Nguồn giá</span>
                  <PriceBasisSelect value={priceBasis} allowLegacy={originalBasis === "LEGACY"} disabled={busy} onChange={changeBasis} />
                </div>
                <div className="space-y-1.5 text-sm font-medium">
                  <label htmlFor="promotion-adjustment-vat">VAT</label>
                  <Select value={vatCode} onValueChange={(value) => change(setVatCode, value)} disabled={busy || priceBasis === "LEGACY"}>
                    <SelectTrigger id="promotion-adjustment-vat"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">-</SelectItem>
                      <SelectItem value="KCT">KCT</SelectItem>
                      <SelectItem value="VAT5">5%</SelectItem>
                      <SelectItem value="VAT8">8%</SelectItem>
                      <SelectItem value="VAT10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>{priceBasis === "LEGACY" ? "Đơn giá" : "Đơn giá chưa VAT"}</span>
                  <Input type="number" min="0.000001" step="0.000001" value={preVatPrice} onChange={(event) => change(setPrice, event.target.value)} inputMode="decimal" readOnly={priceBasis === "VAT_INCLUSIVE"} disabled={busy} />
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  <span>Đơn giá gồm VAT</span>
                  <Input type="number" min="0.000001" step="0.000001" value={inclusivePrice} onChange={(event) => change(setPrice, event.target.value)} inputMode="decimal" readOnly={priceBasis !== "VAT_INCLUSIVE"} disabled={busy} />
                </label>
              </div>
            </div>
          )}
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Lý do sửa sai</span>
            <Input value={reason} onChange={(event) => change(setReason, event.target.value)} maxLength={500} disabled={busy} />
          </label>
          {checked && (
            <div className="space-y-3 border-t pt-4 text-sm">
              <div className="font-semibold">Kết quả kiểm tra</div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                <div><div className="text-muted-foreground">Giá trị đơn trước</div><strong>{formatCurrency(checked.preview.beforeTotal)}</strong></div>
                <div><div className="text-muted-foreground">Giá trị đơn sau</div><strong>{formatCurrency(checked.preview.afterTotal)}</strong></div>
                <div><div className="text-muted-foreground">Công nợ xuất/trả trước</div><strong>{formatCurrency(checked.preview.arBefore)}</strong></div>
                <div><div className="text-muted-foreground">Công nợ xuất/trả sau</div><strong>{formatCurrency(checked.preview.arAfter)}</strong></div>
              </div>
              <div className="text-muted-foreground">
                Ảnh hưởng {checked.preview.exports} dòng xuất, {checked.preview.returns} dòng trả, {checked.preview.transactions} giao dịch bán/trả.
              </div>
            </div>
          )}
          {error && <div role="alert" className="text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Đóng</Button>
          <Button type="button" variant="outline" onClick={check} disabled={busy || !reason.trim() || !validPrice}>
            {busy && <Loader2 className="mr-1.5 size-4 animate-spin" />}Kiểm tra
          </Button>
          <Button type="button" onClick={apply} disabled={busy || !checked}>Xác nhận sửa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
