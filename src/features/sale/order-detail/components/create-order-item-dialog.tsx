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

import { listProducts, getProduct } from "@/api/product"
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

    const reset = () => {
        setProductId(undefined)
        setProduct(null)
        setQuantity(1)
        setUnitPrice(0)
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
            <DialogContent className="w-full">

                <DialogHeader>
                    <DialogTitle>Thêm sản phẩm</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    {/* PRODUCT */}
                    <div>
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
                    </div>

                    <div>
                        <label className="text-sm font-medium">Số lượng</label>
                        <Input
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Number(e.target.value))
                            }
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Đơn giá</label>
                        <Input
                            value={unitPrice}
                            onChange={(e) =>
                                setUnitPrice(Number(e.target.value))
                            }
                        />
                    </div>

                    <div className="text-right text-sm">
                        <span className="text-muted-foreground mr-2">
                            Thành tiền:
                        </span>
                        <span className="font-semibold">
                            {(quantity * unitPrice).toLocaleString()}
                        </span>
                    </div>

                </div>

                <DialogFooter>
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