import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createOrder } from "@/api/sale/order"
import { normalizeDate } from "@/lib/utils"
import { OrderFormDialog } from "./order-form-dialog"

const initialOrderItems = () => [
    {
        product_id: undefined,
        quantity: 1,
        unit_price: 0,
        line_type: "NORMAL",
        hdn_status: undefined,
        note: "",
    },
]

function buildInitialHeader(initialData?: any) {
    return {
        customer_id: initialData?.customer_id ?? initialData?.customer?.id ?? undefined,
        employee_id: initialData?.employee_id ?? initialData?.employee?.id ?? undefined,
        order_date: normalizeDate(initialData?.order_date) || new Date().toISOString().slice(0, 10),
        status: "NEW",
        note: initialData?.note ?? "",
    }
}

function buildInitialItems(initialData?: any) {
    const sourceItems = initialData?.items ?? []
    if (!sourceItems.length) return initialOrderItems()

    return sourceItems.map((item: any) => ({
        product_id: item.product_id,
        product: item.product,
        quantity: item.quantity ?? 1,
        unit_price: item.unit_price ?? 0,
        discount: item.discount ?? 0,
        line_type: item.line_type ?? "NORMAL",
        hdn_status: item.hdn_status ?? undefined,
        description: item.description ?? "",
        note: item.note ?? "",
    }))
}

export function CreateOrderDialog({ open, onOpenChange, initialData }: any) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const initialHeader = useMemo(() => buildInitialHeader(initialData), [initialData])
    const initialItems = useMemo(() => buildInitialItems(initialData), [initialData])
    const [formData, setFormData] = useState(initialHeader)
    const [items, setItems] = useState<any[]>(initialItems)

    useEffect(() => {
        if (!open) return

        setFormData(buildInitialHeader(initialData))
        setItems(buildInitialItems(initialData))
    }, [initialData, open])

    const { mutate, isPending } = useMutation({
        mutationFn: () => createOrder({
            ...formData,
            items: items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount: item.discount ?? 0,
                line_type: item.line_type ?? "NORMAL",
                hdn_status: item.hdn_status === "KO" ? "KO" : undefined,
                description: item.description ?? "",
                note: item.note ?? "",
            })),
        } as any),
        onSuccess: async (createdOrder: any) => {
            await queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Tạo đơn thành công")
            onOpenChange(false)
            setItems(initialOrderItems())
            setFormData(buildInitialHeader())

            if (createdOrder?.id) {
                navigate({
                    to: "/sales/orders/$id",
                    params: { id: String(createdOrder.id) },
                    search: { return_to: undefined },
                })
            }
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
