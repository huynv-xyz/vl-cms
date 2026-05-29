import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const getItems = (res: any) => res?.items ?? res?.data?.items ?? []

export const AsyncSelect = React.memo(function AsyncSelect({
    value,
    onChange,
    dataSource,
    mapOption = (x: any) => ({ value: x.id, label: x.name, raw: x }),
    initialOption,
    placeholder = "Chọn dữ liệu",
    searchPlaceholder = "Tìm kiếm...",
    emptyText = "Không có dữ liệu",
    clearText = "Bỏ chọn",
    disabled,
    required,
    className,
    popoverContentClassName,
    optionWrapLabel = false,
    wrapLabel = false,
}: any) {
    const [open, setOpen] = React.useState(false)
    const [keyword, setKeyword] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [options, setOptions] = React.useState<any[]>([])
    const [selected, setSelected] = React.useState<any>(null)

    const cacheRef = React.useRef<Map<string, any[]>>(new Map())
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const dataSourceParamsKey = JSON.stringify(dataSource?.params ?? {})

    React.useEffect(() => {
        if (!open || !dataSource?.getList) return

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(async () => {
            const cacheKey = `${dataSourceParamsKey}::${keyword}`

            if (cacheRef.current.has(cacheKey)) {
                setOptions(cacheRef.current.get(cacheKey)!)
                return
            }

            setLoading(true)
            try {
                const res = await dataSource.getList({
                    ...(dataSource.params || {}),
                    keyword,
                })

                const mapped = getItems(res).map(mapOption)
                cacheRef.current.set(cacheKey, mapped)
                setOptions(mapped)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [keyword, open, dataSource, dataSourceParamsKey, mapOption])

    const fetchedRef = React.useRef<any>(null)

    React.useEffect(() => {
        let active = true

        const run = async () => {
            if (value == null) {
                setSelected(null)
                return
            }

            if (initialOption && String(initialOption.value) === String(value)) {
                setSelected(initialOption)
                return
            }

            if (dataSource?.getById) {
                const res = await dataSource.getById(value)
                const item = res?.data ?? res

                if (item && active) {
                    setSelected(mapOption(item))
                }
            }
        }

        run()

        return () => {
            active = false
        }
    }, [value])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "min-w-0 w-full justify-between",
                        wrapLabel && "h-auto min-h-10 items-start py-2",
                        className,
                    )}
                    disabled={disabled}
                >
                    <span
                        className={cn(
                            "min-w-0 flex-1 text-left",
                            wrapLabel ? "whitespace-normal break-words leading-snug" : "truncate",
                        )}
                    >
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className={cn(
                    "w-[var(--radix-popover-trigger-width)] max-h-[calc(var(--radix-popover-content-available-height)-8px)] overflow-hidden p-0",
                    popoverContentClassName,
                )}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={keyword}
                        onValueChange={setKeyword}
                    />

                    <CommandList className="max-h-[calc(var(--radix-popover-content-available-height)-3.5rem)] overflow-y-auto">
                        <CommandEmpty>
                            {loading ? "Đang tải..." : emptyText}
                        </CommandEmpty>

                        {!required && (
                            <CommandItem
                                onSelect={() => {
                                    setSelected(null)
                                    onChange(undefined, null)
                                    setOpen(false)
                                }}
                            >
                                <span className="text-muted-foreground">
                                    {clearText}
                                </span>
                            </CommandItem>
                        )}

                        {options.map((item) => (
                            <CommandItem
                                key={item.value}
                                className="min-w-0"
                                onSelect={() => {
                                    setSelected(item)
                                    onChange(item.value, item)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        String(value) === String(item.value)
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "min-w-0",
                                        optionWrapLabel || wrapLabel
                                            ? "whitespace-normal break-words leading-snug"
                                            : "truncate",
                                    )}
                                >
                                    {item.label}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
})
