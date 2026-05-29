import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

import { updateReturn, getReturn } from "@/api/sale/return"
import { getExport } from "@/api/sale/export"

import { ReturnItemsEditor } from "./return-items-editor"
import { ReturnHeaderFields } from "./return-header-fields"

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
        customer_id: undefined,
        export_id: undefined,
        return_date: "",
        export_created_at: undefined,
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
            customer_id: detail.customer?.id ?? detail.order?.customer_id,
            export_id: detail.export_id,
            return_date: dateOnly(detail.created_at),
            reason: detail.reason ?? "",
            status: detail.status ?? "NEW",
        })
    }, [open, detail])

    useEffect(() => {
        if (!open || !exportDetail) return

        setFormData((current: any) => ({
            ...current,
            export_created_at: exportDetail.created_at,
        }))
    }, [open, exportDetail])

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
            if (!formData.export_id) throw new Error("Vui lòng chọn phiếu xuất")

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
                return_date: formData.return_date,
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
            <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-5xl">

                <DialogHeader className="border-b px-8 py-6">
                    <DialogTitle>Cập nhật phiếu trả</DialogTitle>
                    <DialogDescription>
                        Điều chỉnh lý do và số lượng hàng trả.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex-1 p-8 text-sm text-muted-foreground">Đang tải...</div>
                ) : (
                    <>
                    <div className="flex-1 overflow-y-auto px-8 py-6">

                        <form
                            id="return-update-form"
                            className="space-y-6"
                            onSubmit={(event) => {
                                event.preventDefault()
                                mutate()
                            }}
                        >
                            <div className="rounded-lg border bg-muted/20 p-4">
                                <div className="mb-4">
                                    <div className="text-base font-semibold">Thông tin trả hàng</div>
                                    <div className="text-sm text-muted-foreground">
                                        Cập nhật lý do và trạng thái phiếu trả.
                                    </div>
                                </div>
                                <ReturnHeaderFields
                                    value={formData}
                                    lockedExport
                                    showStatus
                                    onChange={setFormData}
                                />
                                {exportDetail?.order_id && (
                                    <div className="mt-3 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                                        Đơn hàng:{" "}
                                        <span className="font-medium text-foreground">
                                            {exportDetail.order?.order_no ?? `#${exportDetail.order_id}`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <ReturnItemsEditor
                                exportItems={exportItems}
                                items={items}
                                onChange={setItems}
                            />

                        </form>

                    </div>
                    <DialogFooter className="border-t px-8 py-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" form="return-update-form" disabled={isPending}>
                            <Save className="mr-2 h-4 w-4" />
                            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function dateOnly(value?: string | number[]) {
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return ""
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }

    return value ? value.split("T")[0].split(" ")[0] : ""
}
