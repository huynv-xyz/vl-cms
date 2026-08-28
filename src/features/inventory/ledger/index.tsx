import type React from "react"
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarClock, CheckCircle2, ChevronDown, Loader2, Package, PackageOpen, RefreshCw, Scale, Search, TrendingDown, TrendingUp, Warehouse, type LucideIcon } from "lucide-react"

import { getMyPermissions } from "@/api/auth/permission"
import { checkCostingLedgerReconciliation, checkNegativeStock, getLatestNegativeStockScheduledCheck, listInventoryLedgerReport, runNegativeStockScheduledCheckNow, type CostingLedgerReconciliationResult, type NegativeStockAuditResult, type SystemJobRun } from "@/api/inventory/ledger"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { cn } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/inventory/ledgers"
import { InventoryLedgerTable } from "./components/ledger-table"
import { ExportInventoryLedgerButton } from "./components/export-inventory-ledger-button"
import { LedgerImportButtons } from "./components/ledger-import-buttons"
import { LedgerVoucherDialog } from "./components/ledger-voucher-dialog"
import { LegacyConversionLotMergeTool } from "./components/legacy-conversion-lot-merge-tool"
import { ProductionDateSyncTool } from "./components/production-date-sync-tool"
import type { InventoryLedgerTotals } from "./data/schema"

type InventoryLedgerPageMode = "all" | "in" | "out"

export default function InventoryLedgerPage() {
    return <InventoryLedgerReportPage route={Route} mode="all" />
}

