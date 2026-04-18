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
            onChange={onChange}
            disabled={disabled || readonly}
            required={required}
            {...raw}
        />
    )
}