import { useMemo } from "react"
import type { OnChangeFn, PaginationState } from "@tanstack/react-table"
import {
    ArrowDownLeft,
    ArrowUpRight,
    CalendarDays,
    FileText,
    Filter,
    Inbox,
    ReceiptText,
    UserRound,
} from "lucide-react"

import { listCustomers, getCustomer } from "@/api/customer"
import { DatePicker } from "@/components/date-picker"
import { CardPagination } from "@/components/table/card-pagination"
import { AsyncSelect } from "@/components/rjsf/async-select"
import { SearchOnBlurInput } from "@/components/search-on-blur-input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils"
import type { ArLedger } from "../data/schema"
import { AR_SOURCE_TYPES, getSourceTypeMeta } from "./ar-ledger-columns"

type Props = {
    data: ArLedger[]

    pagination: PaginationState
    onPaginationChange: OnChangeFn<PaginationState>
    pageCount: number

    keyword: string
    onKeywordChange: (v: string) => void

    filters: {
        source_type?: string[]
        from_date?: string
        to_date?: string
        customer_id?: number
    }

    onFiltersChange: (f: Props["filters"]) => void
}

type LedgerGroup = {
    key: string
    label: string
    sub?: string
    items: ArLedger[]
}

const controlClass = "h-11 min-h-11 rounded-md border-slate-300 bg-white shadow-xs"

