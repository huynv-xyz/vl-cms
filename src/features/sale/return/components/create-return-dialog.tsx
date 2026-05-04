import { useEffect, useMemo, useRef, useState } from "react"
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

import { createReturn } from "@/api/sale/return"
import { getExport } from "@/api/sale/export"

import { returnSchema, returnUiSchema } from "./return-form-schema"
import { ReturnItemsEditor } from "./return-items-editor"

export function CreateReturnDialog({ open, onOpenChange }: any) {

    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const [formData, setFormData] = useState<any>({
        export_id: undefined,
        status: "NEW",
        reason: "",
    })

    const exportId = formData.export_id

    // ===== load export
    const { data: exportDetail, isLoading } = useQuery({
        queryKey: ["export-detail", exportId],
        queryFn: () => getExport(exportId),
        enabled: open && !!exportId,
    })

    // ===== map items
    const mappedItems = useMemo(() => {
        if (!exportDetail?.items) return []

        return exportDetail.items.map((i: any) => ({
            product_id: i.product_id,
            product: i.product,
            selected: false,
            quantity: 0,
        }))
    }, [exportDetail])

    const [items, setItems] = useState<any[]>([])

    // reset
    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            setItems([])
        }
    }, [open])

    // init items
    useEffect(() => {
        if (!open || !exportId || isLoading) return

        if (!initializedRef.current) {
            setItems(mappedItems)
            initializedRef.current = true
        }

    }, [open, exportId, isLoading, mappedItems])

    // submit
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {

            const selected = items.filter(x => x.selected)

            if (!selected.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            return createReturn({
                export_id: exportId,
                order_id: exportDetail?.order_id, // 👈 lấy từ export
                status: formData.status,
                reason: formData.reason,
                items: selected.map(i => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                })) as any,
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["returns"] })
            toast.success("Tạo phiếu trả thành công")
            onOpenChange(false)
        },

        onError: (e: any) => {
            toast.error(e.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[90vh] flex-col sm:max-w-6xl">
                <DialogHeader>
                    <DialogTitle>Tạo phiếu trả</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">

                    {/* 👇 HIỂN THỊ ORDER */}
                    {exportDetail?.order_id && (
                        <div className="mb-3 text-sm text-muted-foreground">
                            Đơn hàng ID:{" "}
                            <span className="font-medium">
                                #{exportDetail.order_id}
                            </span>
                        </div>
                    )}

                    <Form
                        validator={rjsfValidator}
                        schema={returnSchema}
                        uiSchema={returnUiSchema}
                        formData={formData}
                        widgets={widgets}
                        templates={{ FieldTemplate: ShadcnFieldTemplate }}
                        onChange={({ formData }) => {

                            const changed = formData.export_id !== exportId

                            setFormData(formData)

                            if (changed) {
                                initializedRef.current = false
                                setItems([])
                            }
                        }}
                        onSubmit={() => mutate()}
                    >
                        {!exportId ? (
                            <div>Chọn phiếu xuất để hiển thị sản phẩm</div>
                        ) : isLoading ? (
                            <div>Đang tải sản phẩm...</div>
                        ) : (
                            <ReturnItemsEditor
                                exportItems={exportDetail?.items ?? []}
                                items={items}
                                onChange={setItems}
                            />
                        )}

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            disabled={isPending}
                        >
                            {isPending ? "Đang tạo..." : "Tạo phiếu trả"}
                        </Button>
                    </Form>

                </div>
            </DialogContent>
        </Dialog>
    )
}