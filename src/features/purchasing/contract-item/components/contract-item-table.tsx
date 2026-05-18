import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { CheckCircle2, Search } from "lucide-react"
import { CrudRowActions } from "@/components/crud/crud-row-actions"
import { useCrudDelete } from "@/hooks/use-crud-delete"
import { deleteContractItem } from "@/api/purchasing/contract-item"
import { useContractItems } from "./contract-items-provider"
import type { ContractItem } from "../data/schema"

type Props = {
    data?: ContractItem[]
    keyword?: string
    onKeywordChange?: (value: string) => void
}

export function ContractItemTable(props: Props) {
    const data = (props.data ?? []) as ContractItem[]
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    const totalShipped = data.reduce((sum, item) => sum + (item.shipped_quantity ?? 0), 0)
    const totalRemaining = data.reduce(
        (sum, item) =>
            sum +
            (item.remaining_quantity ??
                Math.max((item.quantity ?? 0) - (item.shipped_quantity ?? 0), 0)),
        0,
    )
    const totalAmount = data.reduce((sum, item) => sum + getTotalAmount(item), 0)

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
                <Summary label="DÒNG" value={formatNumber(data.length)} />
                <Summary label="SL HỢP ĐỒNG" value={formatNumber(totalQuantity)} />
                <Summary label="ĐÃ ĐI" value={formatNumber(totalShipped)} tone="success" />
                <Summary label="CÒN LẠI" value={formatNumber(totalRemaining)} tone="warning" />
                <Summary label="TỔNG TIỀN" value={formatCurrency(totalAmount)} />
            </div>

            <div className="relative w-full max-w-[240px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                    value={props.keyword ?? ""}
                    onChange={(e) => props.onKeywordChange?.(e.target.value)}
                    placeholder="Tìm theo mã hoặc tên"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />
            </div>

            <div className="space-y-2">
                {data.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                        Chưa có hàng hóa nào trong hợp đồng.
                    </div>
                ) : (
                    data.map((item, index) => (
                        <ContractItemCard key={item.id} item={item} index={index + 1} />
                    ))
                )}
            </div>
        </div>
    )
}

