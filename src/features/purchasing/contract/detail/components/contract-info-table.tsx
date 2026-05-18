import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { ArrowUpRight, Building2, CalendarDays, CreditCard, FileText, ReceiptText } from "lucide-react"
import type { Contract } from "../../data/schema"

type MetricTone = "success" | "warning" | "default"

type Props = {
    contract: Contract
}

export function ContractInfoTable({ contract }: Props) {
    const paidPercent = calcPercent(contract.total_paid_amount, contract.total_amount)
    const exchangeRate = contract.exchange_rate ?? contract.currency?.exchange_rate ?? 1
    const totalAmount = contract.total_amount ?? 0
    const totalAmountVnd =
        contract.total_amount_vnd != null && contract.total_amount_vnd > 0
            ? contract.total_amount_vnd
            : totalAmount * exchangeRate

    return (
        <div className="space-y-3">
            <div className="rounded-xl border bg-background p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-2xl font-semibold tracking-tight">
                                {contract.code || `Hợp đồng #${contract.id}`}
                            </h2>
                            <TypeBadge />
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {contract.supplier?.name ?? "-"}
                                {contract.supplier?.nation?.name ? ` · ${contract.supplier.nation.name}` : ""}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Ngày ký {formatDate(contract.signed_date)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                {formatPaymentMethod(contract.payment_method)} · {contract.currency?.code ?? "-"} · TG {formatNumber(exchangeRate)}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" asChild className="shrink-0">
                        <Link
                            to="/purchasing/contracts"
                            search={{
                                page: 1,
                                size: 20,
                                keyword: "",
                                status: undefined,
                                product_ids: undefined,
                                supplier_ids: undefined,
                                nation_ids: undefined,
                                signed_date_from: undefined,
                                signed_date_to: undefined,
                            }}
                        >
                            <ArrowUpRight className="h-4 w-4" />
                            Danh sách HĐ
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Metric label="TỔNG TIỀN" value={formatCurrency(totalAmount)} sub={contract.currency?.code ?? "-"} />
                <Metric label="THÀNH TIỀN VNĐ" value={formatCurrency(totalAmountVnd)} sub={`TG ${formatNumber(exchangeRate)}`} />
                <Metric label="ĐÃ THANH TOÁN" value={formatCurrency(contract.total_paid_amount ?? 0)} sub={`${paidPercent}% giá trị`} tone="success" />
                <Metric label="CÒN PHẢI TRẢ" value={formatCurrency(contract.remaining_amount ?? 0)} sub={contract.currency?.code ?? "-"} tone="warning" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoBox label="NHÀ CUNG CẤP" value={contract.supplier?.name} sub={contract.supplier?.code} />
                <InfoBox label="QUỐC GIA" value={contract.supplier?.nation?.name} sub={contract.supplier?.nation?.code} />
                <InfoBox label="ĐIỀU KIỆN MUA" value={contract.term} sub={`Cọc ${formatNumber(contract.deposit_rate ?? 0)}%`} />
                <InfoBox label="LOẠI TIỀN" value={contract.currency?.code} sub={`Tỷ giá ${formatNumber(exchangeRate)}`} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoBox
                    label="PHÍ LÀM HÀNG"
                    value={formatCurrency(contract.handling_fee ?? 0)}
                    sub="TTHQ, nâng hạ và phí liên quan/ĐV"
                    icon={ReceiptText}
                    muted
                />
                <InfoBox label="NGÀY CỌC" value={formatDate(contract.deposit_date)} muted />
                <InfoBox label="THUẾ NHẬP KHẨU" value={`${formatNumber(contract.import_tax_rate ?? 0)}%`} muted />
                <InfoBox label="VAT" value={`${formatNumber(contract.vat_rate ?? 0)}%`} muted />
            </div>
        </div>
    )
}

function TypeBadge() {
    return (
        <Badge
            variant="outline"
            className="border-teal-200 bg-teal-50 text-teal-700"
        >
            Nhập
        </Badge>
    )
}

function Metric({
    label,
    value,
    sub,
    tone,
}: {
    label: string
    value: string
    sub?: string
    tone?: MetricTone
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-600"
            : tone === "warning"
                ? "text-orange-600"
                : "text-foreground"

    return (
        <div className="flex min-h-[120px] flex-col justify-between rounded-xl border bg-background px-5 py-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className={`mt-2 break-words text-2xl font-bold tracking-tight tabular-nums 2xl:text-3xl ${valueClass}`}>{value}</div>
            {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
        </div>
    )
}

function InfoBox({
    label,
    value,
    sub,
    icon: Icon,
    muted = false,
}: {
    label: string
    value?: string | number | null
    sub?: string | number | null
    icon?: React.ComponentType<{ className?: string }>
    muted?: boolean
}) {
    return (
        <div
            className={`flex min-h-[96px] flex-col justify-between rounded-xl border px-5 py-4 shadow-sm ${muted ? "bg-muted/30" : "bg-background"
                }`}
        >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {label}
            </div>
            <div className={`mt-2 break-words font-semibold ${muted ? "text-base" : "text-lg"}`}>
                {value || "—"}
            </div>
            {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
        </div>
    )
}

function calcPercent(paid?: number, total?: number) {
    if (!paid || !total) return 0
    return Math.round((paid / total) * 100)
}

function formatPaymentMethod(method?: string) {
    switch (method) {
        case "TT":
            return "TT"
        case "LC_IMMEDIATE":
            return "LC trả ngay"
        case "LC_60_BL":
            return "LC 60 ngày BL"
        case "DA":
            return "D/A"
        case "DP":
            return "D/P"
        default:
            return method || "-"
    }
}

function formatDate(value?: string) {
    if (!value) return "-"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleDateString("vi-VN")
}
