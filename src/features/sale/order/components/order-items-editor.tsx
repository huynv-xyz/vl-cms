import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listGoodsDescriptions } from "@/api/sale/goods-description"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"
import { PackageOpen, Trash2 } from "lucide-react"

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
    const addRow = () => {
        setItems([
            ...items,
            {
                product_id: undefined,
                quantity: 1,
                unit_price: 0,
                line_type: "NORMAL",
                hdn_status: undefined,
                note: "",
            },
        ])
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
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="font-mono">
                        {items.length} dòng
                    </Badge>
                    <span>Mỗi dòng tương ứng 1 SKU sản phẩm. Nhấn Enter ở dòng cuối để thêm dòng mới.</span>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[1860px] table-fixed text-sm">
                    <colgroup>
                        <col className="w-12" />
                        <col className="w-[260px]" />
                        <col className="w-[420px]" />
                        <col className="w-[220px]" />
                        <col className="w-[120px]" />
                        <col className="w-[150px]" />
                        <col className="w-[130px]" />
                        <col className="w-[120px]" />
                        <col className="w-[220px]" />
                        <col className="w-[130px]" />
                        <col className="w-[160px]" />
                        <col className="w-12" />
                    </colgroup>
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2.5 text-center font-semibold">#</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Mã sản phẩm</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Tên sản phẩm</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Mô tả HH</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Số lượng</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Đơn giá</th>
                            <th className="px-3 py-2.5 text-center font-semibold">Khuyến mãi</th>
                            <th className="px-3 py-2.5 text-center font-semibold">Không tính HĐN</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Ghi chú</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Chiết khấu</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Thành tiền</th>
                            <th className="px-2 py-2.5" />
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
                                <tr
                                    key={i}
                                    className={cn(
                                        "border-t transition-colors hover:bg-muted/30",
                                        isInvalid && "bg-amber-50/30 dark:bg-amber-950/10"
                                    )}
                                >
                                    <td className="text-muted-foreground px-3 py-3 text-center align-top font-mono text-xs font-semibold tabular-nums">
                                        {i + 1}
                                    </td>

                                    <td className="min-w-0 px-3 py-3 align-top">
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

                                    <td className="min-w-0 px-3 py-3 align-top">
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
                                        {row.product && (
                                            <div className="text-muted-foreground mt-1.5 flex min-w-0 items-center gap-2 text-xs">
                                                <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                                                    ĐVT: {row.product.unit || row.unit || "-"}
                                                </Badge>
                                                {row.product.code && (
                                                    <span className="min-w-0 truncate font-mono text-[11px]">{row.product.code}</span>
                                                )}
                                                {isPromotion && (
                                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100" variant="secondary">
                                                        Khuyến mãi
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    <td className="min-w-0 px-3 py-3 align-top">
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
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <DecimalInput
                                            value={row.quantity}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(quantity) => updateRow(i, { quantity })}
                                        />
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <DecimalInput
                                            value={row.unit_price}
                                            disabled={isPromotion}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(unit_price) => updateRow(i, { unit_price })}
                                        />
                                    </td>

                                    <td className="px-3 py-3 text-center align-top">
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
                                    </td>

                                    <td className="px-3 py-3 text-center align-top">
                                        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-semibold shadow-xs">
                                            <Checkbox
                                                checked={row.hdn_status === "KO"}
                                                onCheckedChange={(checked) =>
                                                    updateRow(i, {
                                                        hdn_status: checked ? "KO" : undefined,
                                                    })
                                                }
                                            />
                                            <span>KO</span>
                                        </label>
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <Input
                                            value={row.note ?? ""}
                                            onChange={(event) => updateRow(i, { note: event.target.value })}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            placeholder="Ghi chú dòng hàng"
                                            className="min-w-0"
                                        />
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <DecimalInput
                                            value={row.discount ?? 0}
                                            disabled={isPromotion}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(discount) => updateRow(i, { discount })}
                                        />
                                    </td>

                                    <td className="px-3 py-3 text-right align-top">
                                        <div className="text-base font-bold tabular-nums">
                                            {formatNumber(lineTotal)}
                                        </div>
                                        <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                            VND
                                        </div>
                                    </td>

                                    <td className="px-2 py-3 text-center align-top">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                                                    onClick={() => removeRow(i)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Xoá dòng</TooltipContent>
                                        </Tooltip>
                                    </td>
                                </tr>
                            )
                        })}

                        {!items.length && (
                            <tr>
                                <td colSpan={12} className="px-4 py-14">
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

            {items.length > 0 && (
                <div className="text-muted-foreground flex items-center justify-end gap-1.5 text-xs">
                    <span className="bg-amber-100 dark:bg-amber-950/40 h-1.5 w-1.5 rounded-full" />
                    Dòng được làm nổi vàng nếu chưa chọn sản phẩm hoặc số lượng = 0
                </div>
            )}
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
