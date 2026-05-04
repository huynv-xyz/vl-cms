import { useEffect, useState } from "react"
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
    getProduction,
    updateProduction,
    getActiveBomByProduct,
} from "@/api/inventory/production"

import { productionSchema, productionUiSchema } from "./production-form-schema"
import { BomPreview } from "./bom-preview"
import { ProductionExtrasEditor } from "./production-extras-editor"
import { ProductionSubstitutionsEditor } from "./production-substitutions-editor"
import type { ProductionOrder } from "../data/schema"

type Props = {
    production: ProductionOrder
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateProductionDialog({
    production,
    open,
    onOpenChange,
}: Props) {
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ["production-detail", production?.id],
        queryFn: () => getProduction(production.id),
        enabled: open && !!production?.id,
    })

    const [formData, setFormData] = useState<any>({
        product_id: undefined,
        warehouse_id: undefined,
        production_date: "",
        quantity_plan: 1,
        quantity_done: 1,
        unit_cost: 0,
        status: "PLANNED",
    })

    const [extras, setExtras] = useState<any[]>([])
    const [substitutions, setSubstitutions] = useState<any[]>([])

    useEffect(() => {
        if (!open || !data) return

        setFormData({
            product_id: data.product_id,
            warehouse_id: data.warehouse_id,
            production_date: data.production_date,
            quantity_plan: data.quantity_plan ?? 1,
            quantity_done: data.quantity_done ?? 1,
            unit_cost: data.unit_cost ?? 0,
            status: data.status ?? "PLANNED",
        })

        setExtras(data.extras ?? [])
        setSubstitutions(data.substitutions ?? [])
    }, [open, data])

    const { data: bom, isLoading: bomLoading } = useQuery({
        queryKey: ["active-bom", formData.product_id],
        queryFn: () => getActiveBomByProduct(formData.product_id),
        enabled: open && !!formData.product_id,
    })

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            return updateProduction({
                id: production.id,
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
            await queryClient.invalidateQueries({
                queryKey: ["production-detail", production.id],
            })
            toast.success("Cập nhật lệnh sản xuất thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Cập nhật lệnh sản xuất</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-4 text-sm">Đang tải dữ liệu...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <Form
                            validator={rjsfValidator}
                            schema={productionSchema}
                            uiSchema={productionUiSchema}
                            formData={formData}
                            widgets={widgets}
                            templates={{ FieldTemplate: ShadcnFieldTemplate }}
                            onChange={({ formData }) => setFormData(formData)}
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
                                {isPending ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </Form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}