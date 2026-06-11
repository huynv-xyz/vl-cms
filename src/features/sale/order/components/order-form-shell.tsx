import { Card } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import { Boxes, Hash, Wallet, type LucideIcon } from "lucide-react"

export function OrderFormCard({
    step,
    title,
    icon: Icon,
    action,
    children,
}: {
    step?: number
    title: string
    icon?: LucideIcon
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <div className="border-b px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                    {typeof step === "number" ? (
                        <div className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm">
                            {step}
                        </div>
                    ) : Icon ? (
                        <div className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                            <Icon className="h-3.5 w-3.5" />
                        </div>
                    ) : null}
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold leading-tight">{title}</h3>
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            </div>
            <div className="p-3">{children}</div>
        </Card>
    )
}

export function OrderSummaryBar({
    lineCount,
    totalQty,
    totalAmount,
}: {
    lineCount: number
    totalQty: number
    totalAmount: number
}) {
    return (
        <div className="grid min-w-[520px] max-w-[720px] flex-1 grid-cols-3 gap-0 divide-x overflow-hidden rounded-md border bg-muted/30">
            <SummaryStat icon={Hash} label="Số dòng hàng" value={formatNumber(lineCount)} />
            <SummaryStat icon={Boxes} label="Tổng số lượng" value={formatNumber(totalQty)} />
            <SummaryStat
                icon={Wallet}
                label="Tổng tiền"
                value={formatCurrency(totalAmount)}
                strong
            />
        </div>
    )
}

function SummaryStat({
    icon: Icon,
    label,
    value,
    strong,
}: {
    icon: LucideIcon
    label: string
    value: string
    strong?: boolean
}) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5">
            <div
                className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    strong ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
            >
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                    {label}
                </div>
                <div
                    className={cn(
                        "mt-0.5 truncate tabular-nums",
                        strong ? "text-primary text-base font-bold" : "text-foreground text-sm font-semibold"
                    )}
                >
                    {value}
                </div>
            </div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0))
}
