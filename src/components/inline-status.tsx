import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { useInlineStatus } from "@/hooks/use-inline-status"

type Props<T> = {
    row: T
    value: string
    options: { value: string; label: string }[]

    queryKey: any[]
    mutationFn: (id: number, value: string) => Promise<any>
    getId: (row: T) => number

    disabled?: boolean
    width?: number
}

export function InlineStatus<T>({
    row,
    value,
    options,
    queryKey,
    mutationFn,
    getId,
    disabled,
    width = 140,
}: Props<T>) {

    const mutation = useInlineStatus<T>({
        queryKey,
        mutationFn,
        getId,
    })

    const isLocked = disabled || value === "DONE"

    return (
        <Select
            value={value}
            onValueChange={(v) =>
                mutation.mutate({
                    row,
                    value: v,
                })
            }
            disabled={mutation.isPending || isLocked}
        >
            <SelectTrigger style={{ width }}>
                <SelectValue>
                    {options.find(s => s.value === value)?.label}
                </SelectValue>
            </SelectTrigger>

            <SelectContent>
                {options.map((s) => (
                    <SelectItem
                        key={s.value}
                        value={s.value}
                        disabled={isLocked}
                    >
                        {s.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}