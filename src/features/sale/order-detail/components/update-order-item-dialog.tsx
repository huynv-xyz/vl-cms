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
import { formatCurrency } from "@/lib/utils"

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
    const [discount, setDiscount] = useState(0)

    // load data khi mở dialog
    useEffect(() => {
        if (item) {
            setQuantity(item.quantity || 1)
            setUnitPrice(item.unit_price || 0)
            setDiscount(item.discount || 0)
        }
    }, [item])

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            updateOrderItem(item.id, {
                quantity,
                unit_price: unitPrice,
                discount,
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
            <DialogContent className="p-0 sm:max-w-[720px]">

                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Cập nhật hàng bán</DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 px-6 py-5 md:grid-cols-2">

                    <div className="rounded-md border bg-muted/20 px-4 py-3 md:col-span-2">
                        <label className="text-sm font-medium">Sản phẩm</label>
                        <div className="text-sm font-medium">
                            {item?.product?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {item?.product?.code}
                        </div>
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
