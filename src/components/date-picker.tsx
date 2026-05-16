import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type Props = {
    value?: string
    onChange: (v?: string) => void
    placeholder?: string
    className?: string
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Chọn ngày",
    className,
}: Props) {
    const date = parseDateValue(value)

    return (
        <Popover>
            <div className={cn("relative", className)}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            "w-full",
                            "flex items-center justify-between gap-2",
                            "whitespace-nowrap overflow-hidden pr-8", // 🔥 chừa chỗ cho X
                            !date && "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <CalendarIcon className="h-4 w-4 shrink-0" />

                            <span className="truncate">
                                {date
                                    ? format(date, "dd/MM/yyyy")
                                    : placeholder}
                            </span>
                        </div>
                    </Button>
                </PopoverTrigger>

                {/* CLEAR BUTTON (NẰM NGOÀI TRIGGER) */}
                {value && (
                    <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange(undefined)
                        }}
                    >
                        <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                )}
            </div>

            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        if (!d) return
                        onChange(format(d, "yyyy-MM-dd"))
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}

function parseDateValue(value?: string) {
    if (!value) return undefined

    const normalized = normalizeDateValue(value)
    if (normalized) {
        const parsed = new Date(normalized)
        return Number.isNaN(parsed.getTime()) ? undefined : parsed
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function normalizeDateValue(value: string) {
    const [datePart] = value.trim().split("T")
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart

    const match = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (!match) return ""

    const [, day, month, year] = match
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
