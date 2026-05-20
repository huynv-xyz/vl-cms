import { useQuery } from "@tanstack/react-query"
import type React from "react"
import { getOrder } from "@/api/sale/order"
import { OrderDeliveries } from "./components/order-deliveries"
import { OrderExports } from "./components/order-export"
import { OrderItems } from "./components/order-items"
import { OrderReturns } from "./components/order-returns"
import { OrderInfo } from "./components/order-info"
import { OrderReceipts } from "./components/order-receipts"
import { formatCurrency } from "@/lib/utils"
import {
    Package,
    Truck,
    Warehouse,
    RotateCcw,
    Wallet,
    Coins,
    PackageCheck,
    PackageX,
    type LucideIcon,
} from "lucide-react"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { PageSection } from "@/components/page-section"

type Props = { id: number }

export default function OrderDetailPage({ id }: Props) {

    const query: any = useQuery({
        queryKey: ["order-detail", id],
        queryFn: () => getOrder(id),
        enabled: !!id,
    })

    const data: any = query.data?.data ?? query.data

    return (
        <PageSection
            isLoading={query.isLoading}
            error={query.error}
            data={data}
            title="Chi tiết đơn hàng"
            description="Theo dõi tiến độ giao hàng, xuất kho, trả hàng và công nợ cho đơn."
            showBack
        >
            {(data) => {
                const isEditable = data.status === "CONFIRMED"
                const items = data.items || []
                const deliveries = data.deliveries || []
                const exports = data.exports || []
                const receipts = data.receipts || []
                const returns = data.returns || []

                const totalAmount = Number(data.total_amount || 0)
                const totalQty = items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)
                const exportedQty = items.reduce((s: number, i: any) => s + Number(i.exported_quantity || 0), 0)
                const remainQty = items.reduce((s: number, i: any) => s + Number(i.remain_quantity || 0), 0)
                const returnedQty = items.reduce((s: number, i: any) => s + Number(i.returned_quantity || 0), 0)
                const paidAmount = receipts.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)

                const remainAmount = Math.max(totalAmount - paidAmount, 0)
                const paidPct = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0
                const exportPct = totalQty > 0 ? Math.min((exportedQty / totalQty) * 100, 100) : 0

                return (
                    <div className="space-y-6">

                        <OrderInfo order={data} />

                        {/* KPI METRICS */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Metric
                                icon={Coins}
                                tone="primary"
                                label="Tổng giá trị đơn"
                                value={formatCurrency(totalAmount)}
                                sub={`${formatNumber(items.length)} sản phẩm`}
                            />
                            <Metric
                                icon={Wallet}
                                tone={paidAmount >= totalAmount && totalAmount > 0 ? "ok" : "info"}
                                label="Đã thu / Phải thu"
                                value={formatCurrency(paidAmount)}
                                sub={
                                    remainAmount > 0
                                        ? `Còn ${formatCurrency(remainAmount)}`
                                        : "Đã thu đủ"
                                }
                                progress={paidPct}
                                progressTone={paidAmount >= totalAmount && totalAmount > 0 ? "ok" : "info"}
                            />
                            <Metric
                                icon={PackageCheck}
                                tone={remainQty > 0 ? "warn" : "ok"}
                                label="Đã xuất / Đặt"
                                value={`${formatNumber(exportedQty)} / ${formatNumber(totalQty)}`}
                                sub={
                                    remainQty > 0
                                        ? `Còn xuất ${formatNumber(remainQty)}`
                                        : "Đã xuất đủ"
                                }
                                progress={exportPct}
                                progressTone={remainQty > 0 ? "warn" : "ok"}
                            />
                            <Metric
                                icon={PackageX}
                                tone={returnedQty > 0 ? "danger" : "muted"}
                                label="Đã trả hàng"
                                value={formatNumber(returnedQty)}
                                sub={`${formatNumber(returns.length)} phiếu trả`}
                            />
                        </div>

                        {/* TABS */}
                        <Tabs defaultValue="items" className="space-y-4">
                            <div className="border-b">
                                <TabsList
                                    className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0"
                                >
                                    <TabTrigger value="items" icon={Package} label="Hàng bán" count={items.length} />
                                    <TabTrigger value="deliveries" icon={Truck} label="Giao hàng" count={deliveries.length} />
                                    <TabTrigger value="exports" icon={Warehouse} label="Xuất kho" count={exports.length} />
                                    <TabTrigger value="receipts" icon={Wallet} label="Thu tiền" count={receipts.length} />
                                    <TabTrigger value="returns" icon={RotateCcw} label="Trả hàng" count={returns.length} />
                                </TabsList>
                            </div>

                            <TabsContent value="items" className="m-0">
                                <OrderItems order={data} items={items} disabled={!isEditable} />
                            </TabsContent>

                            <TabsContent value="deliveries" className="m-0">
                                <OrderDeliveries order={data} deliveries={deliveries} disabled={!isEditable} />
                            </TabsContent>

                            <TabsContent value="exports" className="m-0">
                                <OrderExports exports={exports} order={data} disabled={!isEditable} />
                            </TabsContent>

                            <TabsContent value="receipts" className="m-0">
                                <OrderReceipts order={data} receipts={receipts} />
                            </TabsContent>

                            <TabsContent value="returns" className="m-0">
                                <OrderReturns order={data} returns={returns} disabled={!isEditable} />
                            </TabsContent>
                        </Tabs>

                    </div>
                )
            }}
        </PageSection>
    )
}

