import { Plus, Trash2 } from "lucide-react"

import { getProduct, listProducts } from "@/api/product"
import { getWarehouse, listWarehouses } from "@/api/warehouse"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { warehouseOption } from "@/lib/option-mapper"

type Props = {
    items: any[]
    onChange: (items: any[]) => void
}

export function ManualReturnItemsEditor({ items, onChange }: Props) {
    const updateRow = (index: number, patch: any) => {
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
    }

    const removeRow = (index: number) => {
        onChange(items.filter((_, i) => i !== index))
    }

    const addRow = () => {
        onChange([
            ...items,
            {
                product_id: undefined,
                product: undefined,
                warehouse_id: undefined,
                quantity: 0,
                unit_price: 0,
                note: "",
            },
        ])
    }

    const handleProductChange = (index: number, productId: any, option: any) => {
        updateRow(index, {
            product_id: productId || undefined,
            product: option?.raw,
        })
    }

    return (
        <div className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="font-semibold">Hàng trả</div>
                <Button type="button" size="sm" onClick={addRow}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm dòng
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[1500px] text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="w-12 px-3 py-2 text-center">#</th>
                            <th className="w-[260px] px-3 py-2 text-left">Mã sản phẩm</th>
                            <th className="w-[420px] px-3 py-2 text-left">Tên sản phẩm</th>
                            <th className="w-[320px] px-3 py-2 text-left">Kho nhập</th>
                            <th className="w-[150px] px-3 py-2 text-right">Số lượng</th>
                            <th className="w-[170px] px-3 py-2 text-right">Đơn giá</th>
                            <th className="w-[260px] px-3 py-2 text-left">Ghi chú</th>
                            <th className="w-14 px-3 py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-t">
                                <td className="px-3 py-2 text-center text-muted-foreground">{index + 1}</td>
                                <td className="px-3 py-2">
                                    <AsyncSelect
                                        value={item.product_id}
                                        placeholder="Chọn mã"
                                        searchPlaceholder="Tìm mã sản phẩm..."
                                        dataSource={{
                                            getList: listProductsByCode,
                                            getById: getProduct,
                                            params: { page: 1, size: 50 },
                                        }}
                                        mapOption={productCodeOption}
                                        onChange={(productId: any, option: any) =>
                                            handleProductChange(index, productId, option)
                                        }
                                        popoverContentClassName="w-[560px] max-w-[calc(100vw-2rem)]"
                                        optionWrapLabel
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <AsyncSelect
                                        value={item.product_id}
                                        placeholder="Chọn tên sản phẩm"
                                        searchPlaceholder="Tìm tên sản phẩm..."
                                        dataSource={{
                                            getList: listProductsByName,
                                            getById: getProduct,
                                            params: { page: 1, size: 50 },
                                        }}
                                        mapOption={productNameOption}
                                        onChange={(productId: any, option: any) =>
                                            handleProductChange(index, productId, option)
                                        }
                                        popoverContentClassName="w-[720px] max-w-[calc(100vw-2rem)]"
                                        optionWrapLabel
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <AsyncSelect
                                        value={item.warehouse_id}
                                        placeholder="Chọn kho"
                                        dataSource={{
                                            getList: listWarehouses,
                                            getById: getWarehouse,
                                            params: { page: 1, size: 20, status: "ACTIVE" },
                                        }}
                                        mapOption={warehouseOption}
                                        onChange={(warehouseId: any) =>
                                            updateRow(index, { warehouse_id: warehouseId || undefined })
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <Input
                                        className="text-right"
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={item.quantity ?? ""}
                                        onChange={(event) =>
                                            updateRow(index, { quantity: Number(event.target.value || 0) })
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <Input
                                        className="text-right"
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={item.unit_price ?? ""}
                                        onChange={(event) =>
                                            updateRow(index, { unit_price: Number(event.target.value || 0) })
                                        }
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <Input
                                        value={item.note || ""}
                                        onChange={(event) => updateRow(index, { note: event.target.value })}
                                        placeholder="Ghi chú"
                                    />
                                </td>
                                <td className="px-3 py-2 text-right">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeRow(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!items.length && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                    Chưa có dòng hàng trả.
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

function productCodeOption(product: any) {
    return {
        value: product.id,
        label: product.code || `#${product.id}`,
        raw: product,
    }
}

function productNameOption(product: any) {
    return {
        value: product.id,
        label: product.name || `#${product.id}`,
        raw: product,
    }
}
