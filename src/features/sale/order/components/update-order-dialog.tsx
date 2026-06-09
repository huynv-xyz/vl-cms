import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getOrder, updateOrder } from "@/api/sale/order"
import { normalizeDate } from "@/lib/utils"

import { OrderFormDialog } from "./order-form-dialog"
import type { Order } from "../data/schema"

type Props = {
    order: Order
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateOrderDialog({ order, open, onOpenChange }: Props) {
    const queryClient = useQueryClient()
    const { data: detail, isLoading } = useQuery({
        queryKey: ["order-detail", order?.id],
        queryFn: () => getOrder(order.id),
        enabled: open && !!order?.id,
    })
    const [headerFormData, setHeaderFormData] = useState<any>(null)
    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            customer_id: detail.customer_id ?? undefined,
            employee_id: detail.employee_id ?? undefined,
            order_date: normalizeDate(detail.order_date),
            status: detail.status ?? "NEW",
            note: detail.note ?? "",
        })

        setItems(
            (detail.items ?? []).map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                product: item.product,
                quantity: item.quantity ?? 0,
                unit_price: item.unit_price ?? 0,
                discount: item.discount ?? 0,
                line_type: item.line_type ?? "NORMAL",
                hdn_status: item.hdn_status ?? undefined,
                description: item.description ?? "",
            }))
        )
    }, [open, detail])

    const { mutate, isPending } = useMutation({
        mutationFn: () => updateOrder({
            id: order.id,
            ...headerFormData,
            items: items.map((item) => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount: item.discount ?? 0,
                line_type: item.line_type ?? "NORMAL",
                hdn_status: item.hdn_status === "KO" ? "KO" : undefined,
                description: item.description ?? "",
            })),
        }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            await queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },
        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <OrderFormDialog
            mode="update"
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    setHeaderFormData(null)
                    setItems([])
                }
                onOpenChange(value)
            }}
            headerData={headerFormData}
            setHeaderData={setHeaderFormData}
            items={items}
            setItems={setItems}
            orderNo={detail?.order_no}
            isLoading={isLoading}
            isPending={isPending}
            onSubmit={mutate}
        />
    )
}
