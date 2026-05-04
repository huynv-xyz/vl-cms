import { useEffect, useRef, useState } from "react"
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

import { updateReturn, getReturn } from "@/api/sale/return"
import { getExport } from "@/api/sale/export"

import { returnSchema, returnUiSchema } from "./return-form-schema"
import { ReturnItemsEditor } from "./return-items-editor"

type Props = {
    returnData: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UpdateReturnDialog({
    returnData,
    open,
    onOpenChange,
}: Props) {

    const qc = useQueryClient()
    const initializedRef = useRef(false)

    // ===== load return
    const { data: detail, isLoading } = useQuery({
        queryKey: ["return-detail", returnData?.id],
        queryFn: () => getReturn(returnData.id),
        enabled: open && !!returnData?.id,
    })

    const exportId = detail?.export_id

    const { data: exportDetail } = useQuery({
        queryKey: ["export-detail", exportId],
        queryFn: () => getExport(exportId as any),
        enabled: open && !!exportId,
    })

    const exportItems = exportDetail?.items ?? []

    // ===== FORM (CHỈ GIỮ FIELD CẦN)
    const [formData, setFormData] = useState<any>({
        export_id: undefined,
        reason: "",
        status: "NEW",
    })

    // ===== ITEMS
    const [items, setItems] = useState<any[]>([])

    // ========================
    // INIT HEADER
    // ========================
    useEffect(() => {
        if (!open || !detail) return

        setFormData({
            export_id: detail.export_id,
            reason: detail.reason ?? "",
            status: detail.status ?? "NEW",
        })
    }, [open, detail])

    // ========================
    // INIT ITEMS
    // ========================
    useEffect(() => {
        if (!open || !detail || !exportDetail || initializedRef.current) return

        const existingMap = new Map(
            (detail.items ?? []).map((i: any) => [i.product_id, i])
        )

        const mapped = exportItems.map((e: any) => {
            const existing = existingMap.get(e.product_id)

            return {
                product_id: e.product_id,
                product: e.product,
                selected: !!existing,
                quantity: existing?.quantity ?? 0,
                note: existing?.note ?? "",
            }
        })

        setItems(mapped)
        initializedRef.current = true

    }, [open, detail, exportDetail, exportItems])

    // reset
    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            setItems([])
        }
    }, [open])

    // ========================
    // MUTATION
    // ========================
    const { mutate, isPending } = useMutation({

        mutationFn: async () => {

            const selected = items.filter(x => x.selected)

            if (!selected.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            for (const i of selected) {
                if ((i.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng phải > 0")
                }
            }

            return updateReturn({
                id: returnData.id,
                export_id: formData.export_id,
                order_id: exportDetail?.order_id,
                status: formData.status,
                reason: formData.reason,
                items: selected.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    note: i.note ?? "",
                } as any)),
            } as any)
        },

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["returns"] })
            toast.success("Cập nhật phiếu trả thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    // ========================
    // RENDER
    // ========================
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] flex-col sm:max-w-6xl">

                <DialogHeader>
                    <DialogTitle>Cập nhật phiếu trả</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="p-4 text-sm">Đang tải...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">

                        {/* 👇 HIỂN THỊ ORDER */}
                        {exportDetail?.order_id && (
                            <div className="mb-3 text-sm text-muted-foreground">
                                Đơn hàng: <b>#{exportDetail.order_id}</b>
                            </div>
                        )}

                        <Form
                            validator={rjsfValidator}
                            schema={returnSchema}
                            uiSchema={{
                                ...returnUiSchema,
                                export_id: {
                                    ...returnUiSchema.export_id,
                                    "ui:disabled": true, // 👈 khóa export
                                },
                            }}
                            formData={formData}
                            widgets={widgets}
                            templates={{ FieldTemplate: ShadcnFieldTemplate }}
                            onChange={({ formData }) => setFormData(formData)}
                            onSubmit={() => mutate()}
                        >

                            <ReturnItemsEditor
                                exportItems={exportItems}
                                items={items}
                                onChange={setItems}
                            />

                            <Button
                                type="submit"
                                className="w-full mt-4"
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