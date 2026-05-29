import { useEffect, useMemo, useRef, useState } from "react"
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

import { createReturn } from "@/api/sale/return"
import { getExport } from "@/api/sale/export"

import { ReturnItemsEditor } from "./return-items-editor"
import { ReturnHeaderFields } from "./return-header-fields"

export function CreateReturnDialog({ open, onOpenChange }: any) {

    const queryClient = useQueryClient()
    const initializedRef = useRef(false)

    const [formData, setFormData] = useState<any>({
        customer_id: undefined,
        export_id: undefined,
        return_date: todayYmd(),
        export_created_at: undefined,
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
            setFormData({
                customer_id: undefined,
                export_id: undefined,
                return_date: todayYmd(),
                export_created_at: undefined,
                status: "NEW",
                reason: "",
            })
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

    useEffect(() => {
        if (!open || !exportDetail) return

        const exportCreatedAt = exportDetail.created_at
        const exportDate = dateOnly(exportCreatedAt)
        const currentReturnDate = formData.return_date || todayYmd()
        const nextReturnDate = exportDate && currentReturnDate <= exportDate
            ? nextDayYmd(exportDate)
            : currentReturnDate

        setFormData((current: any) => ({
            ...current,
            export_created_at: exportCreatedAt,
            return_date: nextReturnDate,
        }))
    }, [open, exportDetail])

    // submit
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!exportId) throw new Error("Vui lòng chọn phiếu xuất")

            const selected = items.filter(x => x.selected)

            if (!selected.length) {
                throw new Error("Phải chọn ít nhất 1 sản phẩm")
            }

            for (const item of selected) {
                if ((item.quantity ?? 0) <= 0) {
                    throw new Error("Số lượng trả phải > 0")
                }
            }

            return createReturn({
                export_id: exportId,
                order_id: exportDetail?.order_id, // 👈 lấy từ export
                return_date: formData.return_date,
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
            <DialogContent className="flex max-h-[92vh] flex-col p-0 sm:max-w-5xl">
                <DialogHeader className="border-b px-8 py-6">
                    <DialogTitle>Tạo phiếu trả</DialogTitle>
                    <DialogDescription>
                        Chọn phiếu xuất và các sản phẩm khách trả lại.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-6">

                    <form
                        id="return-create-form"
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
                                    Chọn phiếu xuất và nhập lý do khách trả hàng.
                                </div>
                            </div>
                            <ReturnHeaderFields
                                value={formData}
                                onChange={(next) => {
                                    const changed = next.export_id !== exportId
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

                        {!exportId ? (
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
    const now = new Date()
    return dateToYmd(now)
}

function nextDayYmd(value: string) {
    const date = new Date(`${value}T00:00:00`)
    date.setDate(date.getDate() + 1)
    return dateToYmd(date)
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

    return value ? value.split("T")[0].split(" ")[0] : ""
}
