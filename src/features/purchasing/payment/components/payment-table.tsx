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
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                <Summary label="LƯỢT THANH TOÁN" value={formatNumber(data.length)} />
                <Summary label="LẦN CỌC" value={formatNumber(depositCount)} />
                <Summary label="LẦN TT" value={formatNumber(paymentCount)} tone="success" />
                <Summary label="TỔNG NGOẠI TỆ" value={formatCurrency(totalAmount)} />
                <Summary label="TỔNG QUY ĐỔI VNĐ" value={formatCurrency(totalVnd)} />
            </div>

            <div className="relative w-full max-w-[240px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                    value={props.keyword ?? ""}
                    onChange={(e) => props.onKeywordChange?.(e.target.value)}
                    placeholder="Tìm theo mã lô hoặc ghi chú..."
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />
            </div>

            <div className="space-y-2">
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
        <div className="overflow-hidden rounded-lg border border-[#d8d5c9] bg-[#fbfaf2] shadow-xs">
            {/* HEADER */}
            <div className="grid min-h-[76px] grid-cols-[44px_minmax(260px,1fr)_58px] border-b border-[#d8d5c9]">
                <div className="flex items-start justify-center border-r border-[#d8d5c9] pt-4 text-sm text-slate-600">
                    {index}
                </div>
                <div className="min-w-0 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <PaymentTypeBadge type={item.type} />
                        <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Ngày TT {formatDate(item.paid_at)}
                        </span>
                        {item.shipment?.code ? (
                            <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                                <PackageCheck className="h-3.5 w-3.5" />
                                Lô {item.shipment.code}
                            </span>
                        ) : null}
                    </div>
                    {item.note ? (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-2">{item.note}</span>
                        </div>
                    ) : null}
                </div>
                <div className="flex items-center justify-center border-l border-[#d8d5c9]">
                    <CrudRowActions
                        row={item}
                        onEdit={() => openEdit(item)}
                        onDelete={(r) => deleteById(r.id)}
                    />
                </div>
            </div>

            {/* AMOUNT GRID */}
            <div className="grid bg-white md:grid-cols-3">
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
        <Badge variant="outline" className={`${className} h-5 rounded-sm px-2 text-[11px]`}>
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
        <div className="min-w-0 rounded-md bg-[#f4f3ec] px-4 py-3">
            <div className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className={`mt-1 truncate text-lg font-bold leading-tight tabular-nums ${valueClass}`}>
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
        <div className="border-r border-[#d8d5c9] px-4 py-3 last:border-r-0">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className={`mt-1 text-xl font-bold leading-tight tabular-nums ${valueClass}`}>
                {value}
            </div>
            {sub ? (
                <div className="mt-0.5 text-xs text-slate-600">{sub}</div>
            ) : null}
        </div>
    )
}
