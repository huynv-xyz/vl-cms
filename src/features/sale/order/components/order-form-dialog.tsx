import type { Dispatch, SetStateAction } from "react"
import { FileEdit, FilePlus, Loader2, Save, ShoppingCart, X, type LucideIcon } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

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
            <DialogContent className="bg-muted/30 flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-6xl">
                <DialogHeader className="bg-background border-b px-8 py-5">
                    <div className="flex items-start gap-4">
                        <div className={`${meta.iconClassName} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                                {meta.eyebrow}
                            </div>
                            <DialogTitle className="mt-0.5 flex flex-wrap items-baseline gap-2 text-xl">
                                {meta.title}
                                {orderNo && (
                                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-sm font-bold">
                                        {orderNo}
                                    </span>
                                )}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-sm">
                                {meta.description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!ready ? (
                    <div className="flex-1 space-y-4 px-8 py-6">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <>
                        <form
                            id={formId}
                            className="min-h-0 flex-1 overflow-y-auto px-8 py-6 bg-white"
                            onSubmit={(event) => {
                                event.preventDefault()
                                submit()
                            }}
                        >
                            <div className="space-y-5">
                                <OrderFormCard
                                    step={1}
                                    title="Thông tin đơn"
                                    description={orderNo ? `Mã đơn ${orderNo}.` : "Chọn khách hàng, nhân viên phụ trách và ngày đặt hàng."}
                                >
                                    <OrderHeaderFields
                                        value={headerData}
                                        onChange={setHeaderData}
                                        showStatus={showStatus}
                                    />
                                </OrderFormCard>

                                <OrderFormCard
                                    step={2}
                                    title="Hàng bán"
                                    description="Chọn sản phẩm, nhập số lượng và đơn giá cho từng dòng."
                                    icon={ShoppingCart}
                                >
                                    <OrderItemsEditor items={items} setItems={setItems} />
                                </OrderFormCard>
                            </div>
                        </form>

                        <DialogFooter className="bg-background flex-col gap-0 border-t p-0 sm:flex-col sm:gap-0">
                            <OrderSummaryBar
                                lineCount={items.length}
                                totalQty={totalQty}
                                totalAmount={totalAmount}
                            />
                            <div className="flex w-full items-center justify-end gap-2 border-t px-8 py-4">
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
                                    {!isPending && totalAmount > 0 && (
                                        <span className="bg-primary-foreground/15 ml-2 rounded px-1.5 py-0.5 text-[11px] font-mono">
                                            {formatCurrency(totalAmount)}
                                        </span>
                                    )}
                                </Button>
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
