import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { formatNumber } from "@/lib/utils"

type OrderItem = {
    product_id?: number
    product?: any
    quantity: number
    unit_price: number
    unit?: string
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

    const total = items.reduce(
        (sum, i) => sum + (i.quantity || 0) * (i.unit_price || 0),
        0
    )

    return (
        <div className="space-y-3">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-base">Sản phẩm</h3>

                <Button type="button" size="sm" onClick={addRow}>
                    + Thêm
                </Button>
            </div>

            {/* TABLE */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted text-xs uppercase">
                        <tr>
                            <th className="p-2 text-left">Sản phẩm</th>
                            <th className="p-2 w-[100px] text-right">SL</th>
                            <th className="p-2 w-[150px] text-right">Đơn giá</th>
                            <th className="p-2 w-[160px] text-right">Thành tiền</th>
                            <th className="p-2 w-[50px]" />
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((row, i) => (
                            <tr key={i} className="border-t hover:bg-muted/40">

                                {/* PRODUCT */}
                                <td className="p-2">
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
                                </td>

                                {/* QUANTITY */}
                                <td className="p-2">
                                    <Input
                                        type="number"
                                        className="text-right"
                                        value={row.quantity}
                                        onChange={(e) =>
                                            updateRow(i, {
                                                quantity: Number(e.target.value),
                                            })
                                        }
                                    />
                                </td>

                                {/* PRICE */}
                                <td className="p-2">
                                    <Input
                                        type="number"
                                        className="text-right"
                                        value={row.unit_price}
                                        onChange={(e) =>
                                            updateRow(i, {
                                                unit_price: Number(e.target.value),
                                            })
                                        }
                                    />
                                </td>


                                {/* TOTAL */}
                                <td className="p-2 text-right font-semibold">
                                    {formatNumber((row.quantity || 0) * (row.unit_price || 0))}
                                </td>

                                {/* REMOVE */}
                                <td className="p-2 text-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-red-500"
                                        onClick={() => removeRow(i)}
                                    >
                                        ✕
                                    </Button>
                                </td>
                            </tr>
                        ))}

                        {/* EMPTY */}
                        {!items.length && (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                    Chưa có sản phẩm
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* TOTAL */}
            <div className="flex justify-end">
                <div className="text-right">
                    <span className="text-muted-foreground mr-2">Tổng:</span>
                    <span className="font-bold text-lg">
                        {formatNumber(total)}
                    </span>
                </div>
            </div>
        </div>
    )
}