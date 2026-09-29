import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInclusiveUnitPrice, toPreVatInputPrice, type PriceBasis } from "../data/order-money"
import { PriceBasisSelect } from "./price-basis-select"

export type LinePricing = { price_basis: PriceBasis; unit_price_including_vat?: number; vat_code?: string }

export function OrderLinePriceFields({ pricing, unitPrice, quantity, disabled, onChange }: {
    pricing: LinePricing
    unitPrice: number
    quantity: number
    disabled?: boolean
    onChange: (pricing: LinePricing, price: number) => void
}) {
    const inclusive = getInclusiveUnitPrice({ ...pricing, unit_price: unitPrice })
    return <>
        <div>
            <label className="text-sm font-medium">Nguồn giá</label>
            <PriceBasisSelect value={pricing.price_basis} disabled={disabled} onChange={(price_basis) => onChange({
                ...pricing, price_basis, unit_price_including_vat: price_basis === "VAT_INCLUSIVE" ? inclusive : undefined,
            }, price_basis === "VAT_INCLUSIVE" ? toPreVatInputPrice(inclusive, pricing.vat_code) : unitPrice)} />
        </div>
        <div>
            <label className="text-sm font-medium">VAT</label>
            <Select value={pricing.vat_code || "NONE"} disabled={disabled || pricing.price_basis === "LEGACY"}
                onValueChange={(value) => {
                    const vat_code = value === "NONE" ? undefined : value
                    onChange({ ...pricing, vat_code }, pricing.price_basis === "VAT_INCLUSIVE" ? toPreVatInputPrice(inclusive, vat_code) : unitPrice)
                }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="NONE">-</SelectItem>
                    <SelectItem value="KCT">KCT</SelectItem>
                    <SelectItem value="VAT5">5%</SelectItem>
                    <SelectItem value="VAT8">8%</SelectItem>
                    <SelectItem value="VAT10">10%</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div>
            <label className="text-sm font-medium">Đơn giá chưa VAT</label>
            <Input type="number" min={0} step="0.001" value={pricing.price_basis === "VAT_INCLUSIVE"
                ? toPreVatInputPrice(inclusive, pricing.vat_code, quantity) : unitPrice} disabled={disabled}
                readOnly={pricing.price_basis === "VAT_INCLUSIVE"}
                onChange={(event) => onChange(pricing, Number(event.target.value || 0))} />
        </div>
        <div>
            <label className="text-sm font-medium">Đơn giá gồm VAT</label>
            <Input type="number" min={0} step="0.001" value={inclusive} disabled={disabled}
                readOnly={pricing.price_basis !== "VAT_INCLUSIVE"}
                onChange={(event) => {
                    const price = Number(event.target.value || 0)
                    onChange({ ...pricing, unit_price_including_vat: price }, toPreVatInputPrice(price, pricing.vat_code))
                }} />
        </div>
    </>
}
