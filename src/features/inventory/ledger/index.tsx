import type React from "react"
import { useState } from "react"
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Package, TrendingDown, TrendingUp, Warehouse, type LucideIcon } from "lucide-react"

import { listInventoryLedgerReport } from "@/api/inventory/ledger"
import { PageSection } from "@/components/page-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { cn } from "@/lib/utils"
import { Route } from "@/routes/_authenticated/inventory/ledgers"
import { InventoryLedgerTable } from "./components/ledger-table"
import { ExportInventoryLedgerButton } from "./components/export-inventory-ledger-button"
import { LedgerImportButtons } from "./components/ledger-import-buttons"
import { LedgerProductionChronologyToolButton } from "./components/ledger-production-chronology-tool-button"
import { LedgerProductionFifoWarehouseToolButton } from "./components/ledger-production-fifo-warehouse-tool-button"
import { LedgerSalesSyncButton } from "./components/ledger-sales-sync-button"
import { LedgerTestResetButton } from "./components/ledger-test-reset-button"
import { LedgerVoucherDialog } from "./components/ledger-voucher-dialog"
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
    const [voucherDialog, setVoucherDialog] = useState<"in" | "out" | "transfer" | null>(null)
    const direction = mode === "in" ? "IN" : mode === "out" ? "OUT" : undefined
    const showValues = mode === "all"
    const pageTitle = mode === "in" ? "Nhập kho" : mode === "out" ? "Xuất kho" : "Sổ kho"

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
            "unit",
            "lot_text",
            "lot_text_op",
        ],
    )

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
            singleFilters.unit,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
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
            unit: requestFilters.unit,
            lot_text: requestFilters.lot_text,
            lot_text_op: requestFilters.lot_text_op,
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
                    {mode === "all" ? <LedgerSalesSyncButton /> : null}
                    {mode === "all" ? <LedgerProductionChronologyToolButton /> : null}
                    {mode === "all" ? <LedgerProductionFifoWarehouseToolButton /> : null}
                    <ExportInventoryLedgerButton
                        keyword={keyword}
                        showValues={showValues}
                        title={mode === "in" ? "NHẬP KHO" : mode === "out" ? "XUẤT KHO" : "SỔ KHO"}
                        filePrefix={mode === "in" ? "nhap-kho" : mode === "out" ? "xuat-kho" : "so-kho"}
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
                            unit: requestFilters.unit,
                            lot_text: requestFilters.lot_text,
                            lot_text_op: requestFilters.lot_text_op,
                            direction,
                            show_values: showValues,
                        }}
                    />
                    {mode === "all" ? <LedgerTestResetButton /> : null}
                    {mode !== "out" ? (
                        <Button size="sm" variant="outline" onClick={() => setVoucherDialog("in")}>
                            <ArrowDownLeft className="mr-2 h-4 w-4 text-emerald-600" />
                            Nhập hàng
                        </Button>
                    ) : null}
                    {mode !== "in" ? (
                        <Button size="sm" variant="outline" onClick={() => setVoucherDialog("out")}>
                            <ArrowUpRight className="mr-2 h-4 w-4 text-rose-600" />
                            Xuất hàng
                        </Button>
                    ) : null}
                    {mode !== "in" ? (
                        <Button size="sm" variant="outline" onClick={() => setVoucherDialog("transfer")}>
                            <ArrowLeftRight className="mr-2 h-4 w-4 text-blue-600" />
                            Chuyển kho
                        </Button>
                    ) : null}
                </div>
            }
        >
            {(data) => (
                <div className="space-y-4">
                    <InventoryLedgerSummary totals={(data as any).totals} showValues={showValues} />

                    <InventoryLedgerTable
                        data={data.items || []}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
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
                            unit: singleFilters.unit,
                            lot_text: singleFilters.lot_text,
                            lot_text_op: singleFilters.lot_text_op,
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
                                unit: next.unit,
                                lot_text: next.lot_text,
                                lot_text_op: next.lot_text_op,
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
                </div>
            )}
        </PageSection>
    )
}

function InventoryLedgerSummary({ totals, showValues = true }: { totals?: InventoryLedgerTotals; showValues?: boolean }) {
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

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Package} label="Tồn đầu kỳ" quantity={normalized.opening_quantity} value={normalized.opening_value} showValue={showValues} />
            <Metric icon={TrendingUp} label="Nhập kho" quantity={normalized.inbound_quantity} value={normalized.inbound_value} showValue={showValues} tone="ok" />
            <Metric icon={TrendingDown} label="Xuất kho" quantity={normalized.outbound_quantity} value={normalized.outbound_value} showValue={showValues} tone="bad" />
            <Metric icon={Warehouse} label="Tồn cuối kỳ" quantity={normalized.closing_quantity} value={normalized.closing_value} showValue={showValues} tone="info" />
        </div>
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
