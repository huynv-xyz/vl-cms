import type React from "react"
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
    product_id?: number
    product?: any
    quantity: number
    unit_price: number
    unit?: string
    discount?: number
    line_type?: string
    description?: string
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
                <table className="w-full min-w-[1360px] table-fixed text-sm">
                    <colgroup>
                        <col className="w-12" />
                        <col className="w-[520px]" />
                        <col className="w-[220px]" />
                        <col className="w-[130px]" />
                        <col className="w-[120px]" />
                        <col className="w-[150px]" />
                        <col className="w-[130px]" />
                        <col className="w-[160px]" />
                        <col className="w-12" />
                    </colgroup>
                    <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2.5 text-center font-semibold">#</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Sản phẩm</th>
                            <th className="px-3 py-2.5 text-left font-semibold">Mô tả HH</th>
                            <th className="px-3 py-2.5 text-center font-semibold">Khuyến mãi</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Số lượng</th>
                            <th className="px-3 py-2.5 text-right font-semibold">Đơn giá</th>
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
                                                if (items.some((x, idx) => idx !== i && x.product_id === value)) {
                                                    return
                                                }

                                                updateRow(i, {
                                                    product_id: value,
                                                    product: option?.raw,
                                                    unit_price: option?.raw?.price ?? 0,
                                                    unit: option?.raw?.unit,
                                                })
                                            }}
                                            dataSource={{
                                                getList: listProducts,
                                                getById: getProduct,
                                                params: { page: 1, size: 20 },
                                            }}
                                            mapOption={(x: any) => ({
                                                value: x.id,
                                                label: `${x.code} - ${x.name}`,
                                                raw: x,
                                            })}
                                            className="min-w-0"
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

                                    <td className="px-3 py-3 text-center align-top">
                                        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-semibold shadow-xs">
                                            <Checkbox
                                                checked={isPromotion}
                                                onCheckedChange={(checked) =>
                                                    updateRow(i, {
                                                        line_type: checked ? "PROMOTION" : "NORMAL",
                                                        discount: checked ? 0 : row.discount,
                                                    })
                                                }
                                            />
                                            <span>Hàng KM</span>
                                        </label>
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="text-right tabular-nums"
                                            value={row.quantity}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(e) =>
                                                updateRow(i, {
                                                    quantity: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="text-right tabular-nums"
                                            value={row.unit_price}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(e) =>
                                                updateRow(i, {
                                                    unit_price: Number(e.target.value),
                                                })
                                            }
                                        />
                                    </td>

                                    <td className="px-3 py-3 align-top">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="text-right tabular-nums"
                                            value={row.discount ?? 0}
                                            disabled={isPromotion}
                                            onKeyDown={(event) => addRowOnEnter(event, i)}
                                            onChange={(e) =>
                                                updateRow(i, {
                                                    discount: Number(e.target.value),
                                                })
                                            }
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

            {items.length > 0 && (
                <div className="text-muted-foreground flex items-center justify-end gap-1.5 text-xs">
                    <span className="bg-amber-100 dark:bg-amber-950/40 h-1.5 w-1.5 rounded-full" />
                    Dòng được làm nổi vàng nếu chưa chọn sản phẩm hoặc số lượng = 0
                </div>
            )}
        </div>
    )
}

// re-export for potential external consumers, currently unused
export type { OrderItem }
export { formatCurrency }
