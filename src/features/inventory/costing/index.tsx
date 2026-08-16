import { Fragment, useEffect, useMemo, useState } from "react"
import type React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Calculator, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Loader2, Play, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { listInventoryLedgerReport } from "@/api/inventory/ledger"
import {
    calculateCostPeriod,
    createCostPeriod,
    deleteCostPeriod,
    getCostBasis,
    listCostPeriods,
    listFinishedProductCostExport,
    listPeriodCosts,
    type CostBasis,
    type CostPeriod,
    type CostingCalculationError,
    type FinishedProductCostExportRow,
    type LotCostAllocation,
    type ProductPeriodCost,
    type ProductionCostBasis,
    type TransferInboundCostBasis,
} from "@/api/inventory/costing"
import { Main } from "@/components/layout/main"
import { CardPagination } from "@/components/table/card-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StickyReportTable } from "@/features/inventory/components/sticky-report-table"
import type { InventoryLedgerReportRow } from "@/features/inventory/ledger/data/schema"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"

function todayYmd() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function firstDayOfMonth() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

const COSTING_PAGE_SIZE = 50
const COSTING_EXPORT_PAGE_SIZE = 1000
const GRID_TABLE_CLASS = "[&_td]:border [&_td]:border-slate-200 [&_th]:border [&_th]:border-slate-200"
type CostResultFilter = "all" | "production"
const QUARTERS = [
    { label: "Quý 1", value: 1 },
    { label: "Quý 2", value: 2 },
    { label: "Quý 3", value: 3 },
    { label: "Quý 4", value: 4 },
]

function yearOf(date?: string) {
    const year = Number((date || "").slice(0, 4))
    return Number.isFinite(year) && year > 0 ? year : new Date().getFullYear()
}

function quarterOf(date?: string) {
    const month = Number((date || "").slice(5, 7))
    if (!Number.isFinite(month) || month < 1 || month > 12) return 1
    return Math.floor((month - 1) / 3) + 1
}

