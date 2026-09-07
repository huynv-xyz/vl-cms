import { useEffect, useRef, useState } from "react"

import { Input } from "@/components/ui/input"

type DateFilterInputProps = {
    value?: string
    onChange: (value?: string) => void
    className?: string
    min?: string
    max?: string
    "aria-label"?: string
}

export function DateFilterInput({
    value,
    onChange,
    className,
    min,
    max,
    "aria-label": ariaLabel,
}: DateFilterInputProps) {
    const [draft, setDraft] = useState(value ?? "")
    const keyboardEditingRef = useRef(false)
    const committedValueRef = useRef(value ?? "")

    useEffect(() => {
        setDraft(value ?? "")
        committedValueRef.current = value ?? ""
    }, [value])

    const commit = (nextDraft = draft) => {
        const normalizedDraft = nextDraft || ""
        const nextValue = normalizedDraft || undefined
        if (normalizedDraft !== committedValueRef.current) {
            committedValueRef.current = normalizedDraft
            onChange(nextValue)
        }
    }

    return (
        <Input
            type="date"
            aria-label={ariaLabel}
            className={className}
            value={draft}
            min={min}
            max={max}
            onPointerDown={() => {
                keyboardEditingRef.current = false
            }}
            onChange={(event) => {
                const nextValue = event.target.value
                setDraft(nextValue)
                if (!keyboardEditingRef.current) {
                    commit(nextValue)
                }
            }}
            onKeyDown={(event) => {
                keyboardEditingRef.current = true
                if (event.key === "Enter") {
                    commit()
                    keyboardEditingRef.current = false
                    event.currentTarget.blur()
                }
                if (event.key === "Escape") {
                    setDraft(value ?? "")
                    keyboardEditingRef.current = false
                    event.currentTarget.blur()
                }
            }}
            onBlur={() => {
                commit()
                keyboardEditingRef.current = false
            }}
        />
    )
}
