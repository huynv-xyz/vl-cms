import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/date-picker"
import { AsyncSelect } from "@/components/rjsf/async-select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { listProducts, getProduct } from "@/api/product"
import { listWarehouses, getWarehouse } from "@/api/warehouse"
import {
    updateProduction,
    type UpdateProductionRequest,
} from "@/api/production/order"
import type { Production } from "../data/schema"

type Props = {
    production: Production
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Row = {
    product_id?: number
    product?: any
    warehouse_id?: number
    quantity_plan: number
    quantity_done: number
    lot_no?: string
    expiry_date?: string
    note?: string
}

export function UpdateProductionDialog({
    production,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()

    const [productionDate, setProductionDate] = useState("")
    const [warehouseId, setWarehouseId] = useState<number>()
    const [packingCode, setPackingCode] = useState("")
    const [status, setStatus] = useState("PLANNED")
    const [note, setNote] = useState("")
    const [items, setItems] = useState<Row[]>([])

    useEffect(() => {
        if (!production || !open) return

        setProductionDate(production.production_date || "")
        setStatus(production.status || "PLANNED")
        setNote(production.note || "")

        const firstWarehouseId = production.items?.[0]?.warehouse_id

        setWarehouseId(firstWarehouseId)
        setPackingCode((production as any).packing_code || "")

        setItems(
            production.items?.length
                ? production.items.map((i: any) => ({
                    product_id: i.product_id,
                    product: i.product,
                    warehouse_id: i.warehouse_id,
                    quantity_plan: i.quantity_plan ?? 0,
                    quantity_done: i.quantity_done ?? 0,
                    lot_no: i.output_lot_no ?? i.lot_no ?? "",
                    expiry_date:
                        i.output_expiry_date ?? i.expiry_date ?? "",
                    note: i.note ?? "",
                }))
                : [
                    {
                        quantity_plan: 1,
                        quantity_done: 1,
                    },
                ]
        )
    }, [production, open])

    const { mutate, isPending } = useMutation({
        mutationFn: updateProduction,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["productions"] })
            toast.success("Cập nhật lệnh sản xuất thành công")
            onOpenChange(false)
        },
        onError: (e: any) => toast.error(e.message || "Lỗi"),
    })

    const updateRow = (index: number, patch: Partial<Row>) => {
        setItems((old) =>
            old.map((x, i) => (i === index ? { ...x, ...patch } : x))
        )
    }

    const addRow = () => {
        setItems((old) => [
            ...old,
            { quantity_plan: 1, quantity_done: 1 },
        ])
    }

    const removeRow = (index: number) => {
        setItems((old) => old.filter((_, i) => i !== index))
    }

    const submit = () => {
        if (!productionDate) return toast.error("Ngày lệnh là bắt buộc")
        if (!warehouseId) return toast.error("Kho nhập TP là bắt buộc")
        if (!items.length) return toast.error("Cần ít nhất 1 thành phẩm")

        for (const i of items) {
            if (!i.product_id) return toast.error("Mã thành phẩm là bắt buộc")

            if (!i.quantity_plan || i.quantity_plan <= 0) {
                return toast.error("SL đơn vị chuẩn phải > 0")
            }

            if (i.quantity_done == null || i.quantity_done < 0) {
                return toast.error("SL nhập TP phải >= 0")
            }
        }

        mutate({
            id: production.id,
            warehouse_id: warehouseId,
            production_date: productionDate,
            packing_code: packingCode,
            status,
            note,
            items: items.map((i) => ({
                product_id: i.product_id,
                warehouse_id: i.warehouse_id,
                quantity_plan: i.quantity_plan,
                quantity_done: i.quantity_done,
                lot_no: i.lot_no,
                expiry_date: i.expiry_date,
                note: i.note,
            })),
        } as UpdateProductionRequest)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cập nhật lệnh sản xuất</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <section className="rounded-xl border p-4 space-y-4">
                        <h3 className="font-semibold">Thông tin lệnh</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Mã lệnh SX">
                                <input
                                    className="h-10 w-full rounded-md border bg-muted px-3"
                                    value={production.production_no || ""}
                                    disabled
                                />
                            </Field>

                            <Field label="Ngày lệnh *">
                                <DatePicker
                                    value={productionDate}
                                    onChange={(v) => setProductionDate(v || "")}
                                    placeholder="Ngày lệnh"
                                />
                            </Field>

                            <Field label="Kho nhập TP *">
                                <AsyncSelect
                                    value={warehouseId}
                                    onChange={(v: any) =>
                                        setWarehouseId(v || undefined)
                                    }
                                    placeholder="Kho nhập TP"
                                    dataSource={{
                                        getList: listWarehouses,
                                        getById: getWarehouse,
                                        params: { page: 1, size: 20 },
                                    }}
                                    mapOption={(x: any) => ({
                                        value: x.id,
                                        label: x.name,
                                    })}
                                />
                            </Field>

                            <Field label="Packing code">
                                <input
                                    className="h-10 w-full rounded-md border px-3"
                                    value={packingCode}
                                    onChange={(e) =>
                                        setPackingCode(e.target.value)
                                    }
                                    placeholder="PACK001"
                                />
                            </Field>

                            <Field label="Trạng thái">
                                <select
                                    className="h-10 w-full rounded-md border px-3"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="PLANNED">Kế hoạch</option>
                                    <option value="IN_PROGRESS">Đang xử lý</option>
                                    <option value="READY">Sẵn sàng</option>
                                    <option value="DONE">Hoàn tất</option>
                                    <option value="CANCELLED">Đã huỷ</option>
                                </select>
                            </Field>

                            <Field label="Ghi chú">
                                <input
                                    className="h-10 w-full rounded-md border px-3"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ghi chú"
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">
                                Danh sách thành phẩm trong lệnh
                            </h3>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRow}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm thành phẩm
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {items.map((row, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border p-4 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">
                                            Thành phẩm #{index + 1}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeRow(index)}
                                            disabled={items.length <= 1}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Field label="Mã thành phẩm *">
                                            <AsyncSelect
                                                value={row.product_id}
                                                onChange={(v: any, option: any) =>
                                                    updateRow(index, {
                                                        product_id:
                                                            v || undefined,
                                                        product: option?.raw,
                                                    })
                                                }
                                                placeholder="Mã thành phẩm"
                                                dataSource={{
                                                    getList: listProducts,
                                                    getById: getProduct,
                                                    params: {
                                                        page: 1,
                                                        size: 20,
                                                    },
                                                }}
                                                mapOption={(x: any) => ({
                                                    value: x.id,
                                                    label: `${x.code} - ${x.name}`,
                                                    raw: x,
                                                })}
                                            />
                                        </Field>

                                        <Field label="Tên hàng">
                                            <input
                                                className="h-10 w-full rounded-md border bg-muted px-3"
                                                value={row.product?.name ?? ""}
                                                disabled
                                                placeholder="Tự điền từ danh mục"
                                            />
                                        </Field>

                                        <Field label="SL ĐV chuẩn *">
                                            <input
                                                type="number"
                                                className="h-10 w-full rounded-md border px-3"
                                                value={row.quantity_plan}
                                                onChange={(e) =>
                                                    updateRow(index, {
                                                        quantity_plan: Number(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="SL nhập TP *">
                                            <input
                                                type="number"
                                                className="h-10 w-full rounded-md border px-3"
                                                value={row.quantity_done}
                                                onChange={(e) =>
                                                    updateRow(index, {
                                                        quantity_done: Number(
                                                            e.target.value
                                                        ),
                                                    })
                                                }
                                            />
                                        </Field>

                                        <Field label="Số lô TP">
                                            <input
                                                className="h-10 w-full rounded-md border px-3"
                                                value={row.lot_no ?? ""}
                                                onChange={(e) =>
                                                    updateRow(index, {
                                                        lot_no: e.target.value,
                                                    })
                                                }
                                                placeholder="Số lô TP"
                                            />
                                        </Field>

                                        <Field label="HSD TP">
                                            <DatePicker
                                                value={row.expiry_date}
                                                onChange={(v) =>
                                                    updateRow(index, {
                                                        expiry_date: v || "",
                                                    })
                                                }
                                                placeholder="HSD"
                                            />
                                        </Field>

                                        <div className="md:col-span-2">
                                            <Field label="Ghi chú">
                                                <textarea
                                                    className="min-h-20 w-full rounded-md border px-3 py-2"
                                                    value={row.note ?? ""}
                                                    onChange={(e) =>
                                                        updateRow(index, {
                                                            note: e.target
                                                                .value,
                                                        })
                                                    }
                                                    placeholder="Ghi chú..."
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Huỷ
                        </Button>

                        <Button onClick={submit} disabled={isPending}>
                            {isPending ? "Đang lưu..." : "Lưu"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    )
}