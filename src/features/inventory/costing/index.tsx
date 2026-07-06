import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Calculator, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, Download, Play, Plus, Search, Upload } from "lucide-react"
import { toast } from "sonner"

import {
    calculateCostPeriod,
    createCostPeriod,
    createLandedCost,
    deleteLandedCost,
    importLandedCosts,
    listCostPeriods,
    listLandedCosts,
    listLotCostAllocations,
    listPeriodCosts,
    listProductionCostResults,
    type CostPeriod,
    type CostingImportResult,
    type LandedCost,
    type LotCostAllocation,
    type ProductPeriodCost,
    type ProductionCostResult,
} from "@/api/inventory/costing"
import { Main } from "@/components/layout/main"
import { CardPagination } from "@/components/table/card-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatCurrency, formatNumber } from "@/lib/utils"

function todayYmd() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function firstDayOfMonth() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
}

const LANDED_COST_IMPORT_COLUMNS = [
    "Ngày hạch toán",
    "Số chứng từ",
    "Diễn giải chung",
    "Tên nhà cung cấp",
    "Mã hàng",
    "Số lô",
    "Giá trị mua",
]

const COSTING_PAGE_SIZE = 50
const COSTING_EXPORT_PAGE_SIZE = 1000
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
    const [selectedPeriodId, setSelectedPeriodId] = useState<number>()
    const [costKeyword, setCostKeyword] = useState("")
    const [landedKeyword, setLandedKeyword] = useState("")
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

    return (
        <Main className="flex w-full min-w-0 flex-col gap-2">
            <Tabs defaultValue="periods" className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Tính giá tồn kho</h2>
                        <TabsList>
                            <TabsTrigger value="periods">Kỳ tính giá</TabsTrigger>
                            <TabsTrigger value="landed-costs">Phí lô hàng</TabsTrigger>
                        </TabsList>
                    </div>
                    <CreatePeriodDialog />
                </div>

                <TabsContent value="periods" className="mt-0 space-y-2">
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
                                                        <button
                                                            key={period.id}
                                                            className={cn(
                                                                "w-full rounded-md bg-white px-2.5 py-1.5 text-left shadow-sm transition hover:bg-teal-50",
                                                                selectedPeriod?.id === period.id && "bg-teal-50 ring-1 ring-teal-300",
                                                            )}
                                                            onClick={() => setSelectedPeriodId(period.id)}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="truncate font-semibold">{period.name}</div>
                                                                    <div className="text-muted-foreground text-xs">
                                                                        {formatDate(period.from_date)} - {formatDate(period.to_date)}
                                                                    </div>
                                                                </div>
                                                                <StatusBadge status={period.status} />
                                                            </div>
                                                        </button>
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
                </TabsContent>

                <TabsContent value="landed-costs" className="mt-0">
                    <LandedCostsPanel keyword={landedKeyword} onKeywordChange={setLandedKeyword} />
                </TabsContent>
            </Tabs>
        </Main>
    )
}

