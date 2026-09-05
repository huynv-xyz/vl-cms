import { useEffect, useState } from "react"

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

    useEffect(() => {
        setDraft(value ?? "")
    }, [value])

    const commit = () => {
        const nextValue = draft || undefined
        if (nextValue !== value) {
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
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    commit()
                    event.currentTarget.blur()
                }
                if (event.key === "Escape") {
                    setDraft(value ?? "")
                    event.currentTarget.blur()
                }
            }}
        />
    )
}
