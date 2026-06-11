import type { Dispatch, SetStateAction } from "react"
import { useState } from "react"
import { FileEdit, FilePlus, Loader2, Plus, Save, ShoppingCart, X, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { OrderFormCard, OrderSummaryBar } from "./order-form-shell"
import { OrderHeaderFields } from "./order-header-fields"
import { OrderItemsEditor, type OrderItem } from "./order-items-editor"

export type OrderHeaderForm = {
    customer_id?: number
    employee_id?: number
    order_date?: string
    status?: string
    note?: string
}

type Props = {
    mode: "create" | "update"
    open: boolean
    onOpenChange: (open: boolean) => void
    headerData: OrderHeaderForm | null
    setHeaderData: Dispatch<SetStateAction<any>>
    items: OrderItem[]
    setItems: Dispatch<SetStateAction<any[]>>
    orderNo?: string
    isLoading?: boolean
    isPending?: boolean
    showStatus?: boolean
    onSubmit: () => void
}

const DIALOG_META: Record<Props["mode"], {
    icon: LucideIcon
    iconClassName: string
    eyebrow: string
    title: string
    description: string
    submitLabel: string
    pendingLabel: string
}> = {
    create: {
        icon: FilePlus,
        iconClassName: "bg-primary text-primary-foreground",
        eyebrow: "Bán hàng · Đơn hàng mới",
        title: "Tạo đơn hàng",
        description: "Chọn khách hàng, nhân viên phụ trách và thêm sản phẩm cần bán.",
        submitLabel: "Tạo đơn hàng",
        pendingLabel: "Đang tạo đơn...",
    },
    update: {
        icon: FileEdit,
        iconClassName: "bg-amber-500 text-white",
        eyebrow: "Bán hàng · Cập nhật đơn",
        title: "Cập nhật đơn hàng",
        description: "Điều chỉnh thông tin đơn và danh sách sản phẩm bán.",
        submitLabel: "Lưu thay đổi",
        pendingLabel: "Đang lưu...",
    },
}

export function OrderFormDialog({
    mode,
    open,
    onOpenChange,
    headerData,
    setHeaderData,
    items,
    setItems,
    orderNo,
    isLoading,
    isPending,
    showStatus = true,
    onSubmit,
}: Props) {
    const meta = DIALOG_META[mode]
    const Icon = meta.icon
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalAmount = items.reduce((sum, item) => {
        if (item.line_type === "PROMOTION") return sum
        const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
        return sum + Math.max(lineTotal - Number(item.discount || 0), 0)
    }, 0)
    const formId = mode === "create" ? "order-create-form" : "order-update-form"
    const ready = !isLoading && !!headerData
    const [addItemRequest, setAddItemRequest] = useState(0)

    const submit = () => {
        const error = validateOrderForm(headerData, items)
        if (error) {
            toast.error(error)
            return
        }
        onSubmit()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-muted/30 flex max-h-[96vh] !w-[calc(100vw-32px)] !max-w-[1600px] flex-col gap-0 p-0">
                <DialogHeader className="bg-background border-b px-4 py-3">
                    <div className="flex items-start gap-3">
                        <div className={`${meta.iconClassName} flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                                {meta.eyebrow}
                            </div>
                            <DialogTitle className="mt-0.5 flex flex-wrap items-baseline gap-2 text-lg">
                                {meta.title}
                                {orderNo && (
                                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-sm font-bold">
                                        {orderNo}
                                    </span>
                                )}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                {!ready ? (
                    <div className="flex-1 space-y-3 px-4 py-3">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <>
                        <form
                            id={formId}
                            className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-3"
                            onSubmit={(event) => {
                                event.preventDefault()
                                submit()
                            }}
                        >
                            <div className="space-y-3">
                                <OrderFormCard
                                    step={1}
                                    title="Thông tin đơn"
                                >
                                    <OrderHeaderFields
                                        value={headerData}
                                        onChange={setHeaderData}
                                        showStatus={showStatus}
                                    />
                                </OrderFormCard>                                <OrderFormCard
                                    step={2}
                                    title="Hàng bán"
                                    icon={ShoppingCart}
                                    action={
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => setAddItemRequest((value) => value + 1)}
                                        >
                                            <Plus className="mr-1.5 h-3.5 w-3.5" />
                                            Thêm dòng
                                        </Button>
                                    }
                                >
                                    <OrderItemsEditor
                                        items={items}
                                        setItems={setItems}
                                        addRequest={addItemRequest}
                                    />
                                </OrderFormCard>
                            </div>
                        </form>

                        <DialogFooter className="bg-background block border-t p-0">
                            <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-2">
                                <OrderSummaryBar
                                    lineCount={items.length}
                                    totalQty={totalQty}
                                    totalAmount={totalAmount}
                                />
                                <div className="flex items-center justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        <X className="mr-2 h-4 w-4" />
                                        Hủy
                                    </Button>
                                    <Button type="submit" form={formId} disabled={isPending}>
                                        {isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        {isPending ? meta.pendingLabel : meta.submitLabel}
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function validateOrderForm(headerData: OrderHeaderForm | null, items: OrderItem[]) {
    if (!headerData?.customer_id) return "Chưa chọn khách hàng"
    if (!items.length) return "Phải có ít nhất 1 sản phẩm"

    for (const item of items) {
        if (!item.product_id) return "Chưa chọn sản phẩm"
        if ((item.quantity ?? 0) <= 0) return "Số lượng phải > 0"
    }

    return null
}
