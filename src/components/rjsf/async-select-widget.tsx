import { AsyncSelect } from "./async-select"

export default function AsyncSelectWidget(props: any) {
    const { value, onChange, disabled, readonly, required } = props

    const raw = {
        ...(props.uiSchema?.["ui:options"] || {}),
        ...(props.options?.options || {}),
        ...(props.options || {}),
    }

    return (
        <AsyncSelect
            value={value}
            onChange={(nextValue: any) => onChange(nextValue)}
            disabled={disabled || readonly}
            required={required}
            initialOption={
                raw.initialOption ??
                (value ? { value, label: String(value) } : undefined)
            }
            {...raw}
        />
    )
}
