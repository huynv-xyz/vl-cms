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
    const [itemError, setItemError] = useState<{ orderItemId: number; message: string } | null>(null)

    useEffect(() => {
        if (!open || !detail) return

        setHeaderFormData({
            customer_id: detail.customer_id ?? undefined,
            customer_type: detail.customer?.type ?? undefined,
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
                pp_status: item.pp_status ?? undefined,
                description: item.description ?? "",
                note: item.note ?? "",
                exported_quantity: item.exported_quantity ?? 0,
            }))
        )
        setItemError(null)
    }, [open, detail])

    const { mutate, isPending } = useMutation({
        onMutate: () => {
            setItemError(null)
        },
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
                pp_status: item.pp_status ?? undefined,
                description: item.description ?? "",
                note: item.note ?? "",
            })),
        }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            await queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },
        onError: (e: any) => {
            const message = e.message || "Không thể cập nhật đơn hàng"
            const orderItemId = Number(e?.data?.order_item_id)
            if (Number.isFinite(orderItemId) && orderItemId > 0) {
                setItemError({ orderItemId, message })
            }
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
                    setItemError(null)
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
            lockAfterDoneExport={(detail?.exports ?? []).some((item: any) => item.status === "DONE")}
            itemError={itemError}
            onSubmit={mutate}
        />
    )
}
