import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"

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

    const updateValue = (rawValue: string) => {
        if (rawValue.includes(",")) return
        if (!/^\d*\.?\d*$/.test(rawValue)) return
        setLocalValue(rawValue)
    }

    const commitValue = () => {
        let nextValue = Number(localValue || 0)

        if (Number.isNaN(nextValue) || nextValue < 0) {
            nextValue = 0
        }
        setLocalValue(String(nextValue))
        onCommit(productId, nextValue)
    }

    return (
        <Input
            type="text"
            inputMode="decimal"
            value={localValue}
            disabled={disabled}
            onChange={(e) => updateValue(e.target.value)}
            onBlur={commitValue}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur()
                }
            }}
        />
    )
}