/* ---------------- Internal UI ---------------- */

type Tone = "primary" | "ok" | "warn" | "danger" | "info" | "muted"

const TONE_TEXT: Record<Tone, string> = {
    primary: "text-foreground",
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-rose-600 dark:text-rose-400",
    info: "text-blue-600 dark:text-blue-400",
    muted: "text-muted-foreground",
}

const TONE_ICON_BG: Record<Tone, string> = {
    primary: "bg-primary/10 text-primary",
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    muted: "bg-muted text-muted-foreground",
}

const TONE_PROGRESS: Record<Tone, string> = {
    primary: "bg-primary",
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    muted: "bg-muted-foreground/40",
}

function Metric({
    icon: Icon,
    label,
    value,
    sub,
    tone = "primary",
    progress,
    progressTone,
}: {
    icon?: LucideIcon
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
    tone?: Tone
    progress?: number
    progressTone?: Tone
}) {
    return (
        <div className="group rounded-xl border bg-background p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                {Icon && (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_ICON_BG[tone]}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>

            <div className={`mt-2 text-xl font-bold tracking-tight ${TONE_TEXT[tone]}`}>
                {value}
            </div>

            {sub && (
                <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
            )}

            {typeof progress === "number" && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className={`h-full rounded-full transition-all ${TONE_PROGRESS[progressTone ?? tone]}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    )
}

function TabTrigger({
    value,
    icon: Icon,
    label,
    count,
}: {
    value: string
    icon: LucideIcon
    label: string
    count?: number
}) {
    return (
        <TabsTrigger
            value={value}
            className={[
                // reset shadcn defaults
                "relative h-11 flex-none rounded-none border-0 bg-transparent px-4 py-2.5 shadow-none",
                "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                "dark:data-[state=active]:bg-transparent dark:data-[state=active]:border-transparent",
                // colors
                "text-muted-foreground hover:text-foreground",
                "data-[state=active]:text-foreground",
                // underline indicator
                "after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:rounded-full after:bg-transparent",
                "data-[state=active]:after:bg-primary",
                // typography
                "text-sm font-medium tracking-tight",
                // group for count badge
                "group gap-2",
            ].join(" ")}
        >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {typeof count === "number" && count > 0 && (
                <span
                    className={[
                        "ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5",
                        "text-[11px] font-semibold tabular-nums leading-none",
                        "bg-muted text-muted-foreground",
                        "group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary",
                    ].join(" ")}
                >
                    {count}
                </span>
            )}
        </TabsTrigger>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}
