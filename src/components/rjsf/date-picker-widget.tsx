import type { WidgetProps } from "@rjsf/utils"

import { DatePicker } from "@/components/date-picker"

export function DatePickerWidget(props: WidgetProps) {
    const options = props.options ?? {}

    return (
        <DatePicker
            value={props.value || undefined}
            onChange={(value) => props.onChange(value || undefined)}
            placeholder={String(options.placeholder || props.placeholder || "Chọn ngày")}
        />
    )
}
