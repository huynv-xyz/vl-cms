import { Button } from "@/components/ui/button"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import { listInventoryLots, getInventoryLot } from "@/api/inventory/lot"

type Props = {
    items: any[]
    setItems: (items: any[]) => void
    warehouseId?: number
}

export function ProductionExtrasEditor({
    items,
    setItems,
    warehouseId,
}: Props) {
    const addRow = () => {
        setItems([
            ...items,
            {
                product_id: undefined,
                quantity: 1,
                lot_id: undefined,
                note: "",
            },
        ])
    }

    const updateRow = (index: number, patch: any) => {
        setItems(items.map((x, i) => (i === index ? { ...x, ...patch } : x)))
    }

    const removeRow = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    return (
        <div className="rounded border p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">Phát sinh thêm</div>
                <Button type="button" variant="outline" onClick={addRow}>
                    + Thêm phát sinh
                </Button>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[1.5fr_120px_1.3fr_1fr_80px] gap-2"
                    >
                        <AsyncSelect
                            value={item.product_id}
                            onChange={(v: any) =>
                                updateRow(index, {
                                    product_id: v || undefined,
                                    lot_id: undefined,
                                })
                            }
                            placeholder="Vật tư"
                            dataSource={{
                                getList: listProducts,
                                getById: getProduct,
                                params: { page: 1, size: 20 },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: `${x.code} - ${x.name}`,
                            })}
                        />

                        <input
                            className="h-9 rounded border px-2"
                            type="number"
                            min={0.001}
                            value={item.quantity ?? ""}
                            onChange={(e) =>
                                updateRow(index, {
                                    quantity: Number(e.target.value),
                                })
                            }
                            placeholder="SL"
                        />

                        <AsyncSelect
                            value={item.lot_id}
                            onChange={(v: any) =>
                                updateRow(index, {
                                    lot_id: v || undefined,
                                })
                            }
                            placeholder="Lô (tuỳ chọn)"
                            dataSource={{
                                getList: listInventoryLots,
                                getById: getInventoryLot,
                                params: {
                                    page: 1,
                                    size: 20,
                                    product_id: item.product_id,
                                    warehouse_id: warehouseId,
                                    only_remaining: true,
                                },
                            }}
                            mapOption={(x: any) => ({
                                value: x.id,
                                label: `${x.lot_no} - còn ${x.quantity_remaining}`,
                            })}
                        />

                        <input
                            className="h-9 rounded border px-2"
                            value={item.note ?? ""}
                            onChange={(e) =>
                                updateRow(index, {
                                    note: e.target.value,
                                })
                            }
                            placeholder="Ghi chú"
                        />

                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeRow(index)}
                        >
                            Xóa
                        </Button>
                    </div>
                ))}

                {!items.length && (
                    <div className="text-sm text-muted-foreground">
                        Không có phát sinh.
                    </div>
                )}
            </div>
        </div>
    )
}