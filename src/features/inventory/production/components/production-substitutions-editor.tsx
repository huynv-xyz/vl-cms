import { Button } from "@/components/ui/button"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { listProducts, getProduct } from "@/api/product"
import type { ProductBomDetail } from "../data/schema"

type Props = {
    bom?: ProductBomDetail
    items: any[]
    setItems: (items: any[]) => void
}

export function ProductionSubstitutionsEditor({
    bom,
    items,
    setItems,
}: Props) {
    const addRow = () => {
        setItems([
            ...items,
            {
                original_product_id: undefined,
                substitute_product_id: undefined,
                quantity: 1,
            },
        ])
    }

    const updateRow = (index: number, patch: any) => {
        setItems(items.map((x, i) => (i === index ? { ...x, ...patch } : x)))
    }

    const removeRow = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const bomOptions =
        bom?.items?.map((i) => ({
            value: i.material_product_id,
            label: `${i.material_product?.code ?? ""} - ${i.material_product?.name ?? ""}`,
        })) ?? []

    return (
        <div className="rounded border p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">Thay thế vật tư</div>
                <Button type="button" variant="outline" onClick={addRow}>
                    + Thêm thay thế
                </Button>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[1.5fr_1.5fr_120px_80px] gap-2"
                    >
                        <select
                            className="h-9 rounded border px-2 text-sm"
                            value={item.original_product_id ?? ""}
                            onChange={(e) =>
                                updateRow(index, {
                                    original_product_id: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                })
                            }
                        >
                            <option value="">Vật tư trong định mức</option>
                            {bomOptions.map((x) => (
                                <option key={x.value} value={x.value}>
                                    {x.label}
                                </option>
                            ))}
                        </select>

                        <AsyncSelect
                            value={item.substitute_product_id}
                            onChange={(v: any) =>
                                updateRow(index, {
                                    substitute_product_id: v || undefined,
                                })
                            }
                            placeholder="Vật tư thay thế"
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
                            placeholder="SL thay"
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
                        Không có thay thế.
                    </div>
                )}
            </div>
        </div>
    )
}