export function InventoryLedgerReportPage({
    route,
    mode,
}: {
    route: any
    mode: InventoryLedgerPageMode
}) {
    const search = route.useSearch()
    const navigate = route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const [voucherDialog, setVoucherDialog] = useState<"in" | "out" | "transfer" | "repack" | "conversion" | "negative-stock" | "costing-reconciliation" | "production-date-sync" | null>(null)
    const direction = mode === "in" ? "IN" : mode === "out" ? "OUT" : undefined
    const showValues = mode === "all"
    const pageTitle = mode === "in" ? "Nhập kho" : mode === "out" ? "Xuất kho" : "Sổ chi tiết vật tư hàng hóa"

    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ["product_ids"],
        [
            "warehouse_id",
            "warehouse_ids",
            "doc_type",
            "from_date",
            "to_date",
            "doc_text",
            "doc_text_op",
            "description_text",
            "description_text_op",
            "supplier_text",
            "supplier_text_op",
            "product_text",
            "product_text_op",
            "product_code_text",
            "product_code_text_op",
            "product_name_text",
            "product_name_text_op",
            "warehouse_code_text",
            "warehouse_code_text_op",
            "warehouse_name_text",
            "warehouse_name_text_op",
            "unit",
            "lot_text",
            "lot_text_op",
            "time_sort",
        ],
    )
    const timeSort = singleFilters.time_sort === "desc" ? "desc" : "asc"
    const { data: permissions = [] } = useQuery({
        queryKey: ["my-permissions"],
        queryFn: getMyPermissions,
    })
    const canCreateInventoryVoucher = hasPermission(permissions, "inventory.vouchers", "create")
    const [negativeStockInitialResult, setNegativeStockInitialResult] = useState<NegativeStockAuditResult | null>(null)
    const { data: negativeStockJobRun, refetch: refetchNegativeStockJobRun } = useQuery({
        queryKey: ["inventory-negative-stock-scheduled-latest"],
        queryFn: getLatestNegativeStockScheduledCheck,
        enabled: mode === "all",
        refetchInterval: 5 * 60 * 1000,
    })
    const runNegativeStockJobMutation = useMutation({
        mutationFn: runNegativeStockScheduledCheckNow,
        onSuccess: (run) => {
            refetchNegativeStockJobRun()
            const payload = parseNegativeStockPayload(run)
            setNegativeStockInitialResult(payload)
            setVoucherDialog("negative-stock")
        },
    })

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-ledger-report",
            search.page,
            search.size,
            keyword,
            multiFilters.product_ids,
            singleFilters.warehouse_id,
            singleFilters.warehouse_ids,
            singleFilters.doc_type,
            singleFilters.from_date,
            singleFilters.to_date,
            singleFilters.doc_text,
            singleFilters.doc_text_op,
            singleFilters.description_text,
            singleFilters.description_text_op,
            singleFilters.supplier_text,
            singleFilters.supplier_text_op,
            singleFilters.product_text,
            singleFilters.product_text_op,
            singleFilters.product_code_text,
            singleFilters.product_code_text_op,
            singleFilters.product_name_text,
            singleFilters.product_name_text_op,
            singleFilters.warehouse_code_text,
            singleFilters.warehouse_code_text_op,
            singleFilters.warehouse_name_text,
            singleFilters.warehouse_name_text_op,
            singleFilters.unit,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
            timeSort,
            direction,
            showValues,
        ],
        listInventoryLedgerReport,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_ids: requestFilters.product_ids,
            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
            warehouse_ids: requestFilters.warehouse_ids,
            doc_type: requestFilters.doc_type,
            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
            doc_text: requestFilters.doc_text,
            doc_text_op: requestFilters.doc_text_op,
            description_text: requestFilters.description_text,
            description_text_op: requestFilters.description_text_op,
            supplier_text: requestFilters.supplier_text,
            supplier_text_op: requestFilters.supplier_text_op,
            product_text: requestFilters.product_text,
            product_text_op: requestFilters.product_text_op,
            product_code_text: requestFilters.product_code_text,
            product_code_text_op: requestFilters.product_code_text_op,
            product_name_text: requestFilters.product_name_text,
            product_name_text_op: requestFilters.product_name_text_op,
            warehouse_code_text: requestFilters.warehouse_code_text,
            warehouse_code_text_op: requestFilters.warehouse_code_text_op,
            warehouse_name_text: requestFilters.warehouse_name_text,
            warehouse_name_text_op: requestFilters.warehouse_name_text_op,
            unit: requestFilters.unit,
            lot_text: requestFilters.lot_text,
            lot_text_op: requestFilters.lot_text_op,
            time_sort: timeSort,
            direction,
            show_values: showValues,
        },
    )

    return (
        <PageSection
            title={pageTitle}
            isLoading={isLoading}
            error={error}
            data={data}
            actions={
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {mode === "all" ? <LedgerImportButtons /> : null}
                    {mode === "all" ? <LegacyConversionLotMergeTool /> : null}
                    <ExportInventoryLedgerButton
                        keyword={keyword}
                        showValues={showValues}
                        title={mode === "in" ? "NHẬP KHO" : mode === "out" ? "XUẤT KHO" : "SỔ CHI TIẾT VẬT TƯ HÀNG HÓA"}
                        filePrefix={mode === "in" ? "nhap-kho" : mode === "out" ? "xuat-kho" : "so-chi-tiet-vat-tu-hang-hoa"}
                        filters={{
                            product_ids: requestFilters.product_ids,
                            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
                            warehouse_ids: requestFilters.warehouse_ids,
                            doc_type: requestFilters.doc_type,
                            from_date: requestFilters.from_date,
                            to_date: requestFilters.to_date,
                            doc_text: requestFilters.doc_text,
                            doc_text_op: requestFilters.doc_text_op,
                            description_text: requestFilters.description_text,
                            description_text_op: requestFilters.description_text_op,
                            supplier_text: requestFilters.supplier_text,
                            supplier_text_op: requestFilters.supplier_text_op,
                            product_text: requestFilters.product_text,
                            product_text_op: requestFilters.product_text_op,
                            product_code_text: requestFilters.product_code_text,
                            product_code_text_op: requestFilters.product_code_text_op,
                            product_name_text: requestFilters.product_name_text,
                            product_name_text_op: requestFilters.product_name_text_op,
                            warehouse_code_text: requestFilters.warehouse_code_text,
                            warehouse_code_text_op: requestFilters.warehouse_code_text_op,
                            warehouse_name_text: requestFilters.warehouse_name_text,
                            warehouse_name_text_op: requestFilters.warehouse_name_text_op,
                            unit: requestFilters.unit,
                            lot_text: requestFilters.lot_text,
                            lot_text_op: requestFilters.lot_text_op,
                            time_sort: timeSort,
                            direction,
                            show_values: showValues,
                        }}
                    />
                    {canCreateInventoryVoucher ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <PackageOpen className="mr-2 h-4 w-4" />
                                    Giao dịch kho
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {mode !== "out" ? <DropdownMenuItem onSelect={() => setVoucherDialog("in")}><ArrowDownLeft className="text-emerald-600" />Nhập hàng</DropdownMenuItem> : null}
                                {mode !== "in" ? <DropdownMenuItem onSelect={() => setVoucherDialog("out")}><ArrowUpRight className="text-rose-600" />Xuất hàng</DropdownMenuItem> : null}
                                <DropdownMenuItem onSelect={() => setVoucherDialog("transfer")}><ArrowLeftRight className="text-blue-600" />Chuyển kho</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                    {mode === "all" ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                    <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                                    Tiện ích kho
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onSelect={() => {
                                    setNegativeStockInitialResult(null)
                                    setVoucherDialog("negative-stock")
                                }}><Search className="text-rose-600" />Kiểm tra âm tồn</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setVoucherDialog("costing-reconciliation")}><Scale className="text-emerald-600" />Đối soát sổ kho và tính giá</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setVoucherDialog("production-date-sync")}><CalendarClock className="text-blue-600" />Sửa đồng bộ ngày lệnh SX</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setVoucherDialog("repack")}><Package className="text-amber-600" />Sang bao</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setVoucherDialog("conversion")}><RefreshCw className="text-violet-600" />Chuyển mã</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                </div>
            }
        >
            {(data) => {
                const ledgerData = data as typeof data & { totals?: InventoryLedgerTotals }

                return (
                <div className="space-y-4">
                    {mode === "all" ? (
                        <NegativeStockScheduledBanner
                            run={negativeStockJobRun}
                            isRunning={runNegativeStockJobMutation.isPending}
                            onOpen={() => {
                                setNegativeStockInitialResult(parseNegativeStockPayload(negativeStockJobRun))
                                setVoucherDialog("negative-stock")
                            }}
                            onRun={() => runNegativeStockJobMutation.mutate()}
                        />
                    ) : null}

                    <InventoryLedgerSummary totals={ledgerData.totals} showValues={showValues} direction={direction} />

                    <InventoryLedgerTable
                        data={ledgerData.items || []}
                        totals={ledgerData.totals}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={ledgerData.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        direction={direction}
                        showValues={showValues}
                        filters={{
                            product_ids: multiFilters.product_ids,
                            warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
                            warehouse_ids: parseIdList(singleFilters.warehouse_ids),
                            doc_type: singleFilters.doc_type,
                            from_date: singleFilters.from_date,
                            to_date: singleFilters.to_date,
                            doc_text: singleFilters.doc_text,
                            doc_text_op: singleFilters.doc_text_op,
                            description_text: singleFilters.description_text,
                            description_text_op: singleFilters.description_text_op,
                            supplier_text: singleFilters.supplier_text,
                            supplier_text_op: singleFilters.supplier_text_op,
                            product_text: singleFilters.product_text,
                            product_text_op: singleFilters.product_text_op,
                            product_code_text: singleFilters.product_code_text,
                            product_code_text_op: singleFilters.product_code_text_op,
                            product_name_text: singleFilters.product_name_text,
                            product_name_text_op: singleFilters.product_name_text_op,
                            warehouse_code_text: singleFilters.warehouse_code_text,
                            warehouse_code_text_op: singleFilters.warehouse_code_text_op,
                            warehouse_name_text: singleFilters.warehouse_name_text,
                            warehouse_name_text_op: singleFilters.warehouse_name_text_op,
                            unit: singleFilters.unit,
                            lot_text: singleFilters.lot_text,
                            lot_text_op: singleFilters.lot_text_op,
                            time_sort: timeSort,
                        }}
                        onFiltersChange={(next) =>
                        {
                            setMultiFilters({
                                product_ids: next.product_ids || [],
                            })
                            setSingleFilters({
                                warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
                                warehouse_ids: next.warehouse_ids?.length ? next.warehouse_ids.join(",") : undefined,
                                doc_type: next.doc_type,
                                from_date: next.from_date,
                                to_date: next.to_date,
                                doc_text: next.doc_text,
                                doc_text_op: next.doc_text_op,
                                description_text: next.description_text,
                                description_text_op: next.description_text_op,
                                supplier_text: next.supplier_text,
                                supplier_text_op: next.supplier_text_op,
                                product_text: next.product_text,
                                product_text_op: next.product_text_op,
                                product_code_text: next.product_code_text,
                                product_code_text_op: next.product_code_text_op,
                                product_name_text: next.product_name_text,
                                product_name_text_op: next.product_name_text_op,
                                warehouse_code_text: next.warehouse_code_text,
                                warehouse_code_text_op: next.warehouse_code_text_op,
                                warehouse_name_text: next.warehouse_name_text,
                                warehouse_name_text_op: next.warehouse_name_text_op,
                                unit: next.unit,
                                lot_text: next.lot_text,
                                lot_text_op: next.lot_text_op,
                                time_sort: next.time_sort === "desc" ? "desc" : "asc",
                            })
                        }}
                    />

                    <LedgerVoucherDialog
                        mode="in"
                        open={voucherDialog === "in"}
                        onOpenChange={(open) => setVoucherDialog(open ? "in" : null)}
                    />
                    <LedgerVoucherDialog
                        mode="out"
                        open={voucherDialog === "out"}
                        onOpenChange={(open) => setVoucherDialog(open ? "out" : null)}
                    />
                    <LedgerVoucherDialog
                        mode="transfer"
                        open={voucherDialog === "transfer"}
                        onOpenChange={(open) => setVoucherDialog(open ? "transfer" : null)}
                    />
                    <LedgerVoucherDialog
                        mode="repack"
                        open={voucherDialog === "repack"}
                        onOpenChange={(open) => setVoucherDialog(open ? "repack" : null)}
                    />
                    <LedgerVoucherDialog
                        mode="conversion"
                        open={voucherDialog === "conversion"}
                        onOpenChange={(open) => setVoucherDialog(open ? "conversion" : null)}
                    />
                    <NegativeStockAuditDialog
                        open={voucherDialog === "negative-stock"}
                        onOpenChange={(open) => setVoucherDialog(open ? "negative-stock" : null)}
                        initialResult={negativeStockInitialResult}
                    />
                    <CostingReconciliationDialog
                        open={voucherDialog === "costing-reconciliation"}
                        onOpenChange={(open) => setVoucherDialog(open ? "costing-reconciliation" : null)}
                    />
                    <ProductionDateSyncTool
                        open={voucherDialog === "production-date-sync"}
                        onOpenChange={(open) => setVoucherDialog(open ? "production-date-sync" : null)}
                    />
                </div>
                )
            }}
        </PageSection>
    )
}

