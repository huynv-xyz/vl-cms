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
import { Package, Truck, Warehouse, RotateCcw } from "lucide-react"
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
            showBack   // 🔥 thêm back
        >
            {(data) => {

                const isEditable = data.status === "CONFIRMED"
                const items = data.items || []
                const deliveries = data.deliveries || []
                const exports = data.exports || []
                const receipts = data.receipts || []
                const returns = data.returns || []

                const totalQty = items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)
                const exportedQty = items.reduce((s: number, i: any) => s + Number(i.exported_quantity || 0), 0)
                const remainQty = items.reduce((s: number, i: any) => s + Number(i.remain_quantity || 0), 0)
                const paidAmount = receipts.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)

                return (
                    <div className="space-y-5">

                        <OrderInfo order={data} />

                        {/* METRIC */}
                        <div className="grid gap-3 md:grid-cols-4">
                            <Metric label="Tổng giá trị đơn" value={formatCurrency(data.total_amount || 0)} />
                            <Metric
                                label="Đã thu"
                                value={formatCurrency(paidAmount)}
                                tone={paidAmount >= Number(data.total_amount || 0) ? "ok" : undefined}
                            />
                            <Metric
                                label="Đã xuất / đặt"
                                value={`${formatNumber(exportedQty)} / ${formatNumber(totalQty)}`}
                                tone={remainQty > 0 ? "warn" : "ok"}
                            />
                            <Metric
                                label="Còn phải xuất"
                                value={formatNumber(remainQty)}
                                tone={remainQty > 0 ? "warn" : "ok"}
                            />
                        </div>

                        {/* TABS */}
                        <Tabs defaultValue="items" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-2 gap-1 md:grid-cols-4">
                                <TabsTrigger value="items">
                                    <Package className="mr-2 h-4 w-4" />
                                    Hàng bán
                                </TabsTrigger>
                                <TabsTrigger value="deliveries">
                                    <Truck className="mr-2 h-4 w-4" />
                                    Giao hàng
                                </TabsTrigger>
                                <TabsTrigger value="exports">
                                    <Warehouse className="mr-2 h-4 w-4" />
                                    Xuất kho
                                </TabsTrigger>
                                <TabsTrigger value="returns">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Trả hàng
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="items">
                                <OrderItems order={data} items={items} disabled={!isEditable} />
                            </TabsContent>

                            <TabsContent value="deliveries">
                                <OrderDeliveries order={data} deliveries={deliveries} disabled={!isEditable} />
                            </TabsContent>

                            <TabsContent value="exports">
                                <OrderExports exports={exports} order={data} disabled={!isEditable} />
                            </TabsContent>

                            <TabsContent value="returns">
                                <OrderReturns order={data} returns={returns} disabled={!isEditable} />
                            </TabsContent>
                        </Tabs>

                    </div>
                )
            }}
        </PageSection>
    )
}

function Metric({
    label,
    value,
    tone,
}: {
    label: string
    value: React.ReactNode
    tone?: "ok" | "warn"
}) {
    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div
                className={
                    tone === "ok"
                        ? "mt-1 text-xl font-bold text-emerald-600"
                        : tone === "warn"
                            ? "mt-1 text-xl font-bold text-amber-600"
                            : "mt-1 text-xl font-bold"
                }
            >
                {value}
            </div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}