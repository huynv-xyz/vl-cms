import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Save } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { createOrder } from "@/api/sale/order"
import { OrderItemsEditor } from "./order-items-editor"
import { OrderHeaderFields } from "./order-header-fields"
import { formatCurrency } from "@/lib/utils"

export function CreateOrderDialog({ open, onOpenChange }: any) {
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        customer_id: undefined,
        employee_id: undefined,
        order_date: new Date().toISOString().slice(0, 10),
        status: "NEW",
        note: "",
    })

    const [items, setItems] = useState<any[]>([])

    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalAmount = items.reduce((sum, item) => {
        const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
        return sum + Math.max(lineTotal - Number(item.discount || 0), 0)
    }, 0)

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.customer_id) {
                throw new Error("Chưa chọn khách hàng")
            }

            if (!items.length) {
                throw new Error("Phải có ít nhất 1 sản phẩm")
            }

            for (const i of items) {
                if (!i.product_id) {
                    throw new Error("Chưa chọn sản phẩm")
                }
                if ((i.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng phải > 0")
                }
            }

            return createOrder({
                ...formData,
                items,
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Tạo đơn thành công")
            onOpenChange(false)
            setItems([])
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-6xl">
                <DialogHeader className="border-b px-8 py-6">
                    <DialogTitle className="text-2xl">Tạo đơn hàng</DialogTitle>
                    <DialogDescription className="text-base">
                        Nhập thông tin khách hàng và danh sách sản phẩm cần bán.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="order-create-form"
                    className="min-h-0 flex-1 overflow-y-auto px-8 py-6"
                    onSubmit={(event) => {
                        event.preventDefault()
                        mutate()
                    }}
                >
                    <div className="space-y-6">
                        <div className="rounded-md border bg-background p-5">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold">Thông tin đơn</h3>
                                <p className="text-sm text-muted-foreground">
                                    Chọn khách hàng, nhân viên phụ trách và ngày đặt hàng.
                                </p>
                            </div>
                            <OrderHeaderFields
                                value={formData}
                                onChange={setFormData}
                                showStatus={false}
                            />
                        </div>

                        <OrderItemsEditor items={items} setItems={setItems} />

                        <div className="grid gap-3 md:grid-cols-3">
                            <SummaryBox label="Số dòng hàng" value={items.length} />
                            <SummaryBox label="Tổng SL" value={formatNumber(totalQty)} />
                            <SummaryBox label="Tổng tiền" value={formatCurrency(totalAmount)} strong />
                        </div>
                    </div>
                </form>

                <DialogFooter className="border-t px-8 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="submit" form="order-create-form" disabled={isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Đang tạo..." : "Tạo đơn"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SummaryBox({ label, value, strong }: { label: string; value: any; strong?: boolean }) {
    return (
        <div className="rounded-md border bg-muted/20 px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={strong ? "mt-1 text-xl font-bold" : "mt-1 text-xl font-semibold"}>
                {value}
            </div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0))
}