function InventoryLedgerSummary({
    totals,
    showValues = true,
    direction,
}: {
    totals?: InventoryLedgerTotals
    showValues?: boolean
    direction?: "IN" | "OUT"
}) {
    const normalized = {
        opening_quantity: 0,
        opening_value: 0,
        inbound_quantity: 0,
        inbound_value: 0,
        outbound_quantity: 0,
        outbound_value: 0,
        closing_quantity: 0,
        closing_value: 0,
        ...(totals || {}),
    }
    const displayValue = (value: number) => direction === "OUT" ? Math.abs(Number(value || 0)) : Number(value || 0)

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Package} label="Tồn đầu kỳ" quantity={displayValue(normalized.opening_quantity)} value={displayValue(normalized.opening_value)} showValue={showValues} />
            <Metric icon={TrendingUp} label="Nhập kho" quantity={displayValue(normalized.inbound_quantity)} value={displayValue(normalized.inbound_value)} showValue={showValues} tone="ok" />
            <Metric icon={TrendingDown} label="Xuất kho" quantity={displayValue(normalized.outbound_quantity)} value={displayValue(normalized.outbound_value)} showValue={showValues} tone="bad" />
            <Metric icon={Warehouse} label="Tồn cuối kỳ" quantity={displayValue(normalized.closing_quantity)} value={displayValue(normalized.closing_value)} showValue={showValues} tone="info" />
        </div>
    )
}

