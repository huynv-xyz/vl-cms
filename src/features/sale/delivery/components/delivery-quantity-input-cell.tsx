import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type QuantityInputCellProps = {
    productId: number
    value: number
    disabled: boolean
    max: number
    stock: number
    onCommit: (productId: number, quantity: number) => void
}

export function QuantityInputCell({
    productId,
    value,
    disabled,
    max,
    stock,
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

        const limit = Math.min(max, stock)

        if (nextValue > limit) {
            nextValue = limit
            toast.warning("Vượt tồn kho hoặc số lượng đặt")
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