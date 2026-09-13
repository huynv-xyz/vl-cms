import type { WidgetProps } from "@rjsf/utils"

import { DateFilterInput } from "@/components/date-filter-input"
import { cn } from "@/lib/utils"

export function DateFilterWidget(props: WidgetProps) {
    const options = props.options ?? {}

    return (
        <DateFilterInput
            value={props.value || undefined}
            onChange={(value) => props.onChange(value || undefined)}
            min={typeof options.min === "string" ? options.min : undefined}
            max={typeof options.max === "string" ? options.max : undefined}
            aria-label={String(options["aria-label"] || props.label || props.placeholder || "Chọn ngày")}
            className={cn(
                "h-10 rounded-md border-slate-300 bg-white shadow-xs",
                typeof options.className === "string" ? options.className : undefined
            )}
        />
    )
}