function ContractItemCard({ item, index }: { item: ContractItem; index: number }) {
    const { openEdit } = useContractItems()
    const { deleteById } = useCrudDelete(deleteContractItem, ["contract-items"])

    const remaining =
        item.remaining_quantity ??
        Math.max((item.quantity ?? 0) - (item.shipped_quantity ?? 0), 0)
    const isDone = remaining === 0 && (item.quantity ?? 0) > 0
    const basePrice = item.base_price ?? calcBasePrice(item)
    const totalAmount = getTotalAmount(item)
    const totalAmountVnd = getTotalAmountVnd(item)
    const currency = "EUR"

    return (
        <div className="overflow-hidden rounded-lg border border-[#d8d5c9] bg-[#fbfaf2] shadow-xs">
            {/* HEADER */}
            <div className="grid min-h-[72px] grid-cols-[44px_minmax(260px,1fr)_58px] border-b border-[#d8d5c9]">
                <div className="flex items-start justify-center border-r border-[#d8d5c9] pt-4">
                    <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-cyan-50 text-xs font-bold text-cyan-700">
                        {index}
                    </span>
                </div>
                <div className="min-w-0 px-4 py-3">
                    <div className="truncate text-sm font-semibold text-sky-700">
                        {item.product?.code ?? "-"}
                    </div>
                    <div className="line-clamp-2 text-sm font-semibold leading-snug text-slate-950">
                        {item.product?.name ?? "-"}
                    </div>
                    <div className="text-xs text-slate-600">
                        Đơn vị tính: {item.product?.unit ?? "-"}
                    </div>
                </div>
                <div className="flex items-center justify-center border-l border-[#d8d5c9]">
                    <CrudRowActions
                        row={item}
                        onEdit={() => openEdit(item)}
                        onDelete={(r) => deleteById(r.id)}
                    />
                </div>
            </div>

            {/* QUANTITY GRID */}
            <div className="grid border-b border-[#d8d5c9] bg-white md:grid-cols-3">
                <QtyBox
                    label="SỐ LƯỢNG HĐ"
                    value={formatNumber(item.quantity ?? 0)}
                    unit={item.product?.unit}
                />
                <QtyBox
                    label="ĐÃ GIAO"
                    value={formatNumber(item.shipped_quantity ?? 0)}
                    unit={item.product?.unit}
                    tone="success"
                />
                <QtyBox
                    label="CÒN LẠI"
                    value={formatNumber(remaining)}
                    unit={item.product?.unit}
                    tone={remaining > 0 ? "warning" : "default"}
                    suffix={
                        isDone ? (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Xong
                            </span>
                        ) : null
                    }
                />
            </div>

            {/* DETAIL GRID */}
            <div className="grid bg-white md:grid-cols-[1fr_1fr_1.25fr]">
                {/* ĐƠN GIÁ */}
                <DetailBox label="ĐƠN GIÁ">
                    <MoneyRow label="Giá gốc" value={item.unit_price} />
                    <MoneyRow label="Chiết khấu" value={item.discount_amount} />
                    <MoneyRow label="Sau CK" value={basePrice} strong />
                    <div className="flex flex-wrap gap-1 pt-2">
                        <Badge
                            variant="outline"
                            className="border-sky-200 bg-sky-50 text-xs text-sky-700"
                        >
                            NK {formatNumber(item.import_tax_rate ?? 0)}%
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-sky-200 bg-sky-50 text-xs text-sky-700"
                        >
                            VAT {formatNumber(item.vat_rate ?? 0)}%
                        </Badge>
                    </div>
                </DetailBox>

                {/* CHI PHÍ */}
                <DetailBox label="CHI PHÍ">
                    <MoneyRow label="Bao bì" value={item.packaging_price} />
                    <MoneyRow label="Vận chuyển" value={item.freight_price} />
                    <MoneyRow label="Làm hàng" value={item.handling_fee} />
                </DetailBox>

                {/* THÀNH TIỀN */}
                <div className="bg-[#f4f3ec] px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        THÀNH TIỀN (NGOẠI TỆ)
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-tight text-slate-950 tabular-nums">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-700">
                        <SummaryRow
                            label="Đầu vào NT/ĐV"
                            value={`${formatCurrency(item.input_price ?? item.price_before_tax ?? 0)} ${currency}`}
                        />
                        <SummaryRow
                            label="Đầu vào VNĐ/ĐV"
                            value={`${formatCurrency(item.input_price_vnd ?? item.price_before_tax_vnd ?? 0)} ₫`}
                        />
                        <SummaryRow
                            label="Tỷ giá"
                            value={formatNumber(item.exchange_rate ?? 1)}
                        />
                        <div className="border-t border-[#d8d5c9] pt-1.5">
                            <SummaryRow
                                label="Tổng VNĐ"
                                value={`${formatCurrency(totalAmountVnd)} ₫`}
                                strong
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
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

function QtyBox({
    label,
    value,
    unit,
    tone,
    suffix,
}: {
    label: string
    value: string
    unit?: string
    tone?: "success" | "warning" | "default"
    suffix?: React.ReactNode
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
            <div className="mt-1 flex items-baseline gap-2">
                <div className={`text-xl font-bold leading-tight tabular-nums ${valueClass}`}>{value}</div>
                {suffix}
            </div>
            {unit ? (
                <div className="mt-0.5 text-xs text-slate-600">{unit}</div>
            ) : null}
            <div className="mt-2 h-1 rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone === "warning" ? "bg-orange-500" : "bg-emerald-600"}`} />
            </div>
        </div>
    )
}

function DetailBox({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="border-r border-[#d8d5c9] px-4 py-3 last:border-r-0">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </div>
            <div className="mt-2 space-y-1 text-sm">{children}</div>
        </div>
    )
}

function MoneyRow({
    label,
    value,
    strong,
}: {
    label: string
    value?: number
    strong?: boolean
}) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-slate-700">{label}</span>
            <span
                className={`tabular-nums text-slate-950 ${strong ? "font-bold" : "font-semibold"}`}
            >
                {formatCurrency(value ?? 0)}
            </span>
        </div>
    )
}

function SummaryRow({
    label,
    value,
    strong,
}: {
    label: string
    value: string
    strong?: boolean
}) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-slate-600">{label}</span>
            <span
                className={`tabular-nums ${strong ? "text-sm font-bold text-sky-700" : "font-semibold text-slate-700"}`}
            >
                {value}
            </span>
        </div>
    )
}

function calcBasePrice(item: ContractItem) {
    return Math.max((item.unit_price ?? 0) - (item.discount_amount ?? 0), 0)
}

function calcTotal(item: ContractItem) {
    const quantity = item.quantity ?? 0
    const price = item.input_price ?? item.price_before_tax ?? calcBasePrice(item)
    return quantity * price
}

function getTotalAmount(item: ContractItem) {
    return item.total_amount ?? calcTotal(item)
}

function getTotalAmountVnd(item: ContractItem) {
    if (item.total_amount_vnd != null && item.total_amount_vnd > 0) {
        return item.total_amount_vnd
    }

    const quantity = item.quantity ?? 0
    const inputPriceVnd = item.input_price_vnd ?? item.price_before_tax_vnd

    if (inputPriceVnd != null && inputPriceVnd > 0) {
        return quantity * inputPriceVnd
    }

    return getTotalAmount(item) * (item.exchange_rate ?? 1)
}