export function ArLedgerTable({
    data,
    pagination,
    onPaginationChange,
    pageCount,
    keyword,
    onKeywordChange,
    filters,
    onFiltersChange,
}: Props) {
    const groupedRows = useMemo(() => groupByCustomer(data), [data])

    const setFilter = (key: keyof Props["filters"], value: any) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        })
    }

    const totalRows = data.length
    const currentPage = pagination.pageIndex + 1

    const setPageIndex = (pageIndex: number) => {
        onPaginationChange((prev) => ({
            ...prev,
            pageIndex: Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0)),
        }))
    }

    return (
        <Card className="border-border/60 gap-0 overflow-hidden py-0 shadow-sm">
            <CardHeader className="space-y-4 border-b py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">Sổ công nợ đã ghi nhận</CardTitle>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {formatNumber(totalRows)} dòng
                            </Badge>
                        </div>
                        <CardDescription className="mt-1">
                            Xem công nợ theo khách hàng, chứng từ và nghiệp vụ phát sinh.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="font-mono">
                            Trang {formatNumber(currentPage)} / {formatNumber(Math.max(pageCount, 1))}
                        </Badge>
                    </div>
                </div>

                <div className="bg-muted/40 -mx-6 -mb-5 border-t px-6 py-4">
                    <div className="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                        <Filter className="h-3.5 w-3.5" />
                        Bộ lọc công nợ
                    </div>

                    <div className="space-y-2">
                        <div className="flex w-full flex-wrap items-center gap-2">
                            <SearchOnBlurInput
                                value={keyword}
                                onChange={onKeywordChange}
                                placeholder="Tìm mã chứng từ, khách hàng, diễn giải..."
                                wrapperClassName="relative h-11 min-w-[320px] flex-[1.2_1_0]"
                                className={cn(controlClass, "pl-10")}
                            />

                            <AsyncSelect
                                className={cn(controlClass, "min-w-[280px] flex-[1.8_1_0] py-0")}
                                value={filters.customer_id}
                                onChange={(value: any) => setFilter("customer_id", value || undefined)}
                                placeholder="Khách hàng"
                                dataSource={{
                                    getList: listCustomers,
                                    getById: getCustomer,
                                    params: { page: 1, size: 20 },
                                }}
                                mapOption={(customer: any) => ({
                                    value: customer.id,
                                    label: `${customer.code ? `${customer.code} - ` : ""}${customer.name}`,
                                })}
                            />
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-2">
                            <Select
                                value={filters.source_type?.[0] ?? "ALL"}
                                onValueChange={(value) =>
                                    setFilter("source_type", value === "ALL" ? undefined : [value])
                                }
                            >
                                <SelectTrigger className={cn(controlClass, "min-w-[200px] flex-1")}>
                                    <SelectValue placeholder="Loại nghiệp vụ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả nghiệp vụ</SelectItem>
                                    {AR_SOURCE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <DatePicker
                                className={cn(
                                    "h-11 min-w-[170px] flex-1",
                                    "[&_button]:h-11 [&_button]:min-h-11 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                )}
                                value={filters.from_date}
                                onChange={(value) => setFilter("from_date", value || undefined)}
                                placeholder="Từ ngày"
                            />

                            <DatePicker
                                className={cn(
                                    "h-11 min-w-[170px] flex-1",
                                    "[&_button]:h-11 [&_button]:min-h-11 [&_button]:border-slate-300 [&_button]:bg-white [&_button]:shadow-xs"
                                )}
                                value={filters.to_date}
                                onChange={(value) => setFilter("to_date", value || undefined)}
                                placeholder="Đến ngày"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-b px-6 py-3 text-sm">
                <Badge variant="secondary" className="font-mono">
                    {formatNumber(groupedRows.length)} khách hàng
                </Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                    Trang hiện tại có {formatNumber(totalRows)} dòng công nợ
                </span>
            </div>

            <div className="space-y-6 p-6">
                {groupedRows.map((group) => (
                    <section key={group.key} className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                                    <UserRound className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold leading-tight">{group.label}</h3>
                                    <p className="text-muted-foreground text-xs">
                                        {group.sub ? `${group.sub} · ` : ""}
                                        {formatNumber(group.items.length)} dòng công nợ
                                    </p>
                                </div>
                            </div>
                            <GroupBalance rows={group.items} />
                        </div>

                        <div className="space-y-3">
                            {group.items.map((item, index) => (
                                <LedgerItemCard
                                    key={item.id}
                                    index={index + 1}
                                    item={item}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                {!data.length && (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                        <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-xl">
                            <Inbox className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="font-semibold">Không tìm thấy dòng công nợ</div>
                            <div className="text-muted-foreground mt-1 text-sm">
                                Thử đổi từ khóa, khách hàng hoặc khoảng ngày lọc.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-muted/30 border-t px-6 py-4">
                <CardPagination
                    pageIndex={pagination.pageIndex}
                    pageCount={pageCount}
                    onPageChange={setPageIndex}
                    className="px-0"
                />
            </div>
        </Card>
    )
}

function LedgerItemCard({
    index,
    item,
}: {
    index: number
    item: ArLedger
}) {
    const net = Number(item.debit_amount || 0) - Number(item.credit_amount || 0)
    const meta = getSourceTypeMeta(item.source_type)

    return (
        <div className="group bg-card overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md">
            <div className="bg-muted/30 grid border-b lg:grid-cols-[56px_minmax(280px,1.2fr)_minmax(180px,0.8fr)]">
                <div className="bg-muted/50 text-muted-foreground flex items-center justify-center border-b font-mono text-sm font-semibold tabular-nums lg:border-b-0 lg:border-r">
                    #{index}
                </div>
                <div className="min-w-0 border-b p-4 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
                            {item.doc_no || `#${item.id}`}
                        </span>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Hạch toán {formatDate(item.posting_date)}
                        </span>
                        {item.doc_date && item.doc_date !== item.posting_date ? (
                            <span>Ngày CT {formatDate(item.doc_date)}</span>
                        ) : null}
                    </div>
                </div>
                <div className="p-4">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Tài khoản / nguồn</div>
                    <div className="mt-1 text-sm font-semibold">{item.account_code ? `TK ${item.account_code}` : "-"}</div>
                    <div className="text-muted-foreground mt-2 text-xs">
                        {item.source_id ? `Nguồn #${item.source_id}` : "Không có nguồn"}
                    </div>
                </div>
            </div>

            <div className="grid divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                <InfoBlock title="Khách hàng" icon={UserRound}>
                    <div className="text-sm font-semibold">{item.customer?.name || item.customer_name || "-"}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        {item.customer?.code || item.customer_id ? `Mã KH: ${item.customer?.code || `#${item.customer_id}`}` : "Chưa gắn khách hàng"}
                    </div>
                </InfoBlock>

                <InfoBlock title="Phát sinh" icon={ReceiptText}>
                    <MoneyLine label="Nợ" value={item.debit_amount} tone="debit" />
                    <MoneyLine label="Có" value={item.credit_amount} tone="credit" />
                    <Separator className="my-1" />
                    <MoneyLine
                        label={net >= 0 ? "Còn phải thu" : "Thu vượt"}
                        value={Math.abs(net)}
                        tone={net >= 0 ? "balance" : "credit"}
                        strong
                    />
                </InfoBlock>

                <InfoBlock title="Dòng tiền" icon={net >= 0 ? ArrowUpRight : ArrowDownLeft}>
                    <div
                        className={cn(
                            "text-xl font-bold tabular-nums",
                            net >= 0 ? "text-amber-700 dark:text-amber-500" : "text-emerald-700 dark:text-emerald-400"
                        )}
                    >
                        {formatCurrency(Math.abs(net))}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        {net >= 0 ? "Khách còn phải thanh toán" : "Khách đã thanh toán vượt"}
                    </div>
                </InfoBlock>

                <InfoBlock title="Diễn giải" icon={FileText}>
                    <div className="line-clamp-3 text-sm">
                        {item.description || "-"}
                    </div>
                </InfoBlock>
            </div>
        </div>
    )
}

function InfoBlock({
    title,
    icon: Icon,
    children,
}: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) {
    return (
        <div className="p-4">
            <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <Icon className="h-3 w-3" />
                {title}
            </div>
            <div>{children}</div>
        </div>
    )
}

function MoneyLine({
    label,
    value,
    tone,
    strong,
}: {
    label: string
    value?: number
    tone?: "debit" | "credit" | "balance"
    strong?: boolean
}) {
    const amount = Number(value || 0)
    return (
        <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span
                className={cn(
                    "text-right tabular-nums",
                    strong ? "font-bold" : "font-semibold",
                    !amount && "text-muted-foreground",
                    tone === "debit" && amount > 0 && "text-rose-600",
                    tone === "credit" && amount > 0 && "text-emerald-600",
                    tone === "balance" && amount > 0 && "text-amber-700 dark:text-amber-500"
                )}
            >
                {amount ? formatCurrency(amount) : "-"}
            </span>
        </div>
    )
}

function GroupBalance({ rows }: { rows: ArLedger[] }) {
    const debit = rows.reduce((sum, row) => sum + Number(row.debit_amount || 0), 0)
    const credit = rows.reduce((sum, row) => sum + Number(row.credit_amount || 0), 0)
    const net = debit - credit

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="text-rose-600">
                Nợ {formatCurrency(debit)}
            </Badge>
            <Badge variant="outline" className="text-emerald-600">
                Có {formatCurrency(credit)}
            </Badge>
            <Badge variant="secondary" className={net >= 0 ? "text-amber-700" : "text-emerald-700"}>
                {net >= 0 ? "Còn thu" : "Thu vượt"} {formatCurrency(Math.abs(net))}
            </Badge>
        </div>
    )
}

function groupByCustomer(rows: ArLedger[]) {
    const groups = new Map<string, LedgerGroup>()

    rows.forEach((row) => {
        const key = row.customer_id ? String(row.customer_id) : `unknown-${row.customer_name || "none"}`
        const label = row.customer?.name || row.customer_name || "Chưa gắn khách hàng"
        const sub = row.customer?.code || (row.customer_id ? `#${row.customer_id}` : undefined)

        if (!groups.has(key)) {
            groups.set(key, { key, label, sub, items: [] })
        }
        groups.get(key)!.items.push(row)
    })

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "vi"))
}

function formatDate(value?: string) {
    if (!value) return "-"
    return value.split("T")[0]
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}
