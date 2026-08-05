import type React from "react"
import { useMemo, useState } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { Loader2, Search } from "lucide-react"

import { listCostPeriods, listPeriodCosts, type CostPeriod, type ProductPeriodCost } from "@/api/inventory/costing"
import { Main } from "@/components/layout/main"
import { CardPagination } from "@/components/table/card-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { StickyReportTable } from "@/features/inventory/components/sticky-report-table"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"

const PERIOD_PAGE_SIZE = 20
const DETAIL_PAGE_SIZE = 50
const GRID_TABLE_CLASS = "[&_td]:border [&_td]:border-slate-200 [&_th]:border [&_th]:border-slate-200"
const DETAIL_COLUMN_WIDTHS = [64, 150, 320, 90, 160, 220, 140, 130, 150, 130, 150, 130, 150, 130, 150]

type PeriodTotals = {
    opening_value?: number
    inbound_value?: number
    outbound_value?: number
    closing_value?: number
}

export default function InventoryCostsPage() {
    const [pageIndex, setPageIndex] = useState(0)
    const [selectedPeriod, setSelectedPeriod] = useState<CostPeriod | null>(null)

    const periodsQuery = useQuery({
        queryKey: ["inventory-costs-periods", pageIndex],
        queryFn: () => listCostPeriods({ page: pageIndex + 1, size: PERIOD_PAGE_SIZE }),
    })

    const periods = periodsQuery.data?.items || []
    const totalsQueries = useQueries({
        queries: periods.map((period) => ({
            queryKey: ["inventory-costs-period-totals", period.id],
            queryFn: () => listPeriodCosts(period.id, { page: 1, size: 1 }),
            enabled: Boolean(period.id),
            staleTime: 60_000,
        })),
    })

    const totalsByPeriodId = useMemo(() => {
        const map = new Map<number, PeriodTotals>()
        periods.forEach((period, index) => {
            map.set(period.id, totalsQueries[index]?.data?.totals || {})
        })
        return map
    }, [periods, totalsQueries])

    return (
        <Main className="flex w-full min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Giá thành</h2>
                    <p className="text-sm text-muted-foreground">Danh sách các kỳ tính giá và tổng giá trị tồn kho theo kỳ.</p>
                </div>
            </div>

            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b px-3 py-2">
                    <div className="font-semibold">Danh sách kỳ tính giá</div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] border-collapse text-sm">
                            <thead className="bg-slate-100 text-xs uppercase text-muted-foreground">
                                <tr>
                                    <Th>Từ ngày</Th>
                                    <Th>Đến ngày</Th>
                                    <Th>Tên kỳ</Th>
                                    <Th className="text-right">GT đầu kỳ</Th>
                                    <Th className="text-right">GT nhập</Th>
                                    <Th className="text-right">GT xuất</Th>
                                    <Th className="text-right">GT tồn</Th>
                                    <Th>Trạng thái</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((period) => {
                                    const totals = totalsByPeriodId.get(period.id) || {}
                                    return (
                                        <tr key={period.id} className="border-t hover:bg-slate-50">
                                            <Td center>{formatDate(period.from_date)}</Td>
                                            <Td center>{formatDate(period.to_date)}</Td>
                                            <Td className="font-medium">
                                                <button
                                                    type="button"
                                                    className="max-w-full truncate text-left text-primary underline-offset-2 hover:underline"
                                                    onClick={() => setSelectedPeriod(period)}
                                                >
                                                    {period.name}
                                                </button>
                                            </Td>
                                            <Td number>{formatCurrency(totals.opening_value)}</Td>
                                            <Td number>{formatCurrency(totals.inbound_value)}</Td>
                                            <Td number>{formatCurrency(totals.outbound_value)}</Td>
                                            <Td number>{formatCurrency(totals.closing_value)}</Td>
                                            <Td center><StatusBadge status={period.status} /></Td>
                                        </tr>
                                    )
                                })}
                                {periodsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                                            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                                            Đang tải danh sách kỳ...
                                        </td>
                                    </tr>
                                )}
                                {!periodsQuery.isLoading && !periods.length && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                                            Chưa có kỳ tính giá.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <CardPagination
                        className="border-t py-3"
                        pageIndex={pageIndex}
                        pageCount={periodsQuery.data?.total_page || 1}
                        onPageChange={setPageIndex}
                    />
                </CardContent>
            </Card>

            <PeriodCostDialog
                period={selectedPeriod}
                open={Boolean(selectedPeriod)}
                onOpenChange={(open) => {
                    if (!open) setSelectedPeriod(null)
                }}
            />
        </Main>
    )
}

