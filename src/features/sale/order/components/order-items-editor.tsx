import type React from "react"
import { Fragment, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listGoodsDescriptions } from "@/api/sale/goods-description"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import { PackageOpen, Plus, Trash2 } from "lucide-react"

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
}

export function OrderItemsEditor({ items, setItems }: Props) {
    const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])
    const pendingFocusIndexRef = useRef<number | null>(null)

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
            <div className="flex items-center justify-between gap-2">
                <div className="text-muted-foreground text-xs">{items.length} dòng</div>
                <Button type="button" size="sm" onClick={addRow} className="h-8">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Thêm dòng
                </Button>
            </div>

            <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[1180px] table-fixed text-sm">
                    <colgroup>
                        <col className="w-11" />
                        <col className="w-[220px]" />
                        <col className="w-[360px]" />
                        <col className="w-[70px]" />
                        <col className="w-[110px]" />
                        <col className="w-[130px]" />
                        <col className="w-[120px]" />
                        <col className="w-[155px]" />
                        <col className="w-12" />
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
                                        <AsyncSelect
                                            value={row.product_id}
                                            onChange={(value: any, option: any) => {
                                                selectProduct(i, value, option)
                                            }}
                                            dataSource={{
                                                getList: listProductsByCode,
                                                getById: getProduct,
                                                params: { page: 1, size: 50 },
                                            }}
                                            mapOption={(x: any) => ({
                                                value: x.id,
                                                label: productCodeOptionLabel(x),
                                                raw: x,
                                            })}
                                            optionWrapLabel
                                            wrapLabel
                                            className="min-w-0"
                                            popoverContentClassName="w-[420px] max-w-[calc(100vw-2rem)] max-h-[460px]"
                                            commandListClassName="max-h-[390px]"
                                            placeholder="Chọn mã"
                                            searchPlaceholder="Tìm theo mã sản phẩm..."
                                            emptyText="Không tìm thấy sản phẩm phù hợp"
                                        />
                                    </td>

                                    <td className="min-w-0 px-2 py-2 align-middle">
                                        <AsyncSelect
                                            value={row.product_id}
                                            onChange={(value: any, option: any) => {
                                                selectProduct(i, value, option)
                                            }}
                                            dataSource={{
                                                getList: listProductsByName,
                                                getById: getProduct,
                                                params: { page: 1, size: 50 },
                                            }}
                                            mapOption={(x: any) => ({
                                                value: x.id,
                                                label: productNameOptionLabel(x),
                                                raw: x,
                                            })}
                                            optionWrapLabel
                                            wrapLabel
                                            className="min-w-0"
                                            popoverContentClassName="w-[720px] max-w-[calc(100vw-2rem)] max-h-[520px]"
                                            commandListClassName="max-h-[450px]"
                                            placeholder="Chọn tên sản phẩm"
                                            searchPlaceholder="Tìm theo tên sản phẩm..."
                                            emptyText="Không tìm thấy sản phẩm phù hợp"
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

                                    <tr className={cn("border-b-2 border-b-slate-300 bg-slate-50/80", isInvalid && "bg-amber-50/40 dark:bg-amber-950/10")}>
                                        <td />
                                        <td colSpan={7} className="px-2 pb-2 pt-1">
                                            <div className="grid gap-2 md:grid-cols-[minmax(160px,0.45fr)_auto_auto_minmax(420px,1.55fr)]">
                                                <div className="min-w-0 space-y-0">
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
                                                    />
                                                </div>
                                                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-semibold shadow-xs">
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
                                                    <span>Hàng KM</span>
                                                </label>
                                                <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-semibold shadow-xs">
                                                    <Checkbox
                                                        checked={row.hdn_status === "KO"}
                                                        onCheckedChange={(checked) =>
                                                            updateRow(i, {
                                                                hdn_status: checked ? "KO" : undefined,
                                                            })
                                                        }
                                                    />
                                                    <span>Không tính HĐN</span>
                                                </label>
                                                <div className="min-w-0 space-y-0">
                                                    <Input
                                                        value={row.note ?? ""}
                                                        onChange={(event) => updateRow(i, { note: event.target.value })}
                                                        onKeyDown={(event) => addRowOnEnter(event, i)}
                                                        placeholder="Ghi chú dòng hàng"
                                                        className="min-w-0"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td />
                                    </tr>
                                </Fragment>
                            )
                        })}

                        {!items.length && (
                            <tr>
                                <td colSpan={9} className="px-4 py-14">
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