function hasPermission(permissions: any[], module: string, action: string) {
    return permissions.some((permission) => permission.module === module && permission.action === action)
}

function NegativeStockScheduledBanner({
    run,
    isRunning,
    onOpen,
    onRun,
}: {
    run?: SystemJobRun | null
    isRunning: boolean
    onOpen: () => void
    onRun: () => void
}) {
    if (!shouldShowNegativeStockJobBanner(run)) {
        return null
    }

    const failed = run?.status === "FAILED" || run?.severity === "ERROR"
    const issueCount = Number(run?.warning_count || 0)

    return (
        <div className={cn(
            "flex flex-col gap-3 rounded-md border p-3 text-sm md:flex-row md:items-center md:justify-between",
            failed ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900",
        )}>
            <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                    <div className="font-semibold">
                        {failed ? "Job kiểm tra âm tồn đang lỗi" : "Cảnh báo âm tồn sổ kho"}
                    </div>
                    <div className="mt-1">
                        {failed
                            ? (run?.error_message || run?.summary || "Lần kiểm tra tự động gần nhất không chạy thành công.")
                            : `Lần kiểm tra gần nhất phát hiện ${formatNumber(issueCount)} dòng âm tồn. Cần mở kiểm tra để xử lý.`}
                    </div>
                    <div className="mt-1 text-xs opacity-80">
                        Lần chạy: {formatDateTime(run?.finished_at || run?.created_at)} · Phạm vi: tất cả lô trong sổ kho
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <Button type="button" size="sm" variant="outline" onClick={onOpen}>
                    <Search className="mr-2 h-4 w-4" />
                    Xem chi tiết
                </Button>
                <Button type="button" size="sm" disabled={isRunning} onClick={onRun}>
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Kiểm tra lại
                </Button>
            </div>
        </div>
    )
}

