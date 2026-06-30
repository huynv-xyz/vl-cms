import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { createReturn } from "@/api/sale/return"
import { getExport } from "@/api/sale/export"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { ManualReturnItemsEditor } from "./manual-return-items-editor"
import { ReturnHeaderFields } from "./return-header-fields"
import { ReturnItemsEditor } from "./return-items-editor"

export function CreateReturnDialog({ open, onOpenChange, order }: any) {
    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const [formData, setFormData] = useState<any>({
        customer_id: order?.customer_id,
        return_type: "FROM_EXPORT",
        export_id: undefined,
        return_date: todayYmd(),
        export_date: undefined,
        status: "NEW",
        reason: "",
    })

    const exportId = formData.export_id
    const isManualReturn = formData.return_type === "MANUAL"

    const { data: exportDetail, isLoading } = useQuery({
        queryKey: ["export-detail", exportId],
        queryFn: () => getExport(exportId),
        enabled: open && !!exportId && !isManualReturn,
    })

    const mappedItems = useMemo(() => {
        if (!exportDetail?.items) return []

        return exportDetail.items.map((item: any) => ({
            order_item_id: item.order_item_id,
            product_id: item.product_id,
            product: item.product,
            warehouse_id: item.warehouse_id,
            selected: false,
            quantity: 0,
        }))
    }, [exportDetail])

    const [items, setItems] = useState<any[]>([])

    useEffect(() => {
        if (!open) {
            initializedRef.current = false
            setFormData({
                customer_id: order?.customer_id,
                return_type: "FROM_EXPORT",
                export_id: undefined,
                return_date: todayYmd(),
                export_date: undefined,
                status: "NEW",
                reason: "",
            })
            setItems([])
        }
    }, [open, order?.customer_id])

    useEffect(() => {
        if (!open || !exportId || isManualReturn || isLoading) return

        if (!initializedRef.current) {
            setItems(mappedItems)
            initializedRef.current = true
        }
    }, [open, exportId, isManualReturn, isLoading, mappedItems])

    useEffect(() => {
        if (!open || !exportDetail || isManualReturn) return

        const exportDateValue = exportDetail.export_date || exportDetail.created_at
        const exportDate = dateOnly(exportDateValue)
        const currentReturnDate = formData.return_date || todayYmd()
        const nextReturnDate = exportDate && currentReturnDate < exportDate
            ? exportDate
            : currentReturnDate

        setFormData((current: any) => ({
            ...current,
            export_date: exportDateValue,
            return_date: nextReturnDate,
        }))
    }, [open, exportDetail, isManualReturn, formData.return_date])

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!isManualReturn && !exportId) {
                throw new Error("Vui lòng chọn phiếu xuất")
            }

            if (isManualReturn && !formData.customer_id) {
                throw new Error("Vui lòng chọn khách hàng")
            }

            const selected = isManualReturn ? items : items.filter((item) => item.selected)

            if (!selected.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            for (const item of selected) {
                if ((item.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng trả phải > 0")
                }
            }

            if (selected.some((item) => !item.warehouse_id)) {
                throw new Error("Vui lòng chọn kho nhập lại cho tất cả dòng trả")
            }

            if (isManualReturn && selected.some((item) => !item.product_id || item.unit_price == null || item.unit_price < 0)) {
                throw new Error("Vui lòng chọn sản phẩm và đơn giá hợp lệ")
            }

            return createReturn({
                return_type: formData.return_type,
                customer_id: formData.customer_id,
                export_id: isManualReturn ? undefined : exportId,
                order_id: isManualReturn ? undefined : order?.id ?? exportDetail?.order_id,
                return_date: formData.return_date,
                status: formData.status,
                reason: formData.reason,
                items: selected.map((item) => ({
                    order_item_id: item.order_item_id,
                    product_id: item.product_id,
                    warehouse_id: item.warehouse_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    note: item.note ?? "",
                })) as any,
            })
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["returns"] })
            await queryClient.refetchQueries({ queryKey: ["returns"], type: "active" })
            if (order?.id) {
                await queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] })
            }
            toast.success("Tạo phiếu trả thành công")
            onOpenChange(false)
        },

        onError: (error: any) => {
            toast.error(error.message || "Lỗi")
        },
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[92vh] w-[98vw] max-w-[98vw] flex-col p-0 sm:max-w-[1800px]">
                <DialogHeader className="border-b px-8 py-5">
                    <DialogTitle>Tạo phiếu trả</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-4">
                    <form
                        id="return-create-form"
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault()
                            mutate()
                        }}
                    >
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <ReturnHeaderFields
                                value={formData}
                                order={order}
                                lockedCustomer={!!order?.id}
                                onChange={(next) => {
                                    const changed = next.export_id !== exportId || next.return_type !== formData.return_type
                                    setFormData(next)
                                    if (changed) {
                                        initializedRef.current = false
                                        setItems([])
                                    }
                                }}
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

                        {isManualReturn ? (
                            <ManualReturnItemsEditor
                                items={items}
                                onChange={setItems}
                            />
                        ) : !exportId ? (
                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                Chọn phiếu xuất để hiển thị hàng có thể trả.
                            </div>
                        ) : isLoading ? (
                            <div className="rounded-lg border p-8 text-center text-muted-foreground">
                                Đang tải sản phẩm...
                            </div>
                        ) : (
                            <ReturnItemsEditor
                                exportItems={exportDetail?.items ?? []}
                                items={items}
                                onChange={setItems}
                            />
                        )}
                    </form>
                </div>

                <DialogFooter className="border-t px-8 py-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button type="submit" form="return-create-form" disabled={isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {isPending ? "Đang tạo..." : "Tạo phiếu trả"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function todayYmd() {
    return dateToYmd(new Date())
}

function dateToYmd(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function dateOnly(value?: string | number[]) {
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return ""
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }

    if (!value) return ""

    const datePart = value.split("T")[0].split(" ")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart

    const match = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
    if (!match) return datePart

    const [, day, month, year] = match
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
