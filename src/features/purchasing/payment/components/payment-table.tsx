import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { deletePayment } from "@/api/purchasing/payment"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { CalendarDays, PackageCheck, Search, StickyNote } from "lucide-react"
import { usePayments } from "./payment-provider"
import type { Payment } from "../data/schema"

type Props = {
    data?: Payment[]
    keyword?: string
    onKeywordChange?: (value: string) => void
}

export function PaymentTable(props: Props) {
    const data = (props.data ?? []) as Payment[]
    const totalAmount = data.reduce((sum, item) => sum + (item.amount ?? 0), 0)
    const totalVnd = data.reduce(
        (sum, item) => sum + (item.amount ?? 0) * (item.exchange_rate ?? 1),
        0,
    )
    const depositCount = data.filter((p) => p.type === "DEPOSIT").length
    const paymentCount = data.filter((p) => p.type === "PAYMENT").length

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Summary label="LƯỢT THANH TOÁN" value={formatNumber(data.length)} />
                <Summary label="LẦN CỌC" value={formatNumber(depositCount)} />
                <Summary label="LẦN TT" value={formatNumber(paymentCount)} tone="success" />
                <Summary label="TỔNG NGOẠI TỆ" value={formatCurrency(totalAmount)} />
                <Summary label="TỔNG QUY ĐỔI VNĐ" value={formatCurrency(totalVnd)} />
            </div>

            <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={props.keyword ?? ""}
                    onChange={(e) => props.onKeywordChange?.(e.target.value)}
                    placeholder="Tìm theo mã lô hoặc ghi chú..."
                    className="h-11 rounded-full pl-10"
                />
            </div>

            <div className="space-y-3">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                        Chưa có thanh toán nào trong hợp đồng.
                    </div>
                ) : (
                    data.map((item, index) => (
                        <PaymentCard key={item.id} item={item} index={index + 1} />
                    ))
                )}
            </div>
        </div>
    )
}

function PaymentCard({ item, index }: { item: Payment; index: number }) {
    const { openEdit } = usePayments()
    const { deleteById } = useCrudDelete(deletePayment, ["payments"])

    const exchangeRate = item.exchange_rate ?? 1
    const amount = item.amount ?? 0
    const amountVnd = amount * exchangeRate
    const currency = item.contract?.currency?.code ?? "—"

    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex items-start gap-3 border-b px-5 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {index}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <PaymentTypeBadge type={item.type} />
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Ngày TT {formatDate(item.paid_at)}
                        </span>
                        {item.shipment?.code ? (
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <PackageCheck className="h-3.5 w-3.5" />
                                Lô {item.shipment.code}
                            </span>
                        ) : null}
                    </div>
                    {item.note ? (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2">{item.note}</span>
                        </div>
                    ) : null}
                </div>
                <CrudRowActions
                    row={item}
                    onEdit={() => openEdit(item)}
                    onDelete={(r) => deleteById(r.id)}
                />
            </div>

            {/* AMOUNT GRID */}
            <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
                <AmountBox
                    label="SỐ TIỀN (NGOẠI TỆ)"
                    value={formatCurrency(amount)}
                    sub={currency}
                />
                <AmountBox
                    label="TỶ GIÁ"
                    value={formatNumber(exchangeRate)}
                />
                <AmountBox
                    label="QUY ĐỔI VNĐ"
                    value={formatCurrency(amountVnd)}
                    sub="₫"
                    tone="success"
                />
            </div>
        </div>
    )
}

function PaymentTypeBadge({ type }: { type?: string }) {
    const className =
        type === "PAYMENT"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : type === "FEE"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-sky-200 bg-sky-50 text-sky-700"

    return (
        <Badge variant="outline" className={`${className} text-xs`}>
            {formatPaymentType(type)}
        </Badge>
    )
}

function formatPaymentType(type?: string) {
    switch (type) {
        case "DEPOSIT":
            return "Cọc"
        case "PAYMENT":
            return "Thanh toán"
        case "FEE":
            return "Phí"
        default:
            return type || "—"
    }
}

function formatDate(value?: string) {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("vi-VN")
}

function Summary({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "success" | "warning"
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
                ? "text-orange-600"
                : "text-foreground"

    return (
        <div className="min-w-0 rounded-xl border bg-background px-4 py-3 shadow-sm">
            <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className={`mt-1 truncate text-xl font-bold tabular-nums ${valueClass}`}>
                {value}
            </div>
        </div>
    )
}

function AmountBox({
    label,
    value,
    sub,
    tone,
}: {
    label: string
    value: string
    sub?: string
    tone?: "success" | "warning"
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
                ? "text-orange-600"
                : "text-foreground"

    return (
        <div className="rounded-lg border bg-background px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className={`mt-1 text-xl font-bold tabular-nums ${valueClass}`}>
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
            ) : null}
        </div>
    )
}
