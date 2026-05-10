import { useEffect, useState } from "react"
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

import { updateOrderItem } from "@/api/sale/order"

type Props = {
    item: any
    open: boolean
    onOpenChange: (v: boolean) => void
}

export function UpdateOrderItemDialog({ item, open, onOpenChange }: Props) {

    const queryClient = useQueryClient()

    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState(0)

    // load data khi mở dialog
    useEffect(() => {
        if (item) {
            setQuantity(item.quantity || 1)
            setUnitPrice(item.unit_price || 0)
        }
    }, [item])

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            updateOrderItem(item.id, {
                quantity,
                unit_price: unitPrice,
            }),

        onSuccess: async () => {
            toast.success("Cập nhật thành công")

            await queryClient.invalidateQueries({
                queryKey: ["order-detail"],
            })

            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    const handleSubmit = () => {

        if (!item?.id) {
            toast.error("Item không hợp lệ")
            return
        }

        if (quantity <= 0) {
            toast.error("Số lượng phải > 0")
            return
        }

        mutate()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">

                <DialogHeader>
                    <DialogTitle>Cập nhật sản phẩm</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                    {/* PRODUCT INFO */}
                    <div>
                        <label className="text-sm font-medium">Sản phẩm</label>
                        <div className="text-sm font-medium">
                            {item?.product?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {item?.product?.code}
                        </div>
                    </div>

                    {/* QUANTITY */}
                    <div>
                        <label className="text-sm font-medium">Số lượng</label>
                        <Input
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(Number(e.target.value))
                            }
                        />
                    </div>

                    {/* PRICE */}
                    <div>
                        <label className="text-sm font-medium">Đơn giá</label>
                        <Input
                            value={unitPrice}
                            onChange={(e) =>
                                setUnitPrice(Number(e.target.value))
                            }
                        />
                    </div>

                    {/* PREVIEW */}
                    <div className="text-right text-sm">
                        <span className="text-muted-foreground mr-2">
                            Thành tiền:
                        </span>
                        <span className="font-semibold text-primary">
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