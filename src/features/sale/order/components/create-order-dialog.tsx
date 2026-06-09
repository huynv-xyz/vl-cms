import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createOrder } from "@/api/sale/order"
import { OrderFormDialog } from "./order-form-dialog"

const initialOrderItems = () => [
    {
        product_id: undefined,
        quantity: 1,
        unit_price: 0,
        line_type: "NORMAL",
        hdn_status: undefined,
    },
]

export function CreateOrderDialog({ open, onOpenChange }: any) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        customer_id: undefined,
        employee_id: undefined,
        order_date: new Date().toISOString().slice(0, 10),
        status: "NEW",
        note: "",
    })
    const [items, setItems] = useState<any[]>(initialOrderItems())

    const { mutate, isPending } = useMutation({
        mutationFn: () => createOrder({ ...formData, items }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Tạo đơn thành công")
            onOpenChange(false)
            setItems(initialOrderItems())
            setFormData({
                customer_id: undefined,
                employee_id: undefined,
                order_date: new Date().toISOString().slice(0, 10),
                status: "NEW",
                note: "",
            })
        },
        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <OrderFormDialog
            mode="create"
            open={open}
            onOpenChange={onOpenChange}
            headerData={formData}
            setHeaderData={setFormData}
            items={items}
            setItems={setItems}
            isPending={isPending}
            showStatus={false}
            onSubmit={mutate}
        />
    )
}
