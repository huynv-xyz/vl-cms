import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

type OrderItem = {
    product_id?: number
    product?: any
    quantity: number
    unit_price: number
    unit?: string
    discount?: number
    line_type?: string
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
            },
        ])
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

    const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0)
    const total = items.reduce((sum, i) => {
        const lineTotal = Number(i.quantity || 0) * Number(i.unit_price || 0)
        return sum + Math.max(lineTotal - Number(i.discount || 0), 0)
    }, 0)

    return (
        <div className="space-y-4">

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold">Hàng bán</h3>
                    <p className="text-sm text-muted-foreground">
                        Chọn sản phẩm, nhập số lượng và đơn giá cho từng dòng hàng.
                    </p>
                </div>

                <Button type="button" variant="outline" onClick={addRow}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm dòng
                </Button>
            </div>

            <div className="overflow-hidden rounded-md border bg-background">
                <table className="w-full min-w-[880px] text-sm">
                    <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left">Sản phẩm</th>
                            <th className="w-[128px] px-3 py-3 text-left">Số lượng</th>
                            <th className="w-[160px] px-3 py-3 text-left">Đơn giá</th>
                            <th className="w-[140px] px-3 py-3 text-left">Chiết khấu</th>
                            <th className="w-[168px] px-3 py-3 text-right">Thành tiền</th>
                            <th className="w-[56px] px-2 py-3" />
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((row, i) => (
                            <tr key={i} className="border-t hover:bg-muted/30">

                                <td className="px-4 py-3">
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
                                    />
                                    {row.product && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            ĐVT: {row.product.unit || row.unit || "-"}
                                        </div>
                                    )}
                                </td>

                                <td className="px-3 py-3">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={row.quantity}
                                        onChange={(e) =>
                                            updateRow(i, {
                                                quantity: Number(e.target.value),
                                            })
                                        }
                                    />
                                </td>

                                <td className="px-3 py-3">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={row.unit_price}
                                        onChange={(e) =>
                                            updateRow(i, {
                                                unit_price: Number(e.target.value),
                                            })
                                        }
                                    />
                                </td>

                                <td className="px-3 py-3">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={row.discount ?? 0}
                                        onChange={(e) =>
                                            updateRow(i, {
                                                discount: Number(e.target.value),
                                            })
                                        }
                                    />
                                </td>

                                <td className="px-3 py-3 text-right font-semibold">
                                    {formatNumber(Math.max((row.quantity || 0) * (row.unit_price || 0) - Number(row.discount || 0), 0))}
                                </td>

                                <td className="px-2 py-3 text-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-red-500"
                                        onClick={() => removeRow(i)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}

                        {/* EMPTY */}
                        {!items.length && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                    Chưa có sản phẩm trong đơn. Bấm “Thêm dòng” để bắt đầu.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="rounded-md border bg-muted/20 px-4 py-3 text-right">
                    <div className="text-xs text-muted-foreground">Tổng số lượng</div>
                    <div className="text-base font-semibold">{formatNumber(totalQty)}</div>
                </div>
                <div className="rounded-md border bg-muted/20 px-4 py-3 text-right">
                    <div className="text-xs text-muted-foreground">Tổng tiền hàng</div>
                    <div className="text-lg font-bold">{formatCurrency(total)}</div>
                </div>
            </div>
        </div>
    )
}
