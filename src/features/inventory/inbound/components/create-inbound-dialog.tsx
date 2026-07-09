import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Form from "@rjsf/shadcn"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { widgets } from "@/components/rjsf/widgets"
import { ShadcnFieldTemplate } from "@/components/rjsf/shadcn-templates"
import { rjsfValidator } from "@/components/rjsf/rjsf-validator"

import { inboundSchema, inboundUiSchema } from "./inbound-form-schema"
import { createInventoryInbound } from "@/api/inventory/inbound"

export function CreateInboundDialog({ open, onOpenChange }: any) {
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<any>({
        inbound_date: todayYmd(),
        warehouse_id: undefined,
        product_id: undefined,
        lot_no: "",
        quantity_in: 1,
        unit_cost: 0,
        source_type: "PURCHASE",
        source_id: undefined,
        source_no: "",
    })

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.product_id) throw new Error("Chưa chọn sản phẩm")
            if (!formData.warehouse_id) throw new Error("Chưa chọn kho")
            if (!formData.source_type) throw new Error("Chưa chọn loại nhập")
            if ((formData.quantity_in ?? 0) <= 0) throw new Error("Số lượng phải > 0")
            if ((formData.unit_cost ?? 0) < 0) throw new Error("Đơn giá vốn không được âm")

            return createInventoryInbound({
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
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })

            toast.success("Nhập hàng thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] flex-col sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Nhập hàng</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <Form
                        validator={rjsfValidator}
                        schema={inboundSchema}
                        uiSchema={inboundUiSchema}
                        formData={formData}
                        widgets={widgets}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        onChange={({ formData }) => setFormData(formData)}
                        onSubmit={() => mutate()}
                    >
                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={isPending}
                        >
                            {isPending ? "Đang nhập..." : "Nhập hàng"}
                        </Button>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function todayYmd() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
