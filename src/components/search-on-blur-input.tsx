import { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

type SearchOnBlurInputProps = {
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    wrapperClassName?: string
}

export function SearchOnBlurInput({
    value = "",
    onChange,
    placeholder = "Tìm kiếm...",
    className,
    wrapperClassName,
}: SearchOnBlurInputProps) {
    const [draft, setDraft] = useState(value)

    useEffect(() => {
        setDraft(value)
    }, [value])

    const commit = () => {
        if (draft !== value) {
            onChange(draft)
        }
    }

    return (
        <div className={wrapperClassName}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        commit()
                        event.currentTarget.blur()
                    }
                }}
                placeholder={placeholder}
                className={className}
            />
        </div>
    )
}
