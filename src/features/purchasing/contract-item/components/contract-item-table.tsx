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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Summary label="DÒNG" value={formatNumber(data.length)} />
                <Summary label="SL HỢP ĐỒNG" value={formatNumber(totalQuantity)} />
                <Summary label="ĐÃ ĐI" value={formatNumber(totalShipped)} tone="success" />
                <Summary label="CÒN LẠI" value={formatNumber(totalRemaining)} tone="warning" />
                <Summary label="TỔNG TIỀN" value={formatCurrency(totalAmount)} />
            </div>

            <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={props.keyword ?? ""}
                    onChange={(e) => props.onKeywordChange?.(e.target.value)}
                    placeholder="Tìm theo mã hoặc tên hàng..."
                    className="h-11 rounded-full pl-10"
                />
            </div>

            <div className="space-y-3">
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
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            {/* HEADER */}
            <div className="flex items-start gap-3 border-b px-5 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {index}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-base font-semibold tracking-tight">
                        {item.product?.code ?? "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {item.product?.name ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Đơn vị tính: {item.product?.unit ?? "-"}
                    </div>
                </div>
                <CrudRowActions
                    row={item}
                    onEdit={() => openEdit(item)}
                    onDelete={(r) => deleteById(r.id)}
                />
            </div>

            {/* QUANTITY GRID */}
            <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
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
            <div className="grid gap-3 border-t bg-muted/20 px-5 py-4 md:grid-cols-3">
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
                <div className="rounded-lg border bg-background px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        THÀNH TIỀN (NGOẠI TỆ)
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-tight tabular-nums">
                        {formatCurrency(totalAmount)}
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
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
                        <div className="border-t pt-1.5">
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
        <div className="rounded-lg border bg-background px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
                <div className={`text-xl font-bold tabular-nums ${valueClass}`}>{value}</div>
                {suffix}
            </div>
            {unit ? (
                <div className="mt-0.5 text-xs text-muted-foreground">{unit}</div>
            ) : null}
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
        <div className="rounded-lg border bg-background px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`tabular-nums ${strong ? "font-semibold" : "font-medium"}`}
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
            <span className="text-muted-foreground">{label}</span>
            <span
                className={`tabular-nums ${strong ? "text-sm font-semibold text-foreground" : "font-medium"}`}
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
