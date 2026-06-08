import type { ColumnDef, OnChangeFn, PaginationState } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"

import { buildIndexColumn } from "@/components/crud/build-index-column"
import { buildTextColumn } from "@/components/crud/build-text-column"
import { CrudTable } from "@/components/crud/crud-table"
import { DatePicker } from "@/components/date-picker"
import { AsyncMultiSelect } from "@/components/rjsf/async-multi-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getSupplier, listSuppliers } from "@/api/purchasing/supplier"
import { supplierOption } from "@/lib/option-mapper"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { Contract } from "@/features/purchasing/contract/data/schema"
import {
    calcExpectedDeposit,
    calcRemainingAmount,
    getContractPaymentStatus,
    getPaidAmountVnd,
    PAYMENT_STATUS_BADGE_CLASS,
    PAYMENT_STATUS_LABEL,
    type PaymentStatus,
} from "../lib/payment-status"

type Filters = {
    supplier_ids?: string[]
    payment_status?: string
    signed_date_from?: string
    signed_date_to?: string
}

type Props = {
    items: Contract[]
    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number
    keyword: string
    onKeywordChange: (value: string) => void
    filters: Filters
    onFiltersChange: (filters: Filters) => void
}

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: "NOT_PAID", label: "Chưa thanh toán" },
    { value: "PARTIAL", label: "Thanh toán 1 phần" },
    { value: "FULL", label: "Đã thanh toán đủ" },
    { value: "OVER", label: "Thanh toán vượt" },
]