function shouldShowNegativeStockJobBanner(run?: SystemJobRun | null) {
    if (!run?.id && !run?.status) return false
    if (run.status === "FAILED" || run.severity === "ERROR") return true
    return Number(run.warning_count || 0) > 0 || run.status === "WARNING"
}

function parseNegativeStockPayload(run?: SystemJobRun | null): NegativeStockAuditResult | null {
    if (!run?.payload) return null
    try {
        const parsed = JSON.parse(run.payload) as NegativeStockAuditResult
        return parsed && Array.isArray(parsed.items) ? parsed : null
    } catch {
        return null
    }
}

function NegativeStockAuditDialog({
    open,
    onOpenChange,
    initialResult,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialResult?: NegativeStockAuditResult | null
}) {
    const [productCodes, setProductCodes] = useState("")
    const [result, setResult] = useState<NegativeStockAuditResult | null>(null)
    useEffect(() => {
        if (open) {
            setResult(initialResult || null)
        }
    }, [initialResult, open])

    const mutation = useMutation({
        mutationFn: () => checkNegativeStock(productCodes),
        onSuccess: setResult,
    })
    const busy = mutation.isPending

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
            <DialogContent className="flex max-h-[92vh] !w-[min(1320px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Kiểm tra âm tồn sổ kho</DialogTitle>
                    <DialogDescription>
                        Nhập mã hàng cách nhau bằng dấu phẩy. Bỏ trống để kiểm tra tất cả mã hàng đang có trong sổ kho.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto pr-1">
                    <Textarea
                        value={productCodes}
                        onChange={(event) => {
                            setProductCodes(event.target.value)
                            setResult(null)
                            mutation.reset()
                        }}
                        placeholder="VD: HP.G500.T.5.1717PK, HF.K1.T.155GFHC"
                        className="min-h-24 font-mono"
                    />

                    {mutation.error ? (
                        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{(mutation.error as any)?.message || "Không kiểm tra được âm tồn."}</span>
                        </div>
                    ) : null}

                    {result ? <NegativeStockAuditResultPanel result={result} /> : null}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" disabled={busy} onClick={() => mutation.mutate()}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Kiểm tra
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function NegativeStockAuditResultPanel({ result }: { result: NegativeStockAuditResult }) {
    const hasNegative = Number(result.negative_count || 0) > 0

    return (
        <div className="space-y-3">
            <div className={cn(
                "flex items-start gap-2 rounded-md border p-3 text-sm",
                hasNegative ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800",
            )}>
                {hasNegative ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                <div>
                    <div className="font-semibold">{result.message}</div>
                    <div className="mt-1">
                        Đã kiểm tra {formatNumber(Number(result.checked_lot_count || 0))} lô, phát hiện {formatNumber(Number(result.negative_count || 0))} lô âm tồn.
                    </div>
                </div>
            </div>

            {result.unknown_product_codes?.length ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Không tìm thấy mã hàng: {result.unknown_product_codes.join(", ")}
                </div>
            ) : null}

            {hasNegative ? (
                <div className="overflow-auto rounded-md border">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-2 py-2 text-left">Mã hàng</th>
                                <th className="px-2 py-2 text-left">Tên hàng</th>
                                <th className="px-2 py-2 text-left">Kho</th>
                                <th className="px-2 py-2 text-left">Số lô</th>
                                <th className="px-2 py-2 text-left">Ngày/Giờ</th>
                                <th className="px-2 py-2 text-left">Chứng từ</th>
                                <th className="px-2 py-2 text-left">Loại</th>
                                <th className="px-2 py-2 text-right">Tồn sau</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.items.map((item, index) => (
                                <tr key={`${item.lot_id || index}-${item.doc_no || index}`} className="border-t">
                                    <td className="px-2 py-2 font-mono">{item.product_code || "-"}</td>
                                    <td className="px-2 py-2">{item.product_name || "-"}</td>
                                    <td className="px-2 py-2">{item.warehouse_code || item.warehouse_name || "-"}</td>
                                    <td className="px-2 py-2 font-mono">{item.lot_code || "-"}</td>
                                    <td className="px-2 py-2">{[item.posting_date, item.posting_time].filter(Boolean).join(" ") || "-"}</td>
                                    <td className="px-2 py-2">{item.doc_no || "-"}</td>
                                    <td className="px-2 py-2">{item.doc_type || "-"}</td>
                                    <td className="px-2 py-2 text-right font-semibold text-red-600">{formatNumber(Number(item.balance || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}

function CostingReconciliationDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [result, setResult] = useState<CostingLedgerReconciliationResult | null>(null)
    const mutation = useMutation({
        mutationFn: checkCostingLedgerReconciliation,
        onSuccess: setResult,
    })
    const busy = mutation.isPending

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !busy && onOpenChange(nextOpen)}>
            <DialogContent className="flex max-h-[92vh] !w-[min(1440px,calc(100vw-32px))] !max-w-[calc(100vw-32px)] flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Đối soát sổ kho và tính giá</DialogTitle>
                    <DialogDescription>
                        Kiểm tra các kỳ đã tính giá, so sánh tổng hợp tồn kho với sổ chi tiết vật tư hàng hóa theo giá trị đã tính trên từng dòng.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto pr-1">
                    {mutation.error ? (
                        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <span>{(mutation.error as any)?.message || "Không kiểm tra được số liệu sổ kho và tính giá."}</span>
                        </div>
                    ) : null}

                    {result ? <CostingReconciliationResultPanel result={result} /> : (
                        <div className="rounded-md border bg-slate-50 p-4 text-sm text-muted-foreground">
                            Bấm Kiểm tra để đối soát toàn bộ kỳ tính giá đã tính hoặc đã khóa.
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                    <Button type="button" disabled={busy} onClick={() => mutation.mutate()}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scale className="mr-2 h-4 w-4" />}
                        Kiểm tra
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function CostingReconciliationResultPanel({ result }: { result: CostingLedgerReconciliationResult }) {
    const hasMismatch = Number(result.mismatch_count || 0) > 0

    return (
        <div className="space-y-3">
            <div className={cn(
                "flex items-start gap-2 rounded-md border p-3 text-sm",
                hasMismatch ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800",
            )}>
                {hasMismatch ? <AlertTriangle className="mt-0.5 h-4 w-4" /> : <CheckCircle2 className="mt-0.5 h-4 w-4" />}
                <div>
                    <div className="font-semibold">{result.message}</div>
                    <div className="mt-1">
                        Đã kiểm tra {formatNumber(Number(result.period_count || 0))} kỳ, {formatNumber(Number(result.checked_product_rows || 0))} dòng sản phẩm/kho; phát hiện {formatNumber(Number(result.mismatch_count || 0))} dòng lệch.
                    </div>
                </div>
            </div>

            {hasMismatch ? (
                <div className="overflow-auto rounded-md border">
                    <table className="w-full min-w-[1320px] text-sm">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-2 py-2 text-left">Kỳ</th>
                                <th className="px-2 py-2 text-left">Mã hàng</th>
                                <th className="px-2 py-2 text-left">Tên hàng</th>
                                <th className="px-2 py-2 text-left">Kho</th>
                                <th className="px-2 py-2 text-right">Lệch ĐK SL</th>
                                <th className="px-2 py-2 text-right">Lệch ĐK GT</th>
                                <th className="px-2 py-2 text-right">Lệch nhập SL</th>
                                <th className="px-2 py-2 text-right">Lệch nhập GT</th>
                                <th className="px-2 py-2 text-right">Lệch xuất SL</th>
                                <th className="px-2 py-2 text-right">Lệch xuất GT</th>
                                <th className="px-2 py-2 text-right">Lệch tồn SL</th>
                                <th className="px-2 py-2 text-right">Lệch tồn GT</th>
                                <th className="px-2 py-2 text-right">Xuất chưa có giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.items.map((item, index) => (
                                <tr key={`${item.period_id}-${item.product_code}-${item.warehouse_code}-${index}`} className="border-t">
                                    <td className="px-2 py-2">
                                        <div className="font-medium">{item.period_name || "-"}</div>
                                        <div className="text-xs text-muted-foreground">{[item.from_date, item.to_date].filter(Boolean).join(" - ")}</div>
                                    </td>
                                    <td className="px-2 py-2 font-mono">{item.product_code || "-"}</td>
                                    <td className="px-2 py-2">{item.product_name || "-"}</td>
                                    <td className="px-2 py-2">{item.warehouse_code || item.warehouse_name || "-"}</td>
                                    <DiffTd value={item.diff_opening_quantity} />
                                    <DiffTd value={item.diff_opening_value} />
                                    <DiffTd value={item.diff_inbound_quantity} />
                                    <DiffTd value={item.diff_inbound_value} />
                                    <DiffTd value={item.diff_outbound_quantity} />
                                    <DiffTd value={item.diff_outbound_value} />
                                    <DiffTd value={item.diff_closing_quantity} />
                                    <DiffTd value={item.diff_closing_value} />
                                    <td className="px-2 py-2 text-right tabular-nums">{formatNumber(Number(item.missing_costed_outbound_rows || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}

function DiffTd({ value }: { value?: number | string | null }) {
    const number = Number(value || 0)
    return (
        <td className={cn("px-2 py-2 text-right tabular-nums", Math.abs(number) > 0.000001 ? "font-semibold text-red-700" : "text-muted-foreground")}>
            {formatNumber(number)}
        </td>
    )
}

function parseIdList(value?: string) {
    if (!value) return undefined
    const ids = value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
    return ids.length ? ids : undefined
}

function Metric({
    icon: Icon,
    label,
    quantity,
    value,
    showValue = true,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    quantity?: number
    value?: number
    showValue?: boolean
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]

    return (
        <Card className={cn("gap-0 py-3 shadow-sm transition-shadow hover:shadow-md", styles.ring)}>
            <CardContent className="px-4">
                <div className="text-muted-foreground mb-2 truncate text-center text-[11px] font-semibold uppercase tracking-wider">
                    {label}
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", styles.iconBg)}>
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="grid flex-1 grid-cols-[minmax(0,1fr)_minmax(96px,max-content)] gap-x-3 gap-y-1 text-sm">
                        <span className="text-muted-foreground">Số lượng</span>
                        <span className={cn("text-right font-bold tabular-nums", styles.value)}>
                            {formatNumber(quantity || 0)}
                        </span>
                        {showValue ? (
                            <>
                                <span className="text-muted-foreground">Giá trị</span>
                                <span className={cn("text-right font-bold tabular-nums", styles.value)}>
                                    {formatNumber(value || 0)}
                                </span>
                            </>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const SUMMARY_TONES = {
    info: {
        ring: "border-blue-300 bg-blue-100/80 dark:border-blue-800 dark:bg-blue-950/30",
        iconBg: "bg-white/80 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300",
        value: "",
    },
    ok: {
        ring: "border-emerald-300 bg-emerald-100/80 dark:border-emerald-800 dark:bg-emerald-950/30",
        iconBg: "bg-white/80 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300",
        value: "text-emerald-600 dark:text-emerald-400",
    },
    bad: {
        ring: "border-rose-300 bg-rose-100/80 dark:border-rose-800 dark:bg-rose-950/30",
        iconBg: "bg-white/80 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300",
        value: "text-rose-600 dark:text-rose-400",
    },
    muted: {
        ring: "border-slate-300 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-900/60",
        iconBg: "bg-white/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        value: "text-muted-foreground",
    },
} as const

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}

function formatDateTime(value?: string | null) {
    if (!value) return "-"
    const normalized = value.includes("T") ? value : value.replace(" ", "T")
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}
