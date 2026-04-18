export function parseMultiValue(value?: string) {
    if (!value) return []
    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

export function stringifyMultiValue(values?: string[]) {
    if (!values || values.length === 0) return undefined
    return values.join(',')
}