const columns: ColumnDef<Contract>[] = [
    buildIndexColumn(),

    buildTextColumn<Contract>({
        title: "Nhà cung cấp",
        render: (row) => (
            <div className="min-w-[180px]">
                <div className="font-medium">
                    {row.supplier?.name || `NCC #${row.supplier_id}`}
                </div>
                {row.supplier?.code ? (
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {row.supplier.code}
                    </div>
                ) : null}
            </div>
        ),
    }),

    buildTextColumn<Contract>({
        accessorKey: "code",
        title: "Số HĐ / Ngày ký",
        render: (row) => (
            <div className="min-w-[180px]">
                <Link
                    to="/purchasing/contracts/$id"
                    params={{ id: String(row.id) }}
                    className="font-semibold text-primary hover:underline"
                >
                    {row.code || `HĐ #${row.id}`}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">
                    Ký {formatDate(row.signed_date)}
                </div>
            </div>
        ),
    }),

    buildTextColumn<Contract>({
        title: "Giá trị HĐ",
        render: (row) => (
            <div className="min-w-[140px] text-right">
                <div className="font-semibold tabular-nums">
                    {formatCurrency(row.total_amount_vnd)}
                </div>
                {row.exchange_rate && row.total_amount ? (
                    <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {formatNumber(row.total_amount)}{" "}
                        {row.currency?.code || ""}
                    </div>
                ) : null}
            </div>
        ),
    }),

    buildTextColumn<Contract>({
        title: "Cọc dự kiến",
        render: (row) => {
            const expected = calcExpectedDeposit(row)
            return (
                <div className="min-w-[150px] text-right">
                    <div className="font-medium tabular-nums">
                        {formatCurrency(expected)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        Tỷ lệ {formatPercent(row.deposit_rate)} ·{" "}
                        {formatDate(row.deposit_date)}
                    </div>
                </div>
            )
        },
    }),

    buildTextColumn<Contract>({
        title: "Đã thanh toán",
        render: (row) => {
            // So sánh trên cùng đơn vị VND: paid_vnd vs total_amount_vnd
            const paidVnd = getPaidAmountVnd(row)
            const totalVnd = Number(row.total_amount_vnd ?? 0)
            const paidRaw = Number(row.total_paid_amount ?? 0)
            const currencyCode = row.currency?.code
            const ratio = totalVnd > 0 ? (paidVnd / totalVnd) * 100 : 0
            const percentBar = Math.min(100, ratio)
            // Hiển thị 2 chữ số thập phân khi tỷ lệ < 1% nhưng > 0 để KT phân biệt
            // "0%" (chưa thanh toán) vs "0.07%" (đã trả tượng trưng)
            const percentLabel =
                ratio === 0
                    ? "0%"
                    : ratio < 1
                        ? `${ratio.toFixed(2)}%`
                        : ratio < 10
                            ? `${ratio.toFixed(1)}%`
                            : `${Math.round(ratio)}%`
            return (
                <div className="min-w-[180px]">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold tabular-nums text-emerald-700">
                            {formatCurrency(paidVnd)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {percentLabel}
                        </span>
                    </div>
                    {paidRaw > 0 && currencyCode && currencyCode !== "VND" ? (
                        <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                            ≈ {formatNumber(paidRaw)} {currencyCode}
                        </div>
                    ) : null}
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                        <div
                            className="h-1.5 rounded-full bg-emerald-500"
                            style={{ width: `${Math.max(percentBar, paidVnd > 0 ? 1 : 0)}%` }}
                        />
                    </div>
                </div>
            )
        },
    }),

    buildTextColumn<Contract>({
        title: "Còn phải TT",
        render: (row) => {
            const remaining = calcRemainingAmount(row)
            const status = getContractPaymentStatus(row)
            return (
                <div className="min-w-[140px] text-right">
                    <div
                        className={`font-semibold tabular-nums ${
                            status === "FULL"
                                ? "text-muted-foreground"
                                : "text-amber-700"
                        }`}
                    >
                        {formatCurrency(remaining)}
                    </div>
                    {status === "OVER" ? (
                        <div className="mt-0.5 text-xs font-medium text-rose-700">
                            Vượt{" "}
                            {formatCurrency(
                                getPaidAmountVnd(row) -
                                    Number(row.total_amount_vnd ?? 0),
                            )}
                        </div>
                    ) : null}
                </div>
            )
        },
    }),

    buildTextColumn<Contract>({
        title: "Trạng thái TT",
        render: (row) => {
            const status = getContractPaymentStatus(row)
            return (
                <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_BADGE_CLASS[status]}`}
                >
                    {PAYMENT_STATUS_LABEL[status]}
                </span>
            )
        },
    }),
]

export function ApSummaryTable({
    items,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
        onFiltersChange({ ...filters, [key]: value })

    return (
        <div className="space-y-4">
            <div className="flex w-full flex-wrap items-center gap-2">
                <SearchOnBlurInput
                    value={keyword}
                    onChange={onKeywordChange}
                    placeholder="Tìm số HĐ, tên NCC, ghi chú..."
                    wrapperClassName="relative h-10 min-w-[280px] flex-[1.5_1_0]"
                    className="h-10 rounded-md border-slate-300 bg-white pl-10 shadow-xs"
                />

                <AsyncMultiSelect
                    className="h-10 min-w-[240px] flex-[1.5_1_0] border-slate-300 bg-white shadow-xs"
                    value={filters.supplier_ids}
                    onChange={(v: string[]) =>
                        setFilter("supplier_ids", v?.length ? v : undefined)
                    }
                    placeholder="Nhà cung cấp"
                    dataSource={{
                        getList: listSuppliers,
                        getById: getSupplier,
                        params: { page: 1, size: 20 },
                    }}
                    mapOption={supplierOption}
                />

                <Select
                    value={filters.payment_status ?? "ALL"}
                    onValueChange={(value) =>
                        setFilter(
                            "payment_status",
                            value === "ALL" ? undefined : value,
                        )
                    }
                >
                    <SelectTrigger className="h-10 min-w-[200px] flex-1 rounded-md border-slate-300 bg-white shadow-xs">
                        <SelectValue placeholder="Trạng thái TT" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả trạng thái TT</SelectItem>
                        {PAYMENT_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DatePicker
                    className="min-w-[150px] flex-1 [&_button]:h-10"
                    value={filters.signed_date_from}
                    onChange={(v) =>
                        setFilter("signed_date_from", v || undefined)
                    }
                    placeholder="Từ ngày ký"
                />

                <DatePicker
                    className="min-w-[150px] flex-1 [&_button]:h-10"
                    value={filters.signed_date_to}
                    onChange={(v) =>
                        setFilter("signed_date_to", v || undefined)
                    }
                    placeholder="Đến ngày ký"
                />
            </div>

            <CrudTable<Contract>
                data={items}
                columns={columns}
                entityName="hợp đồng công nợ"
                pagination={pagination}
                onPaginationChange={onPaginationChange}
                pageCount={pageCount}
                showToolbar={false}
            />
        </div>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("vi-VN")
}

function formatPercent(rate?: number) {
    if (rate == null) return "-"
    const n = Number(rate)
    if (!Number.isFinite(n)) return "-"
    const normalized = n > 1 ? n : n * 100
    return `${normalized.toFixed(0)}%`
}