function PeriodCostDialog({ period, open, onOpenChange }: {
    period: CostPeriod | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [keyword, setKeyword] = useState("")
    const [pageIndex, setPageIndex] = useState(0)
    const costsQuery = useQuery({
        queryKey: ["inventory-costs-period-detail", period?.id, keyword, pageIndex],
        queryFn: () => listPeriodCosts(period!.id, {
            page: pageIndex + 1,
            size: DETAIL_PAGE_SIZE,
            keyword,
        }),
        enabled: open && Boolean(period?.id),
    })
    const totals = costsQuery.data?.totals || {}

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex max-w-none flex-col gap-3 overflow-hidden p-4"
                style={{
                    width: "calc(100vw - 16px)",
                    maxWidth: "calc(100vw - 16px)",
                    height: "calc(100vh - 16px)",
                    maxHeight: "calc(100vh - 16px)",
                }}
            >
                <DialogHeader>
                    <DialogTitle>Tổng hợp tồn kho</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {period ? `${period.name} - ${formatDate(period.from_date)} - ${formatDate(period.to_date)}` : ""}
                    </div>
                </DialogHeader>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        value={keyword}
                        placeholder="Tìm mã hàng, tên hàng"
                        onChange={(event) => {
                            setKeyword(event.target.value)
                            setPageIndex(0)
                        }}
                    />
                </div>
                <div className="min-h-0 overflow-auto">
                    <StickyReportTable
                        columnWidths={DETAIL_COLUMN_WIDTHS}
                        tableClassName={cn("border-collapse", GRID_TABLE_CLASS)}
                        renderHeader={() => (
                            <>
                                <tr>
                                    <Th rowSpan={2}>STT</Th>
                                    <Th rowSpan={2}>Mã hàng</Th>
                                    <Th rowSpan={2}>Tên hàng</Th>
                                    <Th rowSpan={2}>ĐVT</Th>
                                    <Th rowSpan={2}>Mã kho</Th>
                                    <Th rowSpan={2}>Tên kho</Th>
                                    <Th rowSpan={2}>Đơn giá</Th>
                                    <Th colSpan={2}>Đầu kỳ</Th>
                                    <Th colSpan={2}>Nhập</Th>
                                    <Th colSpan={2}>Xuất</Th>
                                    <Th colSpan={2}>Tồn</Th>
                                </tr>
                                <tr>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                    <Th>Số lượng</Th>
                                    <Th>Giá trị</Th>
                                </tr>
                            </>
                        )}
                        renderBody={() => (
                            <>
                                {(costsQuery.data?.items || []).map((row, index) => (
                                    <CostDetailRow key={row.id} row={row} index={pageIndex * DETAIL_PAGE_SIZE + index + 1} />
                                ))}
                                {costsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={15} className="p-6 text-center text-sm text-muted-foreground">
                                            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                                            Đang tải tổng hợp tồn kho...
                                        </td>
                                    </tr>
                                )}
                                {!costsQuery.isLoading && !costsQuery.data?.items?.length && (
                                    <tr>
                                        <td colSpan={15} className="p-6 text-center text-sm text-muted-foreground">
                                            Chưa có kết quả tính giá trong kỳ này.
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                        renderFooter={() => (
                            <tr>
                                <Td colSpan={7} className="bg-slate-50 text-right font-semibold">Tổng</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatNumber(totals.opening_quantity)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatCurrency(totals.opening_value)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatNumber(totals.inbound_quantity)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatCurrency(totals.inbound_value)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatNumber(totals.outbound_quantity)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatCurrency(totals.outbound_value)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatNumber(totals.closing_quantity)}</Td>
                                <Td number className="bg-slate-50 font-semibold">{formatCurrency(totals.closing_value)}</Td>
                            </tr>
                        )}
                    />
                    <CardPagination
                        className="border-t py-3"
                        pageIndex={pageIndex}
                        pageCount={costsQuery.data?.total_page || 1}
                        onPageChange={setPageIndex}
                    />
                </div>
                <div className="flex justify-end border-t pt-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function CostDetailRow({ row, index }: { row: ProductPeriodCost; index: number }) {
    return (
        <tr className="border-t">
            <Td center>{index}</Td>
            <Td center>{row.product_code || "-"}</Td>
            <Td className="font-medium">{row.product_name || "-"}</Td>
            <Td center>{row.unit || "-"}</Td>
            <Td center>{row.warehouse_code || "-"}</Td>
            <Td>{row.warehouse_name || "-"}</Td>
            <Td number>{formatCurrency(row.avg_unit_cost)}</Td>
            <Td number>{formatNumber(row.opening_quantity)}</Td>
            <Td number>{formatCurrency(row.opening_value)}</Td>
            <Td number>{formatNumber(row.inbound_quantity)}</Td>
            <Td number>{formatCurrency(row.inbound_value)}</Td>
            <Td number>{formatNumber(row.outbound_quantity)}</Td>
            <Td number>{formatCurrency(row.outbound_value)}</Td>
            <Td number>{formatNumber(row.closing_quantity)}</Td>
            <Td number>{formatCurrency(row.closing_value)}</Td>
        </tr>
    )
}

function StatusBadge({ status }: { status?: string }) {
    const label = status === "LOCKED"
        ? "Đã khóa"
        : status === "CALCULATED"
            ? "Đã tính"
            : status === "STALE"
                ? "Cần tính lại"
                : "Nháp"
    return (
        <span
            className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                status === "LOCKED" && "bg-slate-900 text-white",
                status === "CALCULATED" && "bg-teal-100 text-teal-700",
                status === "STALE" && "bg-amber-100 text-amber-800",
                status !== "LOCKED" && status !== "CALCULATED" && status !== "STALE" && "bg-slate-100 text-slate-600",
            )}
        >
            {label}
        </span>
    )
}

function Th({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn("border-b px-3 py-1.5 text-center text-xs font-semibold uppercase", className)} {...props}>{children}</th>
}

function Td({
    children,
    center,
    number,
    className,
    ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { center?: boolean; number?: boolean }) {
    return (
        <td
            className={cn("overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1.5 align-middle", center && "text-center", number && "text-right tabular-nums", className)}
            {...props}
        >
            {children}
        </td>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [year, month, day] = value.slice(0, 10).split("-")
    return `${day}/${month}/${year}`
}