function PeriodDetail({ period, keyword, onKeywordChange }: {
    period: CostPeriod
    keyword: string
    onKeywordChange: (value: string) => void
}) {
    const queryClient = useQueryClient()
    const [pageIndex, setPageIndex] = useState(0)
    const [expandedProductId, setExpandedProductId] = useState<number | null>(null)

    useEffect(() => {
        setPageIndex(0)
        setExpandedProductId(null)
    }, [period.id, keyword])

    const costsQuery = useQuery({
        queryKey: ["inventory-cost-period-costs", period.id, keyword, pageIndex],
        queryFn: () => listPeriodCosts(period.id, { page: pageIndex + 1, size: COSTING_PAGE_SIZE, keyword }),
    })

    const lotAllocationsQuery = useQuery({
        queryKey: ["inventory-cost-lot-allocations", period.id, expandedProductId],
        enabled: expandedProductId !== null,
        queryFn: () => listLotCostAllocations(period.id, expandedProductId!),
    })

    const productionCostsQuery = useQuery({
        queryKey: ["inventory-production-cost-results", period.id, expandedProductId],
        enabled: expandedProductId !== null,
        queryFn: () => listProductionCostResults(period.id, expandedProductId!),
    })

    const calculateMutation = useMutation({
        mutationFn: () => calculateCostPeriod(period.id),
        onSuccess: (result) => {
            toast.success(`Đã tính giá: ${result.product_rows} sản phẩm, ${result.lot_allocations} phân bổ phí lô`)
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-periods"] })
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-period-costs", period.id] })
            queryClient.invalidateQueries({ queryKey: ["inventory-cost-lot-allocations", period.id] })
            queryClient.invalidateQueries({ queryKey: ["inventory-production-cost-results", period.id] })
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không tính được giá"),
    })

    const exportMutation = useMutation({
        mutationFn: async () => {
            const rows = await fetchAllPeriodCosts(period.id, keyword)
            await exportCostingResultsXlsx(period, rows)
            return rows.length
        },
        onSuccess: (count) => toast.success(`Đã xuất ${formatNumber(count)} dòng kết quả tính giá`),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không xuất được file Excel"),
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
                            <Play className="mr-2 h-4 w-4" />
                            Tính giá
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-2 md:grid-cols-4">
                <MetricCard title="Tồn đầu kỳ" quantity={totals.opening_quantity} value={totals.opening_value} />
                <MetricCard title="Nhập trong kỳ" quantity={totals.inbound_quantity} value={totals.inbound_value} />
                <MetricCard title="Xuất trong kỳ" quantity={totals.outbound_quantity} value={totals.outbound_value} />
                <MetricCard title="Tồn cuối kỳ" quantity={totals.closing_quantity} value={totals.closing_value} />
            </div>

            <Card className="gap-2 overflow-hidden py-2">
                <CardHeader className="border-b px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold">Kết quả tính giá</div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
                    <div className="overflow-auto">
                        <table className="min-w-[1400px] w-full border-collapse text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <Th>STT</Th>
                                    <Th>Mã hàng</Th>
                                    <Th>Tên hàng</Th>
                                    <Th>ĐVT</Th>
                                    <Th>Tồn đầu SL</Th>
                                    <Th>Tồn đầu GT</Th>
                                    <Th>Nhập SL</Th>
                                    <Th>Nhập GT</Th>
                                    <Th>Phí lô</Th>
                                    <Th>Nhập TP GT</Th>
                                    <Th>Giá BQ</Th>
                                    <Th>Xuất SL</Th>
                                    <Th>Xuất GT</Th>
                                    <Th>Tồn cuối SL</Th>
                                    <Th>Tồn cuối GT</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {(costsQuery.data?.items || []).map((row, index) => {
                                    const expanded = expandedProductId === row.product_id
                                    return (
                                        <Fragment key={row.id}>
                                            <tr
                                                className="cursor-pointer border-t hover:bg-slate-50"
                                                onClick={() => setExpandedProductId(expanded ? null : row.product_id)}
                                            >
                                                <Td center>{pageIndex * COSTING_PAGE_SIZE + index + 1}</Td>
                                                <Td center>{row.product_code}</Td>
                                                <Td className="min-w-72 font-medium">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>{row.product_name}</span>
                                                        {expanded ? (
                                                            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </Td>
                                                <Td center>{row.unit || "-"}</Td>
                                                <Td number>{formatNumber(row.opening_quantity)}</Td>
                                                <Td number>{formatCurrency(row.opening_value)}</Td>
                                                <Td number>{formatNumber(row.inbound_quantity)}</Td>
                                                <Td number>{formatCurrency(row.inbound_value)}</Td>
                                                <Td number>{formatCurrency(row.landed_cost_value)}</Td>
                                                <Td number>{formatCurrency(row.production_inbound_value)}</Td>
                                                <Td number>{formatCurrency(row.avg_unit_cost)}</Td>
                                                <Td number>{formatNumber(row.outbound_quantity)}</Td>
                                                <Td number>{formatCurrency(row.outbound_value)}</Td>
                                                <Td number>{formatNumber(row.closing_quantity)}</Td>
                                                <Td number>{formatCurrency(row.closing_value)}</Td>
                                            </tr>
                                            {expanded && (
                                                <tr className="border-t bg-slate-50/70">
                                                    <td colSpan={15} className="px-4 py-3">
                                                        <CostBreakdownPanel
                                                            lotRows={lotAllocationsQuery.data || []}
                                                            productionRows={productionCostsQuery.data || []}
                                                            isLotLoading={lotAllocationsQuery.isLoading}
                                                            isProductionLoading={productionCostsQuery.isLoading}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                                {!costsQuery.data?.items?.length && (
                                    <tr>
                                        <td colSpan={15} className="p-6 text-center text-sm text-muted-foreground">
                                            Chưa có kết quả. Bấm Tính giá để sinh dữ liệu kỳ.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <CardPagination
                        className="border-t py-3"
                        pageIndex={pageIndex}
                        pageCount={costsQuery.data?.total_page || 1}
                        onPageChange={setPageIndex}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

function CostBreakdownPanel({
    lotRows,
    productionRows,
    isLotLoading,
    isProductionLoading,
}: {
    lotRows: LotCostAllocation[]
    productionRows: ProductionCostResult[]
    isLotLoading: boolean
    isProductionLoading: boolean
}) {
    return (
        <div className="space-y-3">
            <LotAllocationsPanel rows={lotRows} isLoading={isLotLoading} />
            <ProductionCostsPanel rows={productionRows} isLoading={isProductionLoading} />
        </div>
    )
}

function LotAllocationsPanel({ rows, isLoading }: { rows: LotCostAllocation[]; isLoading: boolean }) {
    if (isLoading) {
        return <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">Đang tải phân bổ lô...</div>
    }

    return (
        <div className="rounded-md border bg-background">
            <div className="border-b px-3 py-2 text-sm font-semibold">Chi tiết phân bổ theo lô</div>
            <div className="overflow-auto">
                <table className="min-w-[1200px] w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <Th>STT</Th>
                            <Th>Số lô</Th>
                            <Th>Kho</Th>
                            <Th>Ngày nhập</Th>
                            <Th>HSD</Th>
                            <Th>SL phân bổ</Th>
                            <Th>Giá mua</Th>
                            <Th>Phí lô</Th>
                            <Th>Phí/ĐV</Th>
                            <Th>Giá sau phí</Th>
                            <Th>Thành tiền sau phí</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id} className="border-t">
                                <Td center>{index + 1}</Td>
                                <Td center className="font-mono">{row.lot_no || "-"}</Td>
                                <Td className="min-w-52">
                                    <div className="font-medium">{row.warehouse_name || "-"}</div>
                                    <div className="text-xs text-muted-foreground">{row.warehouse_code || ""}</div>
                                </Td>
                                <Td center>{formatDate(row.inbound_date)}</Td>
                                <Td center>{formatDate(row.expiry_date)}</Td>
                                <Td number>{formatNumber(row.quantity_basis)}</Td>
                                <Td number>{formatCurrency(row.purchase_amount)}</Td>
                                <Td number>{formatCurrency(row.landed_cost_amount)}</Td>
                                <Td number>{formatCurrency(row.landed_unit_cost)}</Td>
                                <Td number>{formatCurrency(row.final_unit_cost)}</Td>
                                <Td number>{formatCurrency(row.final_amount)}</Td>
                            </tr>
                        ))}
                        {!rows.length && (
                            <tr>
                                <td colSpan={11} className="p-4 text-center text-sm text-muted-foreground">
                                    Chưa có phân bổ phí lô cho sản phẩm này trong kỳ.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function ProductionCostsPanel({ rows, isLoading }: { rows: ProductionCostResult[]; isLoading: boolean }) {
    if (isLoading) {
        return <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">Đang tải giá thành sản xuất...</div>
    }

    return (
        <div className="rounded-md border bg-background">
            <div className="border-b px-3 py-2 text-sm font-semibold">Chi tiết giá thành sản xuất</div>
            <div className="overflow-auto">
                <table className="min-w-[1150px] w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-slate-600">
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
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id} className="border-t">
                                <Td center>{index + 1}</Td>
                                <Td center className="font-medium">{row.production_no || "-"}</Td>
                                <Td center>{formatDate(row.production_date)}</Td>
                                <Td center className="font-mono">{row.output_lot_no || "-"}</Td>
                                <Td className="min-w-52">
                                    <div className="font-medium">{row.warehouse_name || "-"}</div>
                                    <div className="text-xs text-muted-foreground">{row.warehouse_code || ""}</div>
                                </Td>
                                <Td number>{formatNumber(row.output_quantity)}</Td>
                                <Td number>{formatCurrency(row.material_cost)}</Td>
                                <Td number>{formatCurrency(row.unit_cost)}</Td>
                                <Td number>{formatCurrency(row.total_cost)}</Td>
                            </tr>
                        ))}
                        {!rows.length && (
                            <tr>
                                <td colSpan={9} className="p-4 text-center text-sm text-muted-foreground">
                                    Chưa có dữ liệu nhập thành phẩm sản xuất cho sản phẩm này trong kỳ.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function LandedCostsPanel({ keyword, onKeywordChange }: {
    keyword: string
    onKeywordChange: (value: string) => void
}) {
    const queryClient = useQueryClient()
    const importInputRef = useRef<HTMLInputElement>(null)
    const [importResult, setImportResult] = useState<CostingImportResult | null>(null)
    const [importGuideOpen, setImportGuideOpen] = useState(false)
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [pageIndex, setPageIndex] = useState(0)

    useEffect(() => {
        setPageIndex(0)
    }, [keyword, fromDate, toDate])

    const query = useQuery({
        queryKey: ["inventory-landed-costs", keyword, fromDate, toDate, pageIndex],
        queryFn: () => listLandedCosts({
            page: pageIndex + 1,
            size: COSTING_PAGE_SIZE,
            keyword,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
        }),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteLandedCost,
        onSuccess: () => {
            toast.success("Đã xóa phí lô")
            queryClient.invalidateQueries({ queryKey: ["inventory-landed-costs"] })
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không xóa được phí lô"),
    })

    const importMutation = useMutation({
        mutationFn: importLandedCosts,
        onSuccess: async (res) => {
            await queryClient.invalidateQueries({ queryKey: ["inventory-landed-costs"] })
            if (res.failed > 0) {
                setImportResult(res)
                toast.warning(`Import phí lô xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }
            setImportResult(null)
            toast.success(`Đã import ${res.success} dòng phí lô`)
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không import được phí lô"),
    })

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return
        setImportResult(null)
        importMutation.mutate(file)
    }

    const copyImportErrors = async () => {
        if (!importResult?.errors?.length) return
        await navigator.clipboard.writeText(
            importResult.errors.map((error) => `Dòng ${error.row}: ${error.message}`).join("\n"),
        )
        toast.success("Đã copy danh sách lỗi")
    }

    const chooseImportFile = () => {
        setImportGuideOpen(false)
        window.setTimeout(() => importInputRef.current?.click(), 0)
    }

    return (
        <>
        <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={handleImportFile}
        />
        <Card className="gap-2 overflow-hidden py-2">
            <CardHeader className="border-b px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="font-semibold">Phí lô hàng</div>
                        <div className="text-muted-foreground text-sm">
                            Lưu phí theo mã lô, khi tính kỳ hệ thống phân bổ theo số lượng của lô.
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <div className="relative w-72">
                            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                            <Input
                                className="pl-9"
                                value={keyword}
                                placeholder="Tìm mã lô, chứng từ"
                                onChange={(event) => onKeywordChange(event.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="whitespace-nowrap text-sm text-muted-foreground">Từ ngày</span>
                            <Input
                                type="date"
                                className="w-36"
                                value={fromDate}
                                max={toDate || undefined}
                                onChange={(event) => setFromDate(event.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="whitespace-nowrap text-sm text-muted-foreground">Đến ngày</span>
                            <Input
                                type="date"
                                className="w-36"
                                value={toDate}
                                min={fromDate || undefined}
                                onChange={(event) => setToDate(event.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            disabled={importMutation.isPending}
                            onClick={() => setImportGuideOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {importMutation.isPending ? "Đang import..." : "Import phí"}
                        </Button>
                        <CreateLandedCostDialog />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-auto">
                    <table className="min-w-[1000px] w-full border-collapse text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <Th>STT</Th>
                                <Th>Ngày CT</Th>
                                <Th>Số CT</Th>
                                <Th>Mã lô</Th>
                                <Th>Loại phí</Th>
                                <Th>Số tiền</Th>
                                <Th>Nhà cung cấp</Th>
                                <Th>Diễn giải</Th>
                                <Th>Thao tác</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {(query.data?.items || []).map((row: LandedCost, index) => (
                                <tr key={row.id} className="border-t">
                                    <Td center>{pageIndex * COSTING_PAGE_SIZE + index + 1}</Td>
                                    <Td center>{formatDate(row.doc_date)}</Td>
                                    <Td center>{row.doc_no || "-"}</Td>
                                    <Td center className="font-mono">{row.lot_no}</Td>
                                    <Td>{row.cost_type || "-"}</Td>
                                    <Td number>{formatCurrency(row.amount)}</Td>
                                    <Td>{row.supplier_name || "-"}</Td>
                                    <Td>{row.description || "-"}</Td>
                                    <Td center>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(row.id)}
                                        >
                                            Xóa
                                        </Button>
                                    </Td>
                                </tr>
                            ))}
                            {!query.data?.items?.length && (
                                <tr>
                                    <td colSpan={9} className="p-6 text-center text-sm text-muted-foreground">
                                        Chưa có phí lô hàng.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="border-t bg-slate-50 font-semibold">
                                <td colSpan={5} className="px-3 py-2 text-right">Tổng</td>
                                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(query.data?.totals?.amount)}</td>
                                <td colSpan={3} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <CardPagination
                    className="border-t py-3"
                    pageIndex={pageIndex}
                    pageCount={query.data?.total_page || 1}
                    onPageChange={setPageIndex}
                />
            </CardContent>
        </Card>
        <Dialog open={importGuideOpen} onOpenChange={setImportGuideOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import phí lô hàng</DialogTitle>
                    <DialogDescription>
                        File import phí lô hàng cần có các cột sau. Có thể copy chính xác tiêu đề cột từ danh sách này.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="rounded-md border bg-muted/30 p-3">
                        <div className="mb-2 text-sm font-medium">Tiêu đề cột cần có</div>
                        <pre className="max-h-[320px] select-text overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-sm leading-6 text-foreground">
                            {LANDED_COST_IMPORT_COLUMNS.join("\n")}
                        </pre>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Ngày hạch toán bắt buộc nhập theo định dạng dd/MM/yyyy hoặc dd-MM-yyyy, ví dụ 24/10/2028 hoặc 24-10-2028.</p>
                        <p>Cột Mã hàng trong file phần mềm cũ được hiểu là Loại chi phí, không phải mã sản phẩm.</p>
                        <p>Các cột bắt buộc để import là Ngày hạch toán, Số chứng từ, Diễn giải chung, Tên nhà cung cấp, Mã hàng, Số lô và Giá trị mua.</p>
                        <p>Phí được lưu riêng theo mã lô, không làm thay đổi số lượng tồn kho. Khi tính kỳ, hệ thống mới phân bổ phí vào giá trị.</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setImportGuideOpen(false)}>Đóng</Button>
                    <Button onClick={chooseImportFile}>
                        <Upload className="mr-2 h-4 w-4" />
                        Chọn file import
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={!!importResult} onOpenChange={(open) => !open && setImportResult(null)}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Lỗi import phí lô hàng</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground">
                    Đã import {importResult?.success ?? 0} dòng, lỗi {importResult?.failed ?? 0} dòng.
                </div>
                <div className="max-h-[520px] overflow-auto rounded-md border">
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 bg-muted text-muted-foreground">
                            <tr>
                                <th className="w-24 border-b px-3 py-2 text-left font-medium">Dòng</th>
                                <th className="border-b px-3 py-2 text-left font-medium">Lý do lỗi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(importResult?.errors || []).map((error, index) => (
                                <tr key={`${error.row}-${index}`} className="border-b last:border-b-0">
                                    <td className="px-3 py-2 align-top font-medium">{error.row}</td>
                                    <td className="px-3 py-2 align-top text-muted-foreground">{error.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setImportResult(null)}>Đóng</Button>
                    <Button variant="outline" onClick={copyImportErrors}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy lỗi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
        </>
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

function CreateLandedCostDialog() {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({
        doc_no: "",
        doc_date: todayYmd(),
        lot_no: "",
        cost_type: "",
        amount: "",
        supplier_name: "",
        description: "",
    })
    const mutation = useMutation({
        mutationFn: () => createLandedCost({ ...form, amount: Number(form.amount || 0) }),
        onSuccess: () => {
            toast.success("Đã lưu phí lô")
            setOpen(false)
            setForm({ doc_no: "", doc_date: todayYmd(), lot_no: "", cost_type: "", amount: "", supplier_name: "", description: "" })
            queryClient.invalidateQueries({ queryKey: ["inventory-landed-costs"] })
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Không lưu được phí lô"),
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm phí
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Thêm phí lô hàng</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Ngày chứng từ">
                        <Input type="date" value={form.doc_date} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} />
                    </Field>
                    <Field label="Số chứng từ">
                        <Input value={form.doc_no} onChange={(e) => setForm({ ...form, doc_no: e.target.value })} />
                    </Field>
                    <Field label="Mã lô">
                        <Input value={form.lot_no} onChange={(e) => setForm({ ...form, lot_no: e.target.value })} />
                    </Field>
                    <Field label="Loại phí">
                        <Input value={form.cost_type} onChange={(e) => setForm({ ...form, cost_type: e.target.value })} />
                    </Field>
                    <Field label="Số tiền">
                        <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                    </Field>
                    <Field label="Tên nhà cung cấp">
                        <Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
                    </Field>
                    <div className="md:col-span-3">
                        <Field label="Diễn giải">
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </Field>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>Lưu phí</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function MetricCard({ title, quantity, value }: { title: string; quantity?: number; value?: number }) {
    return (
        <Card className="bg-slate-100 py-2">
            <CardContent className="px-3 py-2">
                <div className="text-center text-sm font-semibold uppercase text-slate-600">{title}</div>
                <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm">
                    <span className="text-muted-foreground">Số lượng</span>
                    <span className="text-right font-semibold">{formatNumber(quantity)}</span>
                    <span className="text-muted-foreground">Giá trị</span>
                    <span className="text-right font-semibold">{formatCurrency(value)}</span>
                </div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status?: string }) {
    const label = status === "LOCKED" ? "Đã khóa" : status === "CALCULATED" ? "Đã tính" : "Nháp"
    return (
        <span
            className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                status === "LOCKED" && "bg-slate-900 text-white",
                status === "CALCULATED" && "bg-teal-100 text-teal-700",
                status !== "LOCKED" && status !== "CALCULATED" && "bg-slate-100 text-slate-600",
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

function Th({ children }: { children: React.ReactNode }) {
    return <th className="border-b px-3 py-1.5 text-center text-xs font-semibold uppercase">{children}</th>
}

function Td({
    children,
    center,
    number,
    className,
}: {
    children: React.ReactNode
    center?: boolean
    number?: boolean
    className?: string
}) {
    return (
        <td className={cn("px-3 py-1.5 align-middle", center && "text-center", number && "text-right tabular-nums", className)}>
            {children}
        </td>
    )
}

function formatDate(value?: string) {
    if (!value) return "-"
    const [year, month, day] = value.slice(0, 10).split("-")
    return `${day}/${month}/${year}`
}

type CostingExportColumn = {
    label: string
    width?: number
    type?: "number" | "text"
    numberFormat?: "quantity" | "money"
    value: (row: ProductPeriodCost, index: number) => string | number | null | undefined
}

const COSTING_EXPORT_COLUMNS: CostingExportColumn[] = [
    { label: "STT", width: 8, type: "number", numberFormat: "quantity", value: (_row, index) => index + 1 },
    { label: "Mã hàng", width: 22, value: (row) => row.product_code },
    { label: "Tên hàng", width: 46, value: (row) => row.product_name },
    { label: "ĐVT", width: 10, value: (row) => row.unit },
    { label: "Tồn đầu SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.opening_quantity },
    { label: "Tồn đầu GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.opening_value },
    { label: "Nhập SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.inbound_quantity },
    { label: "Nhập GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.inbound_value },
    { label: "Phí lô", width: 16, type: "number", numberFormat: "money", value: (row) => row.landed_cost_value },
    { label: "Nhập TP GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.production_inbound_value },
    { label: "Giá BQ", width: 16, type: "number", numberFormat: "money", value: (row) => row.avg_unit_cost },
    { label: "Xuất SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.outbound_quantity },
    { label: "Xuất GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.outbound_value },
    { label: "Tồn cuối SL", width: 14, type: "number", numberFormat: "quantity", value: (row) => row.closing_quantity },
    { label: "Tồn cuối GT", width: 16, type: "number", numberFormat: "money", value: (row) => row.closing_value },
]

async function fetchAllPeriodCosts(periodId: number, keyword: string) {
    const rows: ProductPeriodCost[] = []
    let page = 1
    while (true) {
        const res = await listPeriodCosts(periodId, {
            page,
            size: COSTING_EXPORT_PAGE_SIZE,
            keyword: keyword || undefined,
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

    const sheet = workbook.addWorksheet("Kết quả tính giá", {
        views: [{ state: "frozen", ySplit: 4 }],
    })
    const columns = COSTING_EXPORT_COLUMNS

    sheet.mergeCells(1, 1, 1, columns.length)
    sheet.getCell(1, 1).value = "KẾT QUẢ TÍNH GIÁ"
    sheet.getCell(1, 1).font = { bold: true, size: 16 }
    sheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" }

    sheet.mergeCells(2, 1, 2, columns.length)
    sheet.getCell(2, 1).value = `Kỳ: ${period.name} | Thời gian: ${formatDate(period.from_date)} - ${formatDate(period.to_date)} | Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`
    sheet.getCell(2, 1).font = { italic: true, color: { argb: "FF64748B" } }
    sheet.getCell(2, 1).alignment = { horizontal: "center" }

    sheet.addRow([])
    sheet.addRow(columns.map((column) => column.label))
    rows.forEach((row, index) => {
        sheet.addRow(columns.map((column) => normalizeCostingExportCell(column.value(row, index), column)))
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

    const header = sheet.getRow(4)
    header.height = 26
    header.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } }
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
        cell.border = border
    })

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

    applyCostingAutoColumnWidths(sheet, columns, 5)

    const buffer = await workbook.xlsx.writeBuffer()
    downloadCostingBlob(buffer, `ket-qua-tinh-gia-${period.from_date}-${period.to_date}.xlsx`)
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
    if (column.numberFormat === "money") return "#,##0"
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
