type FilterOption = {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
}

export function createMultiFilter(params: {
    columnId: string
    title: string
    values?: string[]
    options: FilterOption[]
    onChange: (values: string[]) => void
}) {
    return {
        columnId: params.columnId,
        title: params.title,
        values: params.values ?? [],
        options: params.options,
        onChange: params.onChange,
    }
}