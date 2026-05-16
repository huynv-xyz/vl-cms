import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const getItems = (res: any) => res?.items ?? res?.data?.items ?? []

type Option = {
    value: string | number
    label: string
    raw?: any
}

export function AsyncMultiSelect({
    value = [],
    onChange,
    dataSource,
    mapOption = (x: any) => ({ value: x.id, label: x.name, raw: x }),
    placeholder = "Chọn dữ liệu",
    searchPlaceholder = "Tìm kiếm...",
    emptyText = "Không có dữ liệu",
    className,
}: any) {
    const selectedValues = React.useMemo<Set<string>>(
        () => new Set((value ?? []).map((item: any) => String(item))),
        [value]
    )
    const [open, setOpen] = React.useState(false)
    const [keyword, setKeyword] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [options, setOptions] = React.useState<Option[]>([])
    const [selectedOptions, setSelectedOptions] = React.useState<Option[]>([])
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    React.useEffect(() => {
        if (!open || !dataSource?.getList) return

        if (debounceRef.current) clearTimeout(debounceRef.current)

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await dataSource.getList({
                    ...(dataSource.params || {}),
                    keyword,
                })
                const mapped = getItems(res).map(mapOption)
                setOptions(mapped)
                setSelectedOptions((current) => mergeOptions(current, mapped, selectedValues))
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [keyword, open, dataSource, mapOption, selectedValues])

    React.useEffect(() => {
        let active = true

        const run = async () => {
            if (!dataSource?.getById || selectedValues.size === 0) {
                setSelectedOptions([])
                return
            }

            const missingValues = Array.from(selectedValues).filter(
                (item) => !selectedOptions.some((option) => String(option.value) === item)
            )

            if (!missingValues.length) return

            const fetched = await Promise.all(
                missingValues.map(async (id) => {
                    const res = await dataSource.getById(id)
                    return mapOption(res?.data ?? res)
                })
            )

            if (active) {
                setSelectedOptions((current) => mergeOptions(current, fetched, selectedValues))
            }
        }

        run()

        return () => {
            active = false
        }
    }, [value])

    const selected = selectedOptions.filter((option) =>
        selectedValues.has(String(option.value))
    )

    const toggle = (option: Option) => {
        const next = new Set(selectedValues)
        const key = String(option.value)

        if (next.has(key)) {
            next.delete(key)
        } else {
            next.add(key)
        }

        setSelectedOptions((current) => mergeOptions(current, [option], next))
        onChange?.(Array.from(next))
    }

    const clear = (event?: React.MouseEvent) => {
        event?.stopPropagation()
        onChange?.([])
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn("min-h-10 w-full justify-between", className)}
                >
                    <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                        {selected.length ? (
                            selected.length > 2 ? (
                                <Badge variant="secondary">Đã chọn {selected.length}</Badge>
                            ) : (
                                selected.map((option) => (
                                    <Badge
                                        key={option.value}
                                        variant="secondary"
                                        className="max-w-[150px] truncate"
                                    >
                                        {option.label}
                                    </Badge>
                                ))
                            )
                        ) : (
                            <span className="truncate text-muted-foreground">{placeholder}</span>
                        )}
                    </span>

                    <span className="ml-2 flex items-center gap-1">
                        {selected.length > 0 && (
                            <span
                                role="button"
                                tabIndex={0}
                                className="rounded p-0.5 hover:bg-muted"
                                onClick={clear}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") clear()
                                }}
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={keyword}
                        onValueChange={setKeyword}
                    />
                    <CommandList className="max-h-80 overflow-y-auto">
                        <CommandEmpty>{loading ? "Đang tải..." : emptyText}</CommandEmpty>

                        {options.map((option) => {
                            const checked = selectedValues.has(String(option.value))

                            return (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => toggle(option)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            checked ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </CommandItem>
                            )
                        })}

                        {selected.length > 0 && (
                            <CommandItem
                                onSelect={() => clear()}
                                className="justify-center text-center text-muted-foreground"
                            >
                                Xóa bộ lọc
                            </CommandItem>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function mergeOptions(
    current: Option[],
    incoming: Option[],
    selectedValues: Set<string>
) {
    const map = new Map<string, Option>()

    for (const option of current) {
        if (selectedValues.has(String(option.value))) {
            map.set(String(option.value), option)
        }
    }

    for (const option of incoming) {
        map.set(String(option.value), option)
    }

    return Array.from(map.values())
}
