import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Link } from "@tanstack/react-router"
import { ArrowUpRight, Building2, CalendarDays, CreditCard, FileText, ReceiptText } from "lucide-react"
import type { Contract } from "../../data/schema"

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
        <div className="space-y-4">
            <div className="rounded-md border bg-background p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                            <h2 className="text-3xl font-semibold tracking-tight">
                                {contract.code || `Hợp đồng #${contract.id}`}
                            </h2>
                            <StatusBadge status={contract.status} />
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                {contract.supplier?.name ?? "-"}
                                {contract.supplier?.nation?.name ? ` · ${contract.supplier.nation.name}` : ""}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <CalendarDays className="h-5 w-5" />
                                Ngày ký {formatDate(contract.signed_date)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                {formatPaymentMethod(contract.payment_method)} · {contract.currency?.code ?? "-"} · TG {formatNumber(exchangeRate)}
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" asChild>
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
                            Danh sách HĐ
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Metric label="Tổng tiền" value={formatCurrency(totalAmount)} sub={contract.currency?.code ?? "-"} />
                <Metric label="Thành tiền VNĐ" value={formatCurrency(totalAmountVnd)} sub={`TG ${formatNumber(exchangeRate)}`} />
                <Metric label="Đã thanh toán" value={formatCurrency(contract.total_paid_amount ?? 0)} sub={`${paidPercent}% giá trị`} tone="success" />
                <Metric label="Còn phải trả" value={formatCurrency(contract.remaining_amount ?? 0)} sub={contract.currency?.code ?? "-"} tone="warning" />
                <Metric label="Tổng SL hàng" value={formatNumber(contract.total_quantity ?? 0)} sub={`Lỗi: ${formatNumber(contract.total_defect_quantity ?? 0)}`} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <InfoBox label="Nhà cung cấp" value={contract.supplier?.name} sub={contract.supplier?.code} />
                <InfoBox label="Quốc gia" value={contract.supplier?.nation?.name} sub={contract.supplier?.nation?.code} />
                <InfoBox label="Điều kiện mua" value={contract.term} sub={`Cọc ${formatNumber(contract.deposit_rate ?? 0)}%`} />
                <InfoBox label="Loại tiền" value={contract.currency?.code} sub={`Tỷ giá ${formatNumber(exchangeRate)}`} />
                <InfoBox
                    label="Phí làm hàng"
                    value={formatCurrency(contract.handling_fee ?? 0)}
                    sub="TTHQ, nâng hạ và phí liên quan/ĐV"
                    icon={ReceiptText}
                />
                <InfoBox label="Ngày cọc" value={formatDate(contract.deposit_date)} />
                <InfoBox label="Thuế nhập khẩu" value={`${formatNumber(contract.import_tax_rate ?? 0)}%`} />
                <InfoBox label="VAT" value={`${formatNumber(contract.vat_rate ?? 0)}%`} />
            </div>
        </div>
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
    tone?: "success" | "warning"
}) {
    const valueClass =
        tone === "success"
            ? "text-emerald-700"
            : tone === "warning"
                ? "text-amber-700"
                : "text-foreground"

    return (
        <div className="flex min-h-[132px] flex-col justify-between rounded-md border bg-background px-5 py-4">
            <div className="text-base font-medium text-muted-foreground">{label}</div>
            <div className={`mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums 2xl:text-3xl ${valueClass}`}>{value}</div>
            {sub ? <div className="mt-1 text-sm text-muted-foreground">{sub}</div> : null}
        </div>
    )
}

function InfoBox({
    label,
    value,
    sub,
    icon: Icon,
}: {
    label: string
    value?: string | number | null
    sub?: string | number | null
    icon?: React.ComponentType<{ className?: string }>
}) {
    return (
        <div className="flex min-h-[118px] flex-col justify-between rounded-md border bg-background px-5 py-4">
            <div className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                {Icon ? <Icon className="h-5 w-5" /> : null}
                {label}
            </div>
            <div className="mt-2 break-words text-lg font-semibold">{value || "-"}</div>
            {sub ? <div className="mt-1 text-sm text-muted-foreground">{sub}</div> : null}
        </div>
    )
}

function StatusBadge({ status }: { status?: string }) {
    const className =
        status === "DONE"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "SIGNED"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : status === "CANCELLED"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"

    return (
        <Badge variant="outline" className={className}>
            {formatStatus(status)}
        </Badge>
    )
}

function calcPercent(paid?: number, total?: number) {
    if (!paid || !total) return 0
    return Math.round((paid / total) * 100)
}

function formatStatus(status?: string) {
    switch (status) {
        case "DRAFT":
            return "Nháp"
        case "SIGNED":
            return "Đã ký"
        case "DONE":
            return "Hoàn tất"
        case "CANCELLED":
            return "Đã hủy"
        default:
            return status || "-"
    }
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
