import { useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn, formatNumber } from "@/lib/utils"
import { DialogLoadingState } from "@/components/loading-state"

type Props = {
    open: boolean
    id?: number
    onClose: () => void
    queryKey: any[]
    queryFn: (id: number) => Promise<any>
    title: string
    description?: string
    render: (data: any) => React.ReactNode
}

export function BaseDetailDialog({
    open,
    id,
    onClose,
    queryKey,
    queryFn,
    title,
    description,
    render,
}: Props) {

    const query: any = useQuery({
        queryKey: [...queryKey, id],
        queryFn: () => queryFn(id!),
        enabled: open && !!id,
    })

    const data = query.data?.data ?? query.data

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[88vh] w-[min(96vw,980px)] !max-w-none flex-col gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b bg-muted/20 px-6 py-5">
                    <DialogTitle className="text-xl font-semibold tracking-normal">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {query.isLoading && (
                        <DialogLoadingState />
                    )}

                    {data && render(data)}
                </div>

            </DialogContent>
        </Dialog>
    )
}

export function DetailSummary({
    title,
    subtitle,
    status,
}: {
    title?: string
    subtitle?: string
    status?: string
}) {
    return (
        <div className="mb-4 rounded-md border bg-muted/20 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">
                        {title || "-"}
                    </div>
                    {subtitle && (
                        <div className="mt-1 text-sm text-muted-foreground">
                            {subtitle}
                        </div>
                    )}
                </div>
                {status && <DetailStatusBadge status={status} />}
            </div>
        </div>
    )
}

export function DetailInfoGrid({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {children}
        </div>
    )
}

export function DetailInfoItem({
    label,
    value,
    className,
}: {
    label: string
    value?: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("rounded-md border bg-background px-3 py-2", className)}>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 min-h-5 break-words text-sm font-medium">
                {value || "-"}
            </div>
        </div>
    )
}

export function DetailStatusBadge({ status }: { status?: string }) {
    const value = String(status || "-").toUpperCase()
    const done = ["DONE", "COMPLETED", "PAID"].includes(value)
    const bad = ["CANCELLED", "ERROR", "FAILED"].includes(value)

    return (
        <Badge variant={bad ? "destructive" : done ? "secondary" : "outline"}>
            {value}
        </Badge>
    )
}

export function DetailItemsTable({
    items,
    empty = "Chưa có sản phẩm",
}: {
    items?: any[]
    empty?: string
}) {
    return (
        <div className="mt-4 overflow-hidden rounded-md border">
            <table className="w-full text-sm">
                <thead className="bg-muted/60">
                    <tr>
                        <th className="px-3 py-2 text-left font-medium">Mã sản phẩm</th>
                        <th className="px-3 py-2 text-left font-medium">Tên sản phẩm</th>
                        <th className="px-3 py-2 text-left font-medium">ĐVT</th>
                        <th className="px-3 py-2 text-right font-medium">SL</th>
                    </tr>
                </thead>
                <tbody>
                    {items?.length ? (
                        items.map((item) => (
                            <tr key={item.id} className="border-t">
                                <td className="px-3 py-2 align-top font-medium">
                                    {item.product?.code || "-"}
                                </td>
                                <td className="px-3 py-2 align-top">
                                    {item.product?.name || "-"}
                                </td>
                                <td className="px-3 py-2 align-top text-muted-foreground">
                                    {item.product?.unit || "-"}
                                </td>
                                <td className="px-3 py-2 text-right align-top font-medium">
                                    {formatNumber(Number(item.quantity))}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                                {empty}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
