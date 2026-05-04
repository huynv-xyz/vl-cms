import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
import { toast } from "sonner"
import { widgets } from "@/components/rjsf/widgets"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"

import {
    getInventoryInbound,
    updateInventoryInbound,
} from "@/api/inventory/inbound"

import { inboundSchema, inboundUiSchema } from "./inbound-form-schema"
import type { InventoryInbound } from "../data/schema"

type Props = {
    inbound: InventoryInbound
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateInboundDialog({
    inbound,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ["inventory-inbound-detail", inbound?.id],
        queryFn: () => getInventoryInbound(inbound.id),
        enabled: open && !!inbound?.id,
    })

    const [formData, setFormData] = useState<any>({
        inbound_date: "",
        warehouse_id: undefined,
        product_id: undefined,
        lot_no: "",
        quantity_in: 1,
        unit_cost: 0,
        source_type: "PURCHASE",
        source_id: undefined,
        source_no: "",
    })

    useEffect(() => {
        if (!open || !data) return
        setFormData({
            inbound_date: data.inbound_date,
            warehouse_id: data.warehouse_id,
            product_id: data.product_id,
            lot_no: data.lot_no ?? "",
            quantity_in: data.quantity_in ?? 1,
            unit_cost: data.unit_cost ?? 0,
            source_type: data.source_type ?? "PURCHASE",
            source_id: data.source_id,
            source_no: data.source_no ?? "",
        })
    }, [open, data])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.product_id) throw new Error("Chưa chọn sản phẩm")
            if (!formData.warehouse_id) throw new Error("Chưa chọn kho")
            if (!formData.source_type) throw new Error("Chưa chọn loại nhập")
            if ((formData.quantity_in ?? 0) <= 0) throw new Error("Số lượng phải > 0")
            if ((formData.unit_cost ?? 0) < 0) throw new Error("Đơn giá vốn không được âm")

            return updateInventoryInbound({
                id: inbound.id,
                product_id: formData.product_id,
                warehouse_id: formData.warehouse_id,
                lot_no: formData.lot_no,
                inbound_date: formData.inbound_date,
                source_type: formData.source_type,
                source_id: formData.source_id,
                source_no: formData.source_no,
                quantity_in: formData.quantity_in,
                unit_cost: formData.unit_cost,
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["inventory-inbounds"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-inbound-detail", inbound.id] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })

            toast.success("Cập nhật thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Cập nhật nhập hàng</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-4 text-sm">Đang tải dữ liệu...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <Form
                            validator={rjsfValidator}
                            schema={inboundSchema}
                            uiSchema={inboundUiSchema}
                            formData={formData}
                            widgets={widgets}
                            templates={{
                                FieldTemplate: ShadcnFieldTemplate,
                            }}
                            onChange={({ formData }) => setFormData(formData)}
                            onSubmit={() => mutate()}
                        >
                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                disabled={isPending}
                            >
                                {isPending ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </Form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}