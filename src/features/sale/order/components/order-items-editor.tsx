import type React from "react"
import { Fragment, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listGoodsDescriptions } from "@/api/sale/goods-description"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import { Check, ChevronsUpDown, PackageOpen, Trash2 } from "lucide-react"

type OrderItem = {
    id?: number
    product_id?: number
    product?: any
    quantity: number
    unit_price: number
    unit?: string
    discount?: number
    line_type?: string
    hdn_status?: string
    description?: string
    note?: string
}

type Props = {
    items: OrderItem[]
    setItems: (items: OrderItem[]) => void
    addRequest?: number
}

export function OrderItemsEditor({ items, setItems, addRequest = 0 }: Props) {
    const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])
    const pendingFocusIndexRef = useRef<number | null>(null)
    const lastAddRequestRef = useRef(addRequest)

    const createEmptyRow = (): OrderItem => ({
        product_id: undefined,
        quantity: 1,
        unit_price: 0,
        line_type: "NORMAL",
        hdn_status: undefined,
        note: "",
    })

    const focusRowCodeSelect = (index: number) => {
        window.requestAnimationFrame(() => {
            const row = rowRefs.current[index]
            row?.scrollIntoView({ behavior: "smooth", block: "nearest" })
            const trigger = row?.querySelector<HTMLButtonElement>("[data-product-code-trigger] button")
            trigger?.focus()
        })
    }

    useEffect(() => {
        const index = pendingFocusIndexRef.current
        if (index == null) return

        pendingFocusIndexRef.current = null
        focusRowCodeSelect(index)
    }, [items.length])

    useEffect(() => {
        if (addRequest === lastAddRequestRef.current) return

        lastAddRequestRef.current = addRequest
        addRow()
    }, [addRequest])

    const addRow = () => {
        const lastIndex = items.length - 1
        const lastRow = items[lastIndex]

        if (lastRow && !lastRow.product_id) {
            focusRowCodeSelect(lastIndex)
            return
        }

        pendingFocusIndexRef.current = items.length
        setItems([...items, createEmptyRow()])
    }

    const addRowOnEnter = (event: React.KeyboardEvent, index?: number) => {
        if (event.key !== "Enter") return
        if (index !== undefined && index !== items.length - 1) return

        event.preventDefault()
        addRow()
    }

    const removeRow = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, patch: Partial<OrderItem>) => {
        const newItems = [...items]
        newItems[index] = {
            ...newItems[index],
            ...patch,
        }
        setItems(newItems)
    }

    const selectProduct = (index: number, value: number | undefined, option: any) => {
        const isPromotion = items[index]?.line_type === "PROMOTION"

        updateRow(index, {
            product_id: value,
            product: option?.raw,
            unit_price: isPromotion ? 0 : option?.raw?.price ?? 0,
            unit: option?.raw?.unit,
        })
    }

    const createProductRow = (product: any): OrderItem => ({
        product_id: product.id,
        product,
        quantity: 1,
        unit_price: product.price ?? 0,
        unit: product.unit,
        discount: 0,
        line_type: "NORMAL",
        hdn_status: undefined,
        description: "",
        note: "",
    })

    const appendProducts = (products: any[]) => {
        if (!products.length) return

        const productRows = products.map(createProductRow)
        const newItems = [...items]
        const lastIndex = newItems.length - 1
        const firstNewIndex = lastIndex >= 0 && !newItems[lastIndex]?.product_id ? lastIndex : newItems.length

        if (lastIndex >= 0 && !newItems[lastIndex]?.product_id) {
            newItems.splice(lastIndex, 1, ...productRows)
        } else {
            newItems.push(...productRows)
        }

        pendingFocusIndexRef.current = firstNewIndex
        setItems(newItems)

        if (newItems.length === items.length) {
            focusRowCodeSelect(firstNewIndex)
        }
    }

    return (
        <div
            className="space-y-2"
            onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.altKey || event.metaKey)) {
                    event.preventDefault()
                    addRow()
                }
            }}
        >
            <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[2000px] table-fixed text-sm">
                    <colgroup>
                        <col className="w-11" />
                        <col className="w-[280px]" />
                        <col className="w-[500px]" />
                        <col className="w-[50px]" />
                        <col className="w-[90px]" />
                        <col className="w-[130px]" />
                        <col className="w-[95px]" />
                        <col className="w-[260px]" />
                        <col className="w-[70px]" />
                        <col className="w-[95px]" />
                        <col className="w-[260px]" />
                        <col className="w-[130px]" />
                        <col className="w-[42px]" />
                    </colgroup>
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-2 py-2 text-center font-semibold">#</th>
                            <th className="px-2 py-2 text-left font-semibold">Mã sản phẩm</th>
                            <th className="px-2 py-2 text-left font-semibold">Tên sản phẩm</th>
                            <th className="px-2 py-2 text-center font-semibold">ĐVT</th>
                            <th className="px-2 py-2 text-right font-semibold">Số lượng</th>
                            <th className="px-2 py-2 text-right font-semibold">Đơn giá</th>
                            <th className="px-2 py-2 text-right font-semibold">Chiết khấu</th>
                            <th className="px-2 py-2 text-left font-semibold">Mô tả HH</th>
                            <th className="px-2 py-2 text-center font-semibold">Hàng KM</th>
                            <th className="px-2 py-2 text-center font-semibold">Không tính HĐN</th>
                            <th className="px-2 py-2 text-left font-semibold">Ghi chú</th>
                            <th className="px-2 py-2 text-right font-semibold">Thành tiền</th>
                            <th className="px-2 py-2" />
                        </tr>
                    </thead>

                    <tbody className="bg-background">
                        {items.map((row, i) => {
                            const isPromotion = row.line_type === "PROMOTION"
                            const lineTotal = Math.max(
                                isPromotion
                                    ? 0
                                    : (row.quantity || 0) * (row.unit_price || 0) - Number(row.discount || 0),
                                0
                            )
                            const isInvalid = !row.product_id || (row.quantity ?? 0) <= 0

                            return (
                                <Fragment key={i}>
                                    <tr
                                        ref={(node) => {
                                            rowRefs.current[i] = node
                                        }}
                                        className={cn(
                                            "border-t-4 border-t-slate-300 bg-white transition-colors hover:bg-slate-50",
                                            i > 0 && "shadow-[inset_0_1px_0_rgba(15,23,42,0.08)]",
                                            isInvalid && "bg-amber-50/30 dark:bg-amber-950/10"
                                        )}
                                    >
                                    <td className="text-muted-foreground px-2 py-2 text-center align-middle font-mono text-xs font-semibold tabular-nums">
                                        {i + 1}
                                    </td>

                                    <td className="min-w-0 px-2 py-2 align-middle" data-product-code-trigger>
                                        <ProductSelect
                                            mode="code"
                                            value={row.product_id}
                                            onChange={(value, option) => selectProduct(i, value, option)}
                                            onApplyMany={appendProducts}
                                            placeholder="Chọn mã"
                                            searchPlaceholder="Tìm theo mã sản phẩm..."
                                            popoverContentClassName="w-[420px] max-w-[calc(100vw-2rem)]"
                                            commandListClassName="max-h-[390px]"
                                        />
                                    </td>

                                    <td className="min-w-0 px-2 py-2 align-middle">
                                        <ProductSelect
                                            mode="name"
                                            value={row.product_id}
                                            onChange={(value, option) => selectProduct(i, value, option)}
                                            onApplyMany={appendProducts}
                                            placeholder="Chọn tên sản phẩm"
                                            searchPlaceholder="Tìm theo tên sản phẩm..."
                                            popoverContentClassName="w-[720px] max-w-[calc(100vw-2rem)]"
                                            commandListClassName="max-h-[450px]"
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-center align-middle text-sm font-medium text-slate-700">
                                        {row.product?.unit || row.unit || "-"}
                                    </td>
                                    <td className="px-2 py-2 align-middle">
                                        <DecimalInput
                                            value={row.quantity}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(quantity) => updateRow(i, { quantity })}
                                        />
                                    </td>

                                    <td className="px-2 py-2 align-middle">
                                        <DecimalInput
                                            value={row.unit_price}
                                            disabled={isPromotion}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(unit_price) => updateRow(i, { unit_price })}
                                        />
                                    </td>
                                    <td className="px-2 py-2 align-middle">
                                        <DecimalInput
                                            value={row.discount ?? 0}
                                            disabled={isPromotion}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(discount) => updateRow(i, { discount })}
                                        />
                                    </td>

                                    <td className="min-w-0 px-2 py-2 align-middle">
                                        <AsyncSelect
                                            value={row.description}
                                            onChange={(value: any) => {
                                                updateRow(i, {
                                                    description: value,
                                                })
                                            }}
                                            dataSource={{
                                                getList: listGoodsDescriptions,
                                                params: { page: 1, size: 20, active: 1 },
                                            }}
                                            mapOption={(x: any) => ({
                                                value: x.name,
                                                label: x.name,
                                                raw: x,
                                            })}
                                            initialOption={
                                                row.description
                                                    ? {
                                                        value: row.description,
                                                        label: row.description,
                                                        raw: { name: row.description },
                                                    }
                                                    : undefined
                                            }
                                            placeholder="Chọn mô tả"
                                            searchPlaceholder="Tìm mô tả HH..."
                                            emptyText="Không có mô tả phù hợp"
                                            className="min-w-0"
                                            popoverContentClassName="w-[360px] max-w-[calc(100vw-2rem)]"
                                            commandListClassName="max-h-[360px]"
                                        />
                                    </td>

                                    <td className="px-2 py-2 text-center align-middle">
                                        <Checkbox
                                            checked={isPromotion}
                                            onCheckedChange={(checked) =>
                                                updateRow(i, {
                                                    line_type: checked ? "PROMOTION" : "NORMAL",
                                                    unit_price: checked ? 0 : row.product?.price ?? row.unit_price,
                                                    discount: checked ? 0 : row.discount,
                                                })
                                            }
                                        />
                                    </td>

                                    <td className="px-2 py-2 text-center align-middle">
                                        <Checkbox
                                            checked={row.hdn_status === "KO"}
                                            onCheckedChange={(checked) =>
                                                updateRow(i, {
                                                    hdn_status: checked ? "KO" : undefined,
                                                })
                                            }
                                        />
                                    </td>

                                    <td className="min-w-0 px-2 py-2 align-middle">
                                        <Input
                                            value={row.note ?? ""}
                                            onChange={(event) => updateRow(i, { note: event.target.value })}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            placeholder="Ghi chú dòng hàng"
                                            className="min-w-0"
                                        />
                                    </td>

                                    <td className="px-2 py-2 text-right align-middle">
                                        <div className="text-sm font-bold tabular-nums">
                                            {formatNumber(lineTotal)}
                                        </div>
                                    </td>

                                    <td className="px-2 py-2 text-center align-middle">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                                                    onClick={() => removeRow(i)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Xoá dòng</TooltipContent>
                                        </Tooltip>
                                    </td>
                                    </tr>
                                </Fragment>
                            )
                        })}

                        {!items.length && (
                            <tr>
                                <td colSpan={13} className="px-4 py-14">
                                    <div
                                        className="text-muted-foreground flex flex-col items-center gap-3 text-center text-sm"
                                        tabIndex={0}
                                        onKeyDown={(event) => addRowOnEnter(event)}
                                    >
                                        <div className="bg-muted text-muted-foreground/60 flex h-14 w-14 items-center justify-center rounded-full">
                                            <PackageOpen className="h-7 w-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-foreground font-semibold">
                                                Chưa có sản phẩm trong đơn
                                            </div>
                                            <div className="text-xs">
                                                Nhấn Enter để thêm sản phẩm cần bán.
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

type ProductOption = {
    value: number
    label: string
    raw: any
}

function ProductSelect({
    mode,
    value,
    onChange,
    onApplyMany,
    placeholder,
    searchPlaceholder,
    popoverContentClassName,
    commandListClassName,
}: {
    mode: "code" | "name"
    value?: number
    onChange: (value: number | undefined, option: ProductOption | null) => void
    onApplyMany: (products: any[]) => void
    placeholder: string
    searchPlaceholder: string
    popoverContentClassName?: string
    commandListClassName?: string
}) {
    const [open, setOpen] = useState(false)
    const [keyword, setKeyword] = useState("")
    const [loading, setLoading] = useState(false)
    const [multiMode, setMultiMode] = useState(false)
    const [options, setOptions] = useState<ProductOption[]>([])
    const [selectedOption, setSelectedOption] = useState<ProductOption | null>(null)
    const [selected, setSelected] = useState<Map<number, ProductOption>>(() => new Map())

    const selectedCount = selected.size
    const getList = mode === "code" ? listProductsByCode : listProductsByName
    const getLabel = mode === "code" ? productCodeOptionLabel : productNameOptionLabel

    useEffect(() => {
        if (!open) return

        let cancelled = false
        const timer = window.setTimeout(async () => {
            setLoading(true)
            try {
                const result = await getList({ page: 1, size: 50, keyword })
                if (cancelled) return

                setOptions(
                    (result.items ?? []).map((product: any) => ({
                        value: product.id,
                        label: getLabel(product),
                        raw: product,
                    }))
                )
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }, 250)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [getLabel, getList, keyword, open])

    useEffect(() => {
        let active = true

        const loadSelected = async () => {
            if (value == null) {
                setSelectedOption(null)
                return
            }

            const result = await getProduct(value)
            const product = (result as any)?.data ?? result

            if (active && product) {
                setSelectedOption({
                    value: product.id,
                    label: getLabel(product),
                    raw: product,
                })
            }
        }

        loadSelected()

        return () => {
            active = false
        }
    }, [getLabel, value])

    const closePopover = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (!nextOpen) {
            setMultiMode(false)
            setSelected(new Map())
        }
    }

    const toggleOption = (option: ProductOption) => {
        setSelected((current) => {
            const next = new Map(current)
            if (next.has(option.value)) {
                next.delete(option.value)
            } else {
                next.set(option.value, option)
            }
            return next
        })
    }

    const applySelection = () => {
        const products = Array.from(selected.values()).map((option) => option.raw)
        onApplyMany(products)
        setSelected(new Map())
        setMultiMode(false)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={closePopover}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-10 w-full min-w-0 items-start justify-between py-2"
                >
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left leading-snug">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                side="top"
                className={cn(
                    "w-[var(--radix-popover-trigger-width)] max-h-[calc(var(--radix-popover-content-available-height)-8px)] overflow-hidden p-0",
                    popoverContentClassName
                )}
            >
                <Command shouldFilter={false}>
                    <CommandInput value={keyword} onValueChange={setKeyword} placeholder={searchPlaceholder} />
                    <div className="flex items-center justify-between gap-2 border-b px-2 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                            {multiMode && (
                                <>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={!selectedCount}
                                        onClick={() => setSelected(new Map())}
                                    >
                                        Bỏ chọn
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={!selectedCount}
                                        onClick={applySelection}
                                    >
                                        Thêm {selectedCount || ""} dòng
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {multiMode && (
                                <span className="text-muted-foreground text-xs">
                                    {selectedCount} đã chọn
                                </span>
                            )}
                            <Button
                                type="button"
                                variant={multiMode ? "default" : "outline"}
                                size="sm"
                                className="h-8"
                                onClick={() => setMultiMode((current) => !current)}
                            >
                                Chọn nhiều
                            </Button>
                        </div>
                    </div>
                    <CommandList
                        className={cn(
                            "max-h-[calc(var(--radix-popover-content-available-height)-7rem)] overflow-y-auto",
                            commandListClassName
                        )}
                    >
                        <CommandEmpty>
                            {loading ? "Đang tải..." : "Không tìm thấy sản phẩm phù hợp"}
                        </CommandEmpty>
                        {options.map((option) => {
                            const checked = selected.has(option.value)

                            return (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.value}`}
                                    onSelect={() => {
                                        if (multiMode) {
                                            toggleOption(option)
                                            return
                                        }

                                        setSelectedOption(option)
                                        onChange(option.value, option)
                                        setOpen(false)
                                    }}
                                    className="items-start gap-2 py-2"
                                >
                                    {multiMode ? (
                                        <Checkbox checked={checked} className="pointer-events-none mt-0.5" />
                                    ) : (
                                        <Check
                                            className={cn(
                                                "mt-0.5 h-4 w-4",
                                                String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="whitespace-normal break-words font-medium leading-snug">
                                            {option.label}
                                        </div>
                                        {mode === "code" ? (
                                            <div className="text-muted-foreground whitespace-normal break-words text-xs">
                                                {option.raw?.name}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground whitespace-normal break-words text-xs">
                                                {option.raw?.code}
                                            </div>
                                        )}
                                    </div>
                                </CommandItem>
                            )
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function listProductsByCode(params: any) {
    const { keyword, ...rest } = params ?? {}
    return listProducts({
        ...rest,
        keyword: undefined,
        code: keyword || undefined,
    })
}

function listProductsByName(params: any) {
    const { keyword, ...rest } = params ?? {}
    return listProducts({
        ...rest,
        keyword: undefined,
        name: keyword || undefined,
    })
}

function productCodeOptionLabel(product: any) {
    return product.code || `#${product.id}`
}

function productNameOptionLabel(product: any) {
    return product.name || `#${product.id}`
}

function formatOrderInput(value?: number) {
    const numeric = Number(value ?? 0)
    if (!Number.isFinite(numeric)) return "0"
    return numeric.toLocaleString("en-US", {
        maximumFractionDigits: 6,
        useGrouping: true,
    })
}

function DecimalInput({
    value,
    disabled,
    onKeyDown,
    onChange,
}: {
    value?: number
    disabled?: boolean
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
    onChange: (value: number) => void
}) {
    const [focused, setFocused] = useState(false)
    const [raw, setRaw] = useState(formatOrderInput(value))

    useEffect(() => {
        if (!focused) {
            setRaw(formatOrderInput(value))
        }
    }, [focused, value])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value

        if (next.includes(",")) return
        if (!/^\d*\.?\d*$/.test(next)) return

        setRaw(next)

        if (!next || next === ".") {
            onChange(0)
            return
        }

        const parsed = Number(next)
        if (Number.isFinite(parsed)) {
            onChange(parsed)
        }
    }

    return (
        <Input
            type="text"
            inputMode="decimal"
            className="text-right tabular-nums"
            value={focused ? raw : formatOrderInput(value)}
            disabled={disabled}
            onFocus={() => {
                setFocused(true)
                setRaw(value ? String(value) : "")
            }}
            onBlur={() => {
                setFocused(false)
                setRaw(formatOrderInput(value))
            }}
            onKeyDown={onKeyDown}
            onChange={handleChange}
        />
    )
}

export type { OrderItem }
export { formatCurrency }
