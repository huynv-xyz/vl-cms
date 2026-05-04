import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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

import {
    createProduction,
    getActiveBomByProduct,
} from "@/api/inventory/production"

import { BomPreview } from "./bom-preview"
import { ProductionExtrasEditor } from "./production-extras-editor"
import { ProductionSubstitutionsEditor } from "./production-substitutions-editor"
import { productionSchema, productionUiSchema } from "./production-form-schema"

export function CreateProductionDialog({ open, onOpenChange }: any) {
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState<any>({
        product_id: undefined,
        warehouse_id: undefined,
        production_date: new Date().toISOString().slice(0, 10),
        quantity_plan: 1,
        quantity_done: 1,
        unit_cost: 0,
        status: "PLANNED",
    })

    const [extras, setExtras] = useState<any[]>([])
    const [substitutions, setSubstitutions] = useState<any[]>([])

    const { data: bom, isLoading: bomLoading } = useQuery({
        queryKey: ["active-bom", formData.product_id],
        queryFn: () => getActiveBomByProduct(formData.product_id),
        enabled: open && !!formData.product_id,
    })

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!formData.product_id) throw new Error("Chưa chọn thành phẩm")
            if (!formData.warehouse_id) throw new Error("Chưa chọn kho")
            if ((formData.quantity_plan ?? 0) <= 0) throw new Error("SL kế hoạch phải > 0")
            if ((formData.quantity_done ?? 0) <= 0) throw new Error("SL hoàn thành phải > 0")

            return createProduction({
                ...formData,
                extras: extras.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    lot_id: i.lot_id || undefined,
                    note: i.note,
                })),
                substitutions: substitutions.map((i) => ({
                    original_product_id: i.original_product_id,
                    substitute_product_id: i.substitute_product_id,
                    quantity: i.quantity,
                })),
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["productions"] })
            toast.success("Tạo lệnh sản xuất thành công")
            onOpenChange(false)
            setExtras([])
            setSubstitutions([])
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Tạo lệnh sản xuất</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    <Form
                        validator={rjsfValidator}
                        schema={productionSchema}
                        uiSchema={productionUiSchema}
                        formData={formData}
                        widgets={widgets}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        onChange={({ formData }) => {
                            setFormData(formData)
                            setSubstitutions([])
                        }}
                        onSubmit={() => mutate()}
                    >
                        <div className="space-y-4">
                            <BomPreview
                                bom={bom}
                                quantityPlan={formData.quantity_plan}
                                isLoading={bomLoading}
                            />

                            <ProductionExtrasEditor
                                items={extras}
                                setItems={setExtras}
                                warehouseId={formData.warehouse_id}
                            />

                            <ProductionSubstitutionsEditor
                                bom={bom}
                                items={substitutions}
                                setItems={setSubstitutions}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={isPending}
                        >
                            {isPending ? "Đang tạo..." : "Tạo lệnh sản xuất"}
                        </Button>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}