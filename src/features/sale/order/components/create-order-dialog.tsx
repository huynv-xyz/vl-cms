import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createOrder } from "@/api/sale/order"
import { OrderFormDialog } from "./order-form-dialog"

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

    const { mutate, isPending } = useMutation({
        mutationFn: () => createOrder({ ...formData, items }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Tạo đơn thành công")
            onOpenChange(false)
            setItems([])
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