export default function InventoryCostingPage() {
    const queryClient = useQueryClient()
    const [selectedPeriodId, setSelectedPeriodId] = useState<number>()
    const [costKeyword, setCostKeyword] = useState("")
    const [periodYear, setPeriodYear] = useState(new Date().getFullYear())

    const periodsQuery = useQuery({
        queryKey: ["inventory-cost-periods"],
        queryFn: () => listCostPeriods({ page: 1, size: 1000 }),
    })

    const periods = periodsQuery.data?.items || []
    const yearPeriods = useMemo(
        () => periods.filter((period) => yearOf(period.from_date) === periodYear),
        [periods, periodYear],
    )
    const selectedPeriod = useMemo(
        () => {
            const selected = yearPeriods.find((period) => period.id === selectedPeriodId)
            return selected || yearPeriods[0]
        },
        [yearPeriods, selectedPeriodId],
    )
    const deletePeriodMutation = useMutation({
        mutationFn: (period: CostPeriod) => deleteCostPeriod(period.id),
        onSuccess: (result, period) => {
            const staleNotice = result.stale_periods > 0 ? `; ${result.stale_periods} kỳ sau cần tính lại` : ""
            toast.success(`Đã xóa kỳ ${period.name}${staleNotice}`)
            if (selectedPeriodId === period.id) {
                setSelectedPeriodId(undefined)
            }
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-periods"] })
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-period-costs"] })
            queryClient.invalidateQueries({ queryKey: ["inventory-production-cost-results"] })
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không xóa được kỳ tính giá"),
    })

    return (
        <Main className="flex w-full min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-1.5">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight">Tính giá tồn kho</h2>
                </div>
                <CreatePeriodDialog />
            </div>

            <div className="mt-0 space-y-2">
                <Card className="gap-2 overflow-hidden py-2">
                    <CardHeader className="px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-semibold">Danh sách kỳ</div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPeriodYear((year) => year - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="min-w-24 text-center text-lg font-semibold">{periodYear}</div>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPeriodYear((year) => year + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 py-0">
                        {periodsQuery.isLoading ? (
                            <div className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">Đang tải kỳ tính giá...</div>
                        ) : (
                            <div className="grid gap-2 lg:grid-cols-4">
                                {QUARTERS.map((quarter) => {
                                    const quarterPeriods = yearPeriods.filter((period) => quarterOf(period.from_date) === quarter.value)
                                    return (
                                        <div key={quarter.value} className="rounded-md bg-slate-50 p-2">
                                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                                <div className="font-semibold">{quarter.label}</div>
                                                <div className="text-xs text-muted-foreground">{quarterPeriods.length} kỳ</div>
                                            </div>
                                            <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                                                {quarterPeriods.map((period) => (
                                                    <div
                                                        key={period.id}
                                                        role="button"
                                                        tabIndex={0}
                                                        className={cn(
                                                            "w-full cursor-pointer rounded-md bg-white px-2.5 py-1.5 text-left shadow-sm transition hover:bg-teal-50",
                                                            selectedPeriod?.id === period.id && "bg-teal-50 ring-1 ring-teal-300",
                                                        )}
                                                        onClick={() => setSelectedPeriodId(period.id)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter" || event.key === " ") {
                                                                event.preventDefault()
                                                                setSelectedPeriodId(period.id)
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="truncate font-semibold">{period.name}</div>
                                                                <div className="text-muted-foreground text-xs">
                                                                    {formatDate(period.from_date)} - {formatDate(period.to_date)}
                                                                </div>
                                                            </div>
                                                            <DeletePeriodButton
                                                                period={period}
                                                                isDeleting={deletePeriodMutation.isPending}
                                                                onDelete={() => deletePeriodMutation.mutate(period)}
                                                            />
                                                        </div>
                                                        <StatusBadge status={period.status} />
                                                    </div>
                                                ))}
                                                {!quarterPeriods.length && (
                                                    <div className="rounded-md bg-white/70 px-3 py-5 text-center text-sm text-muted-foreground">
                                                        Chưa có kỳ
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {selectedPeriod ? (
                    <PeriodDetail period={selectedPeriod} keyword={costKeyword} onKeywordChange={setCostKeyword} />
                ) : (
                    <Card className="py-2">
                        <CardContent className="p-6 text-sm text-muted-foreground">
                            Tạo kỳ tính giá để bắt đầu.
                        </CardContent>
                    </Card>
                )}
            </div>
        </Main>
    )
}

function DeletePeriodButton({
    period,
    isDeleting,
    onDelete,
}: {
    period: CostPeriod
    isDeleting: boolean
    onDelete: () => void
}) {
    const locked = period.status === "LOCKED"
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    disabled={locked || isDeleting}
                    title={locked ? "Kỳ đã khóa, không thể xóa" : "Xóa kỳ"}
                    onClick={(event) => {
                        event.stopPropagation()
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(event) => event.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa kỳ tính giá?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Kỳ {period.name} sẽ bị xóa cùng toàn bộ kết quả tính giá đã lưu. Các kỳ sau nếu đã tính sẽ được đánh dấu cần tính lại.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(event) => event.stopPropagation()}>Đóng</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={(event) => {
                            event.stopPropagation()
                            onDelete()
                        }}
                    >
                        Xóa kỳ
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

function PeriodDetail({ period, keyword, onKeywordChange }: {
    period: CostPeriod
    keyword: string
    onKeywordChange: (value: string) => void
}) {
    const queryClient = useQueryClient()
    const [pageIndex, setPageIndex] = useState(0)
    const [basisRow, setBasisRow] = useState<ProductPeriodCost | null>(null)
    const [resultFilter, setResultFilter] = useState<CostResultFilter>("all")
    const [calculationError, setCalculationError] = useState<{
        message: string
        details: CostingCalculationError[]
    } | null>(null)
    const productionOnly = resultFilter === "production"

    useEffect(() => {
        setPageIndex(0)
        setBasisRow(null)
    }, [period.id, keyword, resultFilter])

    const costsQuery = useQuery({
        queryKey: ["inventory-cost-period-costs", period.id, keyword, resultFilter, pageIndex],
        queryFn: () => listPeriodCosts(period.id, {
            page: pageIndex + 1,
            size: COSTING_PAGE_SIZE,
            keyword,
            production_only: productionOnly,
        }),
    })

    const calculateMutation = useMutation({
        mutationFn: () => calculateCostPeriod(period.id),
        onSuccess: (result) => {
            setCalculationError(null)
            const staleNotice = result.stale_periods > 0
                ? `; ${result.stale_periods} kỳ sau cần tính lại`
                : ""
            toast.success(`Đã tính giá: ${result.product_rows} dòng, ${result.production_product_count} thành phẩm${staleNotice}`)
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-periods"] })
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-period-costs", period.id] })
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-lot-allocations", period.id] })
            queryClient.invalidateQueries({ queryKey: ["inventory-production-cost-results", period.id] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : "Không tính được giá"
            const details = Array.isArray((error as any)?.data?.details) ? (error as any).data.details : []
            setCalculationError({ message, details })
            toast.error("Không tính được giá. Xem chi tiết trên màn hình.")
        },
    })

    const exportMutation = useMutation({
        mutationFn: async () => {
            const rows = await fetchAllPeriodCosts(period.id, keyword, productionOnly)
            await exportCostingResultsXlsx(period, rows)
            return rows.length
        },
        onSuccess: (count) => toast.success(`Đã xuất ${formatNumber(count)} dòng tổng hợp tồn kho`),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không xuất được file Excel"),
    })

    const finishedProductExportMutation = useMutation({
        mutationFn: async () => {
            const rows = await listFinishedProductCostExport(period.id, keyword)
            await exportFinishedProductCostsXlsx(period, rows)
            return rows.length
        },
        onSuccess: (count) => toast.success(`Đã xuất ${formatNumber(count)} thành phẩm`),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không xuất được file Excel thành phẩm"),
    })

    const totals = costsQuery.data?.totals || {}

    return (
        <div className="space-y-2">
            <Card className="py-2">
                <CardContent className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div>
                        <div className="text-base font-semibold">{period.name}</div>
                        <div className="text-muted-foreground text-xs">
                            {formatDate(period.from_date)} - {formatDate(period.to_date)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            disabled={period.status === "LOCKED" || calculateMutation.isPending}
                            onClick={() => calculateMutation.mutate()}
                        >
                            {calculateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="mr-2 h-4 w-4" />
                            )}
                            {calculateMutation.isPending ? "Đang tính..." : "Tính giá"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {calculationError && (
                <CostingCalculationErrorPanel
                    message={calculationError.message}
                    details={calculationError.details}
                    onClose={() => setCalculationError(null)}
                />
            )}

            <Card className="gap-2 overflow-hidden py-2">
                <CardHeader className="border-b px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold">Tổng hợp tồn kho</div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                            <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-1">
                                <CostResultFilterButton
                                    active={resultFilter === "all"}
                                    label="Tất cả"
                                    count={costsQuery.data?.all_count || costsQuery.data?.total || 0}
                                    onClick={() => setResultFilter("all")}
                                />
                                <CostResultFilterButton
                                    active={resultFilter === "production"}
                                    label="Thành phẩm đã tính giá"
                                    count={costsQuery.data?.production_count || 0}
                                    onClick={() => setResultFilter("production")}
                                />
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    className="pl-9"
                                    value={keyword}
                                    placeholder="Tìm mã hàng, tên hàng"
                                    onChange={(event) => onKeywordChange(event.target.value)}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={finishedProductExportMutation.isPending}
                                onClick={() => finishedProductExportMutation.mutate()}
                            >
                                {finishedProductExportMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                Xuất Excel TP
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={exportMutation.isPending}
                                onClick={() => exportMutation.mutate()}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Xuất Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <StickyReportTable
                        columnWidths={[64, 150, 320, 90, 160, 220, 140, 130, 150, 130, 150, 130, 150, 130, 150]}
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
                                    <tr key={row.id} className="border-t">
                                        <Td center>{pageIndex * COSTING_PAGE_SIZE + index + 1}</Td>
                                        <Td center>{row.product_code}</Td>
                                        <Td className="font-medium">
                                            <button
                                                type="button"
                                                className="max-w-full truncate text-left text-primary underline-offset-2 hover:underline"
                                                onClick={() => setBasisRow(row)}
                                            >
                                                {row.product_name || "-"}
                                            </button>
                                        </Td>
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
                                ))}
                                {!costsQuery.data?.items?.length && (
                                    <tr>
                                        <td colSpan={15} className="p-6 text-center text-sm text-muted-foreground">
                                            Chưa có kết quả. Bấm Tính giá để sinh dữ liệu kỳ.
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                        renderFooter={() => (
                            <tr>
                                <Td colSpan={7} className="bg-slate-50 text-right font-semibold">
                                    Tổng
                                </Td>
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
                </CardContent>
            </Card>
            <CostBasisDialog
                period={period}
                row={basisRow}
                open={basisRow !== null}
                onOpenChange={(open) => {
                    if (!open) setBasisRow(null)
                }}
            />
        </div>
    )
}

function CostResultFilterButton({
    active,
    label,
    count,
    onClick,
}: {
    active: boolean
    label: string
    count: number
    onClick: () => void
}) {
    return (
        <button
            type="button"
            className={cn(
                "inline-flex h-8 items-center gap-2 rounded px-3 text-sm font-medium transition",
                active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
            onClick={onClick}
        >
            <span>{label}</span>
            <span
                className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-foreground",
                )}
            >
                {formatNumber(count)}
            </span>
        </button>
    )
}

function CostingCalculationErrorPanel({
    message,
    details,
    onClose,
}: {
    message: string
    details: CostingCalculationError[]
    onClose: () => void
}) {
    const returnErrors = details.filter((item) => item.errorType === "SALES_RETURN_MISSING_COST")
    const dependencyErrors = details.filter((item) => item.errorType !== "SALES_RETURN_MISSING_COST")

    return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-950">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                        <div className="font-semibold">Không tính được giá</div>
                        <div className="mt-1 text-sm text-red-800">{message}</div>
                    </div>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-red-900 hover:bg-red-100" onClick={onClose}>
                    Đóng
                </Button>
            </div>
            {returnErrors.length > 0 && (
                <div className="mt-3 max-h-[360px] overflow-auto rounded-md border border-red-200 bg-background">
                    <div className="sticky left-0 top-0 z-10 border-b border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-900">
                        Dòng hàng bán trả lại chưa có giá vốn
                    </div>
                    <table className="min-w-[1320px] w-full text-sm">
                        <thead className="bg-red-50 text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left">STT</th>
                                <th className="px-3 py-2 text-left">Chứng từ</th>
                                <th className="px-3 py-2 text-left">Ngày</th>
                                <th className="px-3 py-2 text-left">Hàng trả lại</th>
                                <th className="px-3 py-2 text-left">Kho nhập</th>
                                <th className="px-3 py-2 text-left">Số lô</th>
                                <th className="px-3 py-2 text-right">SL trả</th>
                                <th className="px-3 py-2 text-left">Lý do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnErrors.map((item, index) => (
                                <tr key={`${item.ledgerId || item.documentNo || "return"}-${index}`} className="border-t border-red-100">
                                    <td className="px-3 py-2 align-top">{index + 1}</td>
                                    <td className="px-3 py-2 align-top font-medium">{item.documentNo || "-"}</td>
                                    <td className="px-3 py-2 align-top whitespace-nowrap">{formatDate(item.postingDate)}</td>
                                    <td className="px-3 py-2 align-top">
                                        <div className="font-medium">{item.outputProductName || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.outputProductCode || "-"}</div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-muted-foreground">{item.outputWarehouse || "-"}</td>
                                    <td className="px-3 py-2 align-top font-mono text-xs">{item.lotNo || "-"}</td>
                                    <td className="px-3 py-2 align-top text-right tabular-nums">{formatNumber(item.materialQuantity || 0)}</td>
                                    <td className="px-3 py-2 align-top text-red-800">{item.reason || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {dependencyErrors.length > 0 && (
                <div className="mt-3 max-h-[360px] overflow-auto rounded-md border border-red-200 bg-background">
                    <div className="sticky left-0 top-0 z-10 border-b border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-900">
                        Nghiệp vụ phụ thuộc giá chưa tính được
                    </div>
                    <table className="min-w-[1120px] w-full text-sm">
                        <thead className="bg-red-50 text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 text-left">STT</th>
                                <th className="px-3 py-2 text-left">Thành phẩm</th>
                                <th className="px-3 py-2 text-left">Kho TP</th>
                                <th className="px-3 py-2 text-left">Vật tư bị kẹt</th>
                                <th className="px-3 py-2 text-left">Kho vật tư</th>
                                <th className="px-3 py-2 text-right">SL vật tư</th>
                                <th className="px-3 py-2 text-left">Lý do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dependencyErrors.map((item, index) => (
                                <tr key={`${item.productionItemId || "row"}-${index}`} className="border-t border-red-100">
                                    <td className="px-3 py-2 align-top">{index + 1}</td>
                                    <td className="px-3 py-2 align-top">
                                        <div className="font-medium">{item.outputProductName || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.outputProductCode || "-"}</div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-muted-foreground">{item.outputWarehouse || "-"}</td>
                                    <td className="px-3 py-2 align-top">
                                        <div className="font-medium">{item.materialProductName || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{item.materialProductCode || "-"}</div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-muted-foreground">{item.materialWarehouse || "-"}</td>
                                    <td className="px-3 py-2 align-top text-right tabular-nums">{formatNumber(item.materialQuantity || 0)}</td>
                                    <td className="px-3 py-2 align-top text-red-800">{item.reason || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function CostBasisDialog({
    period,
    row,
    open,
    onOpenChange,
}: {
    period: CostPeriod
    row: ProductPeriodCost | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const query = useQuery({
        queryKey: ["inventory-cost-basis", period.id, row?.product_id, row?.warehouse_id],
        enabled: open && !!row,
        queryFn: () => getCostBasis(period.id, row!.product_id, row!.warehouse_id),
    })
    const ledgerQuery = useQuery({
        queryKey: ["inventory-cost-basis-ledger", period.id, row?.product_id, row?.warehouse_id],
        enabled: open && !!row,
        queryFn: () => listInventoryLedgerReport({
            page: 1,
            size: 200,
            product_id: row!.product_id,
            warehouse_id: row!.warehouse_id || undefined,
            from_date: period.from_date,
            to_date: period.to_date,
            time_sort: "asc",
            show_values: true,
        }),
    })
    const basis = query.data

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!flex max-h-[92vh] w-[min(96vw,1800px)] !max-w-none flex-col overflow-hidden p-0">
                <DialogHeader className="border-b px-5 py-4">
                    <DialogTitle>Cơ sở tính giá</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{row?.product_name || "-"} · {row?.product_code || "-"} · {row?.warehouse_name || "-"} · Kỳ {formatDate(period.from_date)} - {formatDate(period.to_date)}</span>
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                            Giá đã tính: {formatCurrency(row?.avg_unit_cost || 0)}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                    {query.isLoading ? (
                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tải cơ sở tính giá...
                        </div>
                    ) : query.isError ? (
                        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            Không tải được cơ sở tính giá.
                        </div>
                    ) : (
                        <>
                            <LotAllocationsPanel rows={basis?.lot_allocations || []} isLoading={false} />
                            <ProductionCostBasisPanel rows={basis?.production_costs || []} />
                            <TransferInboundBasisPanel rows={basis?.transfer_inbounds || []} />
                            {isEmptyCostBasis(basis) && (
                                <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">
                                    Chưa có chi tiết cơ sở tính giá cho dòng này. Dòng giá vốn được tính từ số liệu tổng hợp của sổ kho trong kỳ.
                                </div>
                            )}
                            <CostBasisLedgerPanel
                                rows={ledgerQuery.data?.items || []}
                                total={ledgerQuery.data?.total || 0}
                                isLoading={ledgerQuery.isLoading}
                            />
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function isEmptyCostBasis(basis?: CostBasis) {
    if (!basis) return false
    return !basis.lot_allocations?.length && !basis.production_costs?.length && !basis.transfer_inbounds?.length
}

function CostBasisLedgerPanel({
    rows,
    total,
    isLoading,
}: {
    rows: InventoryLedgerReportRow[]
    total: number
    isLoading: boolean
}) {
    return (
        <div className="rounded-md border bg-background">
            <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                <div className="text-sm font-semibold">Các lần nhập xuất trong kỳ</div>
                {total > rows.length ? (
                    <div className="text-xs text-muted-foreground">Đang hiển thị {formatNumber(rows.length)} / {formatNumber(total)} dòng đầu tiên</div>
                ) : null}
            </div>
            {isLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải nhập xuất trong kỳ...
                </div>
            ) : rows.length ? (
                <StickyReportTable
                    columnWidths={[56, 110, 80, 150, 280, 130, 130, 120, 150, 120, 150, 120, 150, 90, 90, 160, 260]}
                    tableClassName={cn("border-collapse", GRID_TABLE_CLASS)}
                    defaultPinnedUntil={-1}
                    renderHeader={() => (
                        <>
                            <tr>
                                <Th rowSpan={2}>STT</Th>
                                <Th rowSpan={2}>Ngày</Th>
                                <Th rowSpan={2}>Giờ</Th>
                                <Th rowSpan={2}>Chứng từ</Th>
                                <Th rowSpan={2}>Diễn giải</Th>
                                <Th rowSpan={2}>Số lô</Th>
                                <Th rowSpan={2}>Đơn giá</Th>
                                <Th colSpan={2}>Nhập</Th>
                                <Th colSpan={2}>Xuất</Th>
                                <Th colSpan={2}>Tồn</Th>
                                <Th rowSpan={2}>TK Nợ</Th>
                                <Th rowSpan={2}>TK Có</Th>
                                <Th rowSpan={2}>Mã đối tượng THCP</Th>
                                <Th rowSpan={2}>Tên đối tượng THCP</Th>
                            </tr>
                            <tr>
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
                            {rows.map((item, index) => {
                                const unitPrice = Number(item.unit_price || 0)
                                const quantityIn = Number(item.quantity_in || 0)
                                const quantityOut = Number(item.quantity_out || 0)
                                const balanceQuantity = Number(item.balance_quantity || 0)
                                return (
                                    <tr key={`${item.id}-${index}`} className="border-t">
                                        <Td center>{index + 1}</Td>
                                        <Td center>{formatDate(item.posting_date)}</Td>
                                        <Td center>{formatTime(item.posting_time)}</Td>
                                        <Td className="font-mono text-xs">{item.doc_no || "-"}</Td>
                                        <Td>{item.description || "-"}</Td>
                                        <Td center>{item.lot_code || "-"}</Td>
                                        <Td number>{formatCurrency(unitPrice)}</Td>
                                        <Td number>{quantityIn ? formatNumber(quantityIn) : "-"}</Td>
                                        <Td number>{quantityIn ? formatCurrency(quantityIn * unitPrice) : "-"}</Td>
                                        <Td number>{quantityOut ? formatNumber(quantityOut) : "-"}</Td>
                                        <Td number>{quantityOut ? formatCurrency(quantityOut * unitPrice) : "-"}</Td>
                                        <Td number>{formatNumber(balanceQuantity)}</Td>
                                        <Td number>{formatCurrency(balanceQuantity * unitPrice)}</Td>
                                        <Td center>{item.tk_no || "-"}</Td>
                                        <Td center>{item.tk_co || "-"}</Td>
                                        <Td center>{item.cost_object_code || "-"}</Td>
                                        <Td>{item.cost_object_name || "-"}</Td>
                                    </tr>
                                )
                            })}
                        </>
                    )}
                />
            ) : (
                <div className="p-4 text-sm text-muted-foreground">
                    Không có dòng nhập xuất trong kỳ cho sản phẩm và kho này.
                </div>
            )}
        </div>
    )
}

function LotAllocationsPanel({ rows, isLoading }: { rows: LotCostAllocation[]; isLoading: boolean }) {
    if (isLoading) {
        return <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">Đang tải phân bổ theo lô...</div>
    }
    if (!rows.length) return null

    return (
        <div className="rounded-md border bg-background">
            <div className="border-b px-3 py-2 text-sm font-semibold">Chi tiết phân bổ theo lô</div>
            <StickyReportTable
                columnWidths={[64, 180, 260, 140, 140, 150, 150, 150, 170]}
                tableClassName={cn("border-collapse", GRID_TABLE_CLASS)}
                defaultPinnedUntil={-1}
                renderHeader={() => (
                        <tr>
                            <Th>STT</Th>
                            <Th>Số lô</Th>
                            <Th>Kho</Th>
                            <Th>Ngày nhập</Th>
                            <Th>HSD</Th>
                            <Th>SL phân bổ</Th>
                            <Th>Giá mua</Th>
                            <Th>Đơn giá</Th>
                            <Th>Thành tiền</Th>
                        </tr>
                )}
                renderBody={() => (
                    <>
                        {rows.map((row, index) => (
                            <tr key={row.id} className="border-t">
                                <Td center>{index + 1}</Td>
                                <Td center className="font-mono">{row.lot_no || "-"}</Td>
                                <Td>
                                    <div className="truncate font-medium">{row.warehouse_name || "-"}</div>
                                    <div className="truncate text-xs text-muted-foreground">{row.warehouse_code || ""}</div>
                                </Td>
                                <Td center>{formatDate(row.inbound_date)}</Td>
                                <Td center>{formatDate(row.expiry_date)}</Td>
                                <Td number>{formatNumber(row.quantity_basis)}</Td>
                                <Td number>{formatCurrency(row.purchase_amount)}</Td>
                                <Td number>{formatCurrency(row.final_unit_cost)}</Td>
                                <Td number>{formatCurrency(row.final_amount)}</Td>
                            </tr>
                        ))}
                    </>
                )}
            />
        </div>
    )
}

function ProductionCostBasisPanel({ rows }: { rows: ProductionCostBasis[] }) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set())
    if (!rows.length) return null
    const hasLegacyLedgerRows = rows.some((row) => row.source_kind === "LEGACY_LEDGER")

    const toggleRow = (rowId: number) => {
        setExpandedRows((current) => {
            const next = new Set(current)
            if (next.has(rowId)) {
                next.delete(rowId)
            } else {
                next.add(rowId)
            }
            return next
        })
    }

    return (
        <div className="rounded-md border bg-background">
            <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-semibold">
                <span>Cơ sở giá thành sản xuất</span>
                {hasLegacyLedgerRows && (
                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                        Dữ liệu sổ kho cũ
                    </span>
                )}
            </div>
            <StickyReportTable
                columnWidths={[82, 180, 140, 220, 260, 150, 150, 150, 160]}
                tableClassName={cn("border-collapse", GRID_TABLE_CLASS)}
                defaultPinnedUntil={-1}
                renderHeader={() => (
                        <tr>
                            <Th>STT</Th>
                            <Th>Lệnh SX</Th>
                            <Th>Ngày lệnh</Th>
                            <Th>Lô TP</Th>
                            <Th>Kho nhập</Th>
                            <Th>SL nhập TP</Th>
                            <Th>Chi phí vật tư</Th>
                            <Th>Giá thành/ĐV</Th>
                            <Th>Tổng giá thành</Th>
                        </tr>
                )}
                renderBody={() => (
                    <>
                        {rows.map((row, index) => {
                            const hasMaterials = !!row.materials?.length
                            const isExpanded = expandedRows.has(row.id)
                            return (
                                <Fragment key={row.id}>
                                <tr
                                    key={`${row.id}-output`}
                                    className={cn(
                                        "border-t",
                                        hasMaterials && "cursor-pointer hover:bg-slate-50",
                                    )}
                                    onClick={() => hasMaterials && toggleRow(row.id)}
                                >
                                    <Td center>
                                        {hasMaterials ? (
                                            <button
                                                type="button"
                                                className="inline-flex min-w-12 items-center justify-center gap-1 rounded px-1.5 py-1 hover:bg-muted"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    toggleRow(row.id)
                                                }}
                                            >
                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                <span>{index + 1}</span>
                                            </button>
                                        ) : (
                                            index + 1
                                        )}
                                    </Td>
                                    <Td center className="font-medium">{row.production_no || "-"}</Td>
                                    <Td center>{formatDate(row.production_date)}</Td>
                                    <Td center className="font-mono">{row.output_lot_no || "-"}</Td>
                                    <Td>
                                        <div className="truncate font-medium">{row.warehouse_name || "-"}</div>
                                        <div className="truncate text-xs text-muted-foreground">{row.warehouse_code || ""}</div>
                                    </Td>
                                    <Td number>{formatNumber(row.output_quantity)}</Td>
                                    <Td number>{formatCurrency(row.material_cost)}</Td>
                                    <Td number>{formatCurrency(row.unit_cost)}</Td>
                                    <Td number>{formatCurrency(row.total_cost)}</Td>
                                </tr>
                                {hasMaterials && isExpanded && (
                                    <tr key={`${row.id}-materials`} className="border-t bg-slate-50/80">
                                        <td colSpan={9} className="px-3 py-3">
                                            <ProductionMaterialsPanel rows={row.materials} />
                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                            )
                        })}
                    </>
                )}
            />
        </div>
    )
}

function ProductionMaterialsPanel({ rows }: { rows: ProductionCostBasis["materials"] }) {
    if (!rows?.length) return null
    return (
        <div className="rounded-md border bg-background">
            <div className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">Vật tư cấu thành lần nhập TP này</div>
            <StickyReportTable
                columnWidths={[64, 170, 300, 90, 240, 160, 140, 140, 150]}
                tableClassName={cn("border-collapse", GRID_TABLE_CLASS)}
                defaultPinnedUntil={-1}
                renderHeader={() => (
                    <tr>
                        <Th>STT</Th>
                        <Th>Mã vật tư</Th>
                        <Th>Tên vật tư</Th>
                        <Th>ĐVT</Th>
                        <Th>Kho vật tư</Th>
                        <Th>Số lô</Th>
                        <Th>SL dùng</Th>
                        <Th>Đơn giá</Th>
                        <Th>Thành tiền</Th>
                    </tr>
                )}
                renderBody={() => (
                    <>
                        {rows.map((row, index) => (
                            <tr key={`${row.material_product_id || "material"}-${row.warehouse_id || "w"}-${row.lot_no || index}`} className="border-t">
                                <Td center>{index + 1}</Td>
                                <Td center className="font-mono">{row.material_product_code || "-"}</Td>
                                <Td className="font-medium">{row.material_product_name || "-"}</Td>
                                <Td center>{row.unit || "-"}</Td>
                                <Td>
                                    <div className="truncate font-medium">{row.warehouse_name || "-"}</div>
                                    <div className="truncate text-xs text-muted-foreground">{row.warehouse_code || ""}</div>
                                </Td>
                                <Td center className="font-mono">{row.lot_no || "-"}</Td>
                                <Td number>{formatNumber(row.quantity)}</Td>
                                <Td number>{formatCurrency(row.unit_cost)}</Td>
                                <Td number>{formatCurrency(row.amount)}</Td>
                            </tr>
                        ))}
                    </>
                )}
            />
        </div>
    )
}

function TransferInboundBasisPanel({ rows }: { rows: TransferInboundCostBasis[] }) {
    if (!rows.length) return null
    return (
        <div className="rounded-md border bg-background">
            <div className="border-b px-3 py-2 text-sm font-semibold">Cơ sở giá chuyển kho vào</div>
            <StickyReportTable
                columnWidths={[64, 170, 140, 260, 260, 160, 130, 140, 150]}
                tableClassName={cn("border-collapse", GRID_TABLE_CLASS)}
                defaultPinnedUntil={-1}
                renderHeader={() => (
                    <tr>
                        <Th>STT</Th>
                        <Th>Chứng từ</Th>
                        <Th>Ngày</Th>
                        <Th>Kho xuất</Th>
                        <Th>Kho nhập</Th>
                        <Th>Số lô</Th>
                        <Th>SL chuyển</Th>
                        <Th>Giá kho xuất</Th>
                        <Th>Giá trị chuyển</Th>
                    </tr>
                )}
                renderBody={() => (
                    <>
                        {rows.map((row, index) => (
                            <tr key={`${row.doc_no || "transfer"}-${index}`} className="border-t">
                                <Td center>{index + 1}</Td>
                                <Td center className="font-medium">{row.doc_no || "-"}</Td>
                                <Td center>{formatDate(row.posting_date)}</Td>
                                <Td>
                                    <div className="truncate font-medium">{row.from_warehouse_name || "-"}</div>
                                    <div className="truncate text-xs text-muted-foreground">{row.from_warehouse_code || ""}</div>
                                </Td>
                                <Td>
                                    <div className="truncate font-medium">{row.to_warehouse_name || "-"}</div>
                                    <div className="truncate text-xs text-muted-foreground">{row.to_warehouse_code || ""}</div>
                                </Td>
                                <Td center className="font-mono">{row.lot_no || "-"}</Td>
                                <Td number>{formatNumber(row.quantity)}</Td>
                                <Td number>{formatCurrency(row.unit_cost)}</Td>
                                <Td number>{formatCurrency(row.amount)}</Td>
                            </tr>
                        ))}
                    </>
                )}
            />
        </div>
    )
}

function CreatePeriodDialog() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({
        name: "",
        from_date: firstDayOfMonth(),
        to_date: todayYmd(),
        note: "",
    })
    const mutation = useMutation({
        mutationFn: () => createCostPeriod(form),
        onSuccess: () => {
            toast.success("Đã tạo kỳ tính giá")
            setOpen(false)
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-periods"] })
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không tạo được kỳ"),
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo kỳ
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tạo kỳ tính giá</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Tên kỳ">
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label="Ghi chú">
                        <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                    </Field>
                    <Field label="Từ ngày">
                        <Input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
                    </Field>
                    <Field label="Đến ngày">
                        <Input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
                    </Field>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                        <Calculator className="mr-2 h-4 w-4" />
                        Lưu kỳ
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
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

function formatTime(value?: string | null) {
    if (!value) return "-"
    return value.slice(0, 5)
}

type CostingExportColumn = {
    label: string
    width?: number
    type?: "number" | "text"
    numberFormat?: "quantity" | "money"
    value?: (row: ProductPeriodCost, index: number) => string | number | null | undefined
}

const COSTING_EXPORT_COLUMNS: CostingExportColumn[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "quantity", value: (_row, index) => index + 1 },
    { label: "Mã hàng", width: 22, value: (row) => row.product_code },
    { label: "Tên hàng", width: 46, value: (row) => row.product_name },
    { label: "ĐVT", width: 10, value: (row) => row.unit },
    { label: "Mã kho", width: 22, value: (row) => row.warehouse_code },
    { label: "Tên kho", width: 28, value: (row) => row.warehouse_name },
    { label: "Đơn giá", width: 16, type: "number", numberFormat: "money", value: (row) => row.avg_unit_cost },
    { label: "Đầu kỳ SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.opening_quantity },
    { label: "Đầu kỳ GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.opening_value },
    { label: "Nhập SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.inbound_quantity },
    { label: "Nhập GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.inbound_value },
    { label: "Xuất SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.outbound_quantity },
    { label: "Xuất GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.outbound_value },
    { label: "Tồn SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.closing_quantity },
    { label: "Tồn GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.closing_value },
]

const COSTING_GROUPED_EXPORT_COLUMNS: CostingExportColumn[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "quantity" },
    { label: "Mã hàng", width: 22 },
    { label: "Tên hàng", width: 46 },
    { label: "ĐVT", width: 10 },
    { label: "Mã kho", width: 22 },
    { label: "Tên kho", width: 28 },
    { label: "Đơn giá", width: 16, type: "number", numberFormat: "money" },
    { label: "Đầu kỳ SL", width: 14, type: "number", numberFormat: "quantity" },
    { label: "Đầu kỳ GT", width: 16, type: "number", numberFormat: "money" },
    { label: "Nhập SL", width: 14, type: "number", numberFormat: "quantity" },
    { label: "Nhập GT", width: 16, type: "number", numberFormat: "money" },
    { label: "Xuất SL", width: 14, type: "number", numberFormat: "quantity" },
    { label: "Xuất GT", width: 16, type: "number", numberFormat: "money" },
    { label: "Tồn SL", width: 14, type: "number", numberFormat: "quantity" },
    { label: "Tồn GT", width: 16, type: "number", numberFormat: "money" },
]

async function fetchAllPeriodCosts(periodId: number, keyword: string, productionOnly: boolean) {
    const rows: ProductPeriodCost[] = []
    let page = 1
    while (true) {
        const res = await listPeriodCosts(periodId, {
            page,
            size: COSTING_EXPORT_PAGE_SIZE,
            keyword: keyword || undefined,
            production_only: productionOnly,
        })
        rows.push(...(res.items || []))
        if (page >= (res.total_page || 1) || !res.items?.length) break
        page += 1
    }
    return rows
}

async function exportCostingResultsXlsx(period: CostPeriod, rows: ProductPeriodCost[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const sheet = workbook.addWorksheet("Tổng hợp tồn kho", {
        views: [{ state: "frozen", ySplit: 5 }],
    })
    const columns = COSTING_GROUPED_EXPORT_COLUMNS

    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.getCell(1, 1).value = "TỔNG HỢP TỒN KHO"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }

    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.getCell(2, 1).value = `Kỳ: ${period.name} | Thời gian: ${formatDate(period.from_date)} - ${formatDate(period.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }
    sheet.getCell(2, 1).alignment = { horizontal: "center" }

    sheet.addRow([])
    sheet.addRow([
        "STT", "Mã hàng", "Tên hàng", "ĐVT", "Mã kho", "Tên kho", "Đơn giá",
        "Đầu kỳ", "", "Nhập", "", "Xuất", "", "Tồn", "",
    ])
    sheet.addRow([
        "", "", "", "", "", "", "",
        "Số lượng", "Giá trị", "Số lượng", "Giá trị", "Số lượng", "Giá trị", "Số lượng", "Giá trị",
    ])
    applyCostingGroupedHeaderMerges(sheet)
    rows.forEach((row, index) => {
        const productRow = sheet.addRow(buildCostingProductExportRow(row, index))
        productRow.font = { bold: true, color: { argb: "FF0F172A" } }
        productRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } }
    })
    const totalRow = sheet.addRow(buildCostingTotalsExportRow(rows))
    totalRow.font = { bold: true, color: { argb: "FF0F172A" } }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }

    sheet.columns = columns.map((column) => ({ width: column.width ?? 16 }))

    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }

    for (const rowIndex of [4, 5]) {
        const header = sheet.getRow(rowIndex)
        header.height = 24
        for (let columnIndex = 1; columnIndex <= columns.length; columnIndex++) {
            const cell = header.getCell(columnIndex)
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            cell.border = border
        }
    }

    for (let rowIndex = 6; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.height = 22
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: false,
            }
            if (column.type === "number") cell.numFmt = getCostingExcelNumberFormat(cell.value, column)
        })
    }

    applyCostingAutoColumnWidths(sheet, columns, 6)

    const buffer = await workbook.xlsx.writeBuffer()
    downloadCostingBlob(buffer, `tong-hop-ton-kho-${period.from_date}-${period.to_date}.xlsx`)
}

function applyCostingGroupedHeaderMerges(sheet: any) {
    ;[1, 2, 3, 4, 5, 6, 7].forEach((column) => {
        sheet.mergeCells(4, column, 5, column)
    })
    sheet.mergeCells(4, 8, 4, 9)
    sheet.mergeCells(4, 10, 4, 11)
    sheet.mergeCells(4, 12, 4, 13)
    sheet.mergeCells(4, 14, 4, 15)
}

function buildCostingProductExportRow(row: ProductPeriodCost, index: number) {
    return [
        index + 1,
        row.product_code || "",
        row.product_name || "",
        row.unit || "",
        row.warehouse_code || "",
        row.warehouse_name || "",
        row.avg_unit_cost || 0,
        row.opening_quantity || 0,
        row.opening_value || 0,
        row.inbound_quantity || 0,
        row.inbound_value || 0,
        row.outbound_quantity || 0,
        row.outbound_value || 0,
        row.closing_quantity || 0,
        row.closing_value || 0,
    ]
}

function buildCostingTotalsExportRow(rows: ProductPeriodCost[]) {
    const total = rows.reduce((sum, row) => ({
        openingQuantity: sum.openingQuantity + Number(row.opening_quantity || 0),
        openingValue: sum.openingValue + Number(row.opening_value || 0),
        inboundQuantity: sum.inboundQuantity + Number(row.inbound_quantity || 0),
        inboundValue: sum.inboundValue + Number(row.inbound_value || 0),
        outboundQuantity: sum.outboundQuantity + Number(row.outbound_quantity || 0),
        outboundValue: sum.outboundValue + Number(row.outbound_value || 0),
        closingQuantity: sum.closingQuantity + Number(row.closing_quantity || 0),
        closingValue: sum.closingValue + Number(row.closing_value || 0),
    }), {
        openingQuantity: 0,
        openingValue: 0,
        inboundQuantity: 0,
        inboundValue: 0,
        outboundQuantity: 0,
        outboundValue: 0,
        closingQuantity: 0,
        closingValue: 0,
    })
    return [
        "",
        "",
        "Tổng",
        "",
        "",
        "",
        "",
        total.openingQuantity,
        total.openingValue,
        total.inboundQuantity,
        total.inboundValue,
        total.outboundQuantity,
        total.outboundValue,
        total.closingQuantity,
        total.closingValue,
    ]
}

async function exportFinishedProductCostsXlsx(period: CostPeriod, rows: FinishedProductCostExportRow[]) {
    const { Workbook } = await import("exceljs")
    const workbook = new Workbook()
    workbook.creator = "VLIFE"
    workbook.created = new Date()

    const columns: CostingExportColumn[] = [
        { label: "Mã thành phẩm", width: 24, value: (row: any) => row.product_code },
        { label: "Tên thành phẩm", width: 42, value: (row: any) => row.product_name },
        { label: "Mã đối tượng THCP", width: 24, value: (row: any) => row.cost_object_code },
        { label: "Tên đối tượng THCP", width: 42, value: (row: any) => row.cost_object_name },
        { label: "NVL trực tiếp", width: 20, type: "number", numberFormat: "money", value: (row: any) => row.direct_material_value },
        { label: "Số lượng thành phẩm", width: 20, type: "number", numberFormat: "quantity", value: (row: any) => row.finished_quantity },
        { label: "Giá thành đơn vị", width: 20, type: "number", numberFormat: "money", value: (row: any) => row.unit_cost },
    ]
    const sheet = workbook.addWorksheet("Thành phẩm", {
        views: [{ state: "frozen", ySplit: 4 }],
    })

    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.getCell(1, 1).value = "DANH SÁCH THÀNH PHẨM TÍNH GIÁ"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }

    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.getCell(2, 1).value = `Kỳ: ${period.name} | Thời gian: ${formatDate(period.from_date)} - ${formatDate(period.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }
    sheet.getCell(2, 1).alignment = { horizontal: "center" }

    sheet.addRow([])
    sheet.addRow(columns.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(columns.map((column) => normalizeCostingExportCell(column.value?.(row as any, index), column)))
    })
    sheet.columns = columns.map((column) => ({ width: column.width ?? 16 }))
    sheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4, column: columns.length },
    }

    const border = {
        top: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        left: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
        right: { style: "thin" as const, color: { argb: "FFE2E8F0" } },
    }
    for (const headerRowIndex of [4]) {
        const header = sheet.getRow(headerRowIndex)
        header.height = 24
        header.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
            cell.border = border
        })
    }
    for (let rowIndex = 5; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.height = 22
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const column = columns[colNumber - 1]
            cell.border = border
            cell.alignment = {
                vertical: "middle",
                horizontal: column.type === "number" ? "right" : "left",
                wrapText: false,
            }
            if (column.type === "number") cell.numFmt = getCostingExcelNumberFormat(cell.value, column)
        })
    }
    applyCostingAutoColumnWidths(sheet, columns, 6)

    const buffer = await workbook.xlsx.writeBuffer()
    downloadCostingBlob(buffer, `thanh-pham-tinh-gia-${period.from_date}-${period.to_date}.xlsx`)
}

function normalizeCostingExportCell(value: string | number | null | undefined, column: CostingExportColumn) {
    if (value == null || value === "") return ""
    if (column.type === "number") {
        const numberValue = Number(value)
        return Number.isFinite(numberValue) ? numberValue : ""
    }
    return value
}

function getCostingExcelNumberFormat(value: unknown, column: CostingExportColumn) {
    const numberValue = Number(value)
    if (Number.isFinite(numberValue) && Number.isInteger(numberValue)) return "#,##0"
    return "#,##0.###"
}

function applyCostingAutoColumnWidths(sheet: any, columns: CostingExportColumn[], firstDataRow: number) {
    sheet.columns.forEach((column: any, index: number) => {
        const config = columns[index]
        let maxLength = config?.label?.length || 8
        for (let rowIndex = firstDataRow; rowIndex <= sheet.rowCount; rowIndex++) {
            const cell = sheet.getRow(rowIndex).getCell(index + 1)
            const text = cell.value == null ? "" : String(cell.value)
            maxLength = Math.max(maxLength, text.length)
        }
        const maxWidth = config?.width ?? 16
        const minWidth = config?.type === "number" ? 10 : Math.min(maxWidth, 8)
        column.width = Math.min(Math.max(maxLength + 2, minWidth), maxWidth)
    })
}

function downloadCostingBlob(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}
