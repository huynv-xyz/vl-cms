import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type QuantityInputCellProps = {
    productId: number
    value: number
    disabled: boolean
    max: number
    onCommit: (productId: number, quantity: number) => void
}

export function QuantityInputCell({
    productId,
    value,
    disabled,
    max,
    onCommit,
}: QuantityInputCellProps) {

    const [localValue, setLocalValue] = useState(String(value ?? 0))

    useEffect(() => {
        setLocalValue(String(value ?? 0))
    }, [value])

    const commitValue = () => {
        let nextValue = Number(localValue)

        if (Number.isNaN(nextValue) || nextValue < 0) {
            nextValue = 0
        }

        // Chỉ giới hạn theo số lượng còn phải giao, không kiểm tra tồn kho.
        if (nextValue > max) {
            nextValue = max
            toast.warning("Vượt số lượng còn phải giao")
        }

        setLocalValue(String(nextValue))
        onCommit(productId, nextValue)
    }

    return (
        <Input
            type="number"
            value={localValue}
            disabled={disabled}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commitValue}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur()
                }
            }}
        />
    )
}
