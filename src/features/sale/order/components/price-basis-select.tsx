import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PriceBasis } from "../data/order-money"

export function PriceBasisSelect({ value, allowLegacy = false, disabled, onChange }: {
    value: PriceBasis
    allowLegacy?: boolean
    disabled?: boolean
    onChange: (value: PriceBasis) => void
}) {
    return <Select value={value} disabled={disabled} onValueChange={(value) => onChange(value as PriceBasis)}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
            {(value === "LEGACY" || allowLegacy) && <SelectItem value="LEGACY">Giá cũ</SelectItem>}
            <SelectItem value="VAT_INCLUSIVE">Giá gồm VAT</SelectItem>
            <SelectItem value="VAT_EXCLUSIVE">Giá chưa VAT</SelectItem>
        </SelectContent>
    </Select>
}
