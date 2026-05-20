import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { formatCurrency } from "@/lib/utils"

import { listProducts, getProduct } from "@/api/product"
import { listGoodsDescriptions } from "@/api/sale/goods-description"
import { createOrderItem } from "@/api/sale/order"

type Props = {
    order: any
    open: boolean
    onOpenChange: (v: boolean) => void
}

export function CreateOrderItemDialog({ order, open, onOpenChange }: Props) {

    const queryClient = useQueryClient()

    const [productId, setProductId] = useState<number>()
    const [product, setProduct] = useState<any>(null)

    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [description, setDescription] = useState<string | undefined>()

    const reset = () => {
        setProductId(undefined)
        setProduct(null)
        setQuantity(1)
        setUnitPrice(0)
        setDiscount(0)
        setDescription(undefined)
    }

    const { mutate, isPending } = useMutation({
        mutationFn: (payload: any) =>
            createOrderItem(payload.orderId, payload.data),

        onSuccess: async () => {
            toast.success("Thêm sản phẩm thành công")

            await queryClient.invalidateQueries({
                queryKey: ["order-detail", order?.id],
            })

            reset()
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    const handleSubmit = () => {

        if (!order?.id) {
            toast.error("Order chưa load xong")
            return
        }

        if (!productId) {
            toast.error("Chọn sản phẩm")
            return
        }

        if (quantity <= 0) {
            toast.error("Số lượng phải > 0")
            return
        }

        const items = order.items ?? []

        if (items.some((x: any) => x.product_id === productId)) {
            toast.error("Sản phẩm đã tồn tại")
            return
        }

        mutate({
            orderId: order.id,
            data: {
                product_id: productId,
                quantity,
                unit_price: unitPrice,
                discount,
                description,
            }
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset()
                onOpenChange(v)
            }}
        >
            <DialogContent className="p-0 sm:max-w-[760px]">

                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Thêm hàng bán</DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-5 md:grid-cols-2">

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Sản phẩm</label>

                        <AsyncSelect
                            placeholder="Chọn sản phẩm"
                            value={productId}
                            onChange={(value: any, option: any) => {
                                setProductId(value)
                                setProduct(option?.raw)
                                setUnitPrice(option?.raw?.price ?? 0)
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
                            menuPortalTarget={document.body}
                            styles={{
                                menuPortal: (base: any) => ({
                                    ...base,
                                    zIndex: 9999,
                                }),
                            }}
                        />
                        {product && (
                            <div className="mt-2 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                {product.code} - {product.name} · ĐVT: {product.unit || "-"}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Mô tả HH</label>
                        <AsyncSelect
                            placeholder="Chọn mô tả HH"
                            searchPlaceholder="Tìm mô tả HH..."
                            emptyText="Không có mô tả phù hợp"
                            value={description}
                            onChange={(value: any) => setDescription(value)}
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
                                description
                                    ? {
                                        value: description,
                                        label: description,
                                        raw: { name: description },
                                    }
                                    : undefined
                            }
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Số lượng</label>
                        <Input
                            type="number"
                            min={0}
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Number(e.target.value))
                            }
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Đơn giá</label>
                        <Input
                            type="number"
                            min={0}
                            value={unitPrice}
                            onChange={(e) =>
                                setUnitPrice(Number(e.target.value))
                            }
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Chiết khấu</label>
                        <Input
                            type="number"
                            min={0}
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                    </div>

                    <div className="rounded-md border bg-muted/20 px-4 py-3">
                        <div className="text-sm text-muted-foreground">Thành tiền</div>
                        <div className="mt-1 text-xl font-bold">
                            {formatCurrency(Math.max(quantity * unitPrice - discount, 0))}
                        </div>
                    </div>

                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Huỷ
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                    >
                        {isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
