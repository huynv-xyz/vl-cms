import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

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
    onChange?: (value?: string) => void
    placeholder?: string
    className?: string
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Chọn ngày",
    className,
}: Props) {

    const date = value ? new Date(value) : undefined

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />

                    {date ? format(date, "dd/MM/yyyy") : placeholder}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) =>
                        onChange?.(
                            d ? format(d, "yyyy-MM-dd") : undefined
                        )
                    }
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}