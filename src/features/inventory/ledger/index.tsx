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
import { LedgerSalesSyncButton } from "./components/ledger-sales-sync-button"
import { LedgerTestResetButton } from "./components/ledger-test-reset-button"
import { LedgerVoucherDialog } from "./components/ledger-voucher-dialog"
import type { InventoryLedgerTotals } from "./data/schema"

export default function InventoryLedgerPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const [voucherDialog, setVoucherDialog] = useState<"in" | "out" | "transfer" | null>(null)

    const {
        keyword,
        setKeyword,
        singleFilters,
        setSingleFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        [],
        [
            "warehouse_id",
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
            singleFilters.warehouse_id,
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
            singleFilters.unit,
            singleFilters.lot_text,
            singleFilters.lot_text_op,
        ],
        listInventoryLedgerReport,
        {
            page: search.page,
            size: search.size,
            keyword,
            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
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
            unit: requestFilters.unit,
            lot_text: requestFilters.lot_text,
            lot_text_op: requestFilters.lot_text_op,
        },
    )

    return (
        <PageSection
            title="Sổ kho"
            isLoading={isLoading}
            error={error}
            data={data}
            actions={
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <LedgerImportButtons />
                    <ExportInventoryLedgerButton
                        keyword={keyword}
                        filters={{
                            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
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
                            unit: requestFilters.unit,
                            lot_text: requestFilters.lot_text,
                            lot_text_op: requestFilters.lot_text_op,
                        }}
                    />
                    <LedgerSalesSyncButton />
                    <LedgerTestResetButton />
                    <Button size="sm" variant="outline" onClick={() => setVoucherDialog("in")}>
                        <ArrowDownLeft className="mr-2 h-4 w-4 text-emerald-600" />
                        Nhập hàng
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setVoucherDialog("out")}>
                        <ArrowUpRight className="mr-2 h-4 w-4 text-rose-600" />
                        Xuất hàng
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setVoucherDialog("transfer")}>
                        <ArrowLeftRight className="mr-2 h-4 w-4 text-blue-600" />
                        Chuyển kho
                    </Button>
                </div>
            }
        >
            {(data) => (
                <div className="space-y-4">
                    <InventoryLedgerSummary totals={(data as any).totals} />

                    <InventoryLedgerTable
                        data={data.items || []}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        filters={{
                            warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
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
                            unit: singleFilters.unit,
                            lot_text: singleFilters.lot_text,
                            lot_text_op: singleFilters.lot_text_op,
                        }}
                        onFiltersChange={(next) =>
                            setSingleFilters({
                                warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
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
                                unit: next.unit,
                                lot_text: next.lot_text,
                                lot_text_op: next.lot_text_op,
                            })
                        }
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

function InventoryLedgerSummary({ totals }: { totals?: InventoryLedgerTotals }) {
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
            <Metric icon={Package} label="Tồn đầu kỳ" quantity={normalized.opening_quantity} value={normalized.opening_value} />
            <Metric icon={TrendingUp} label="Nhập kho" quantity={normalized.inbound_quantity} value={normalized.inbound_value} tone="ok" />
            <Metric icon={TrendingDown} label="Xuất kho" quantity={normalized.outbound_quantity} value={normalized.outbound_value} tone="bad" />
            <Metric icon={Warehouse} label="Tồn cuối kỳ" quantity={normalized.closing_quantity} value={normalized.closing_value} tone="info" />
        </div>
    )
}

function Metric({
    icon: Icon,
    label,
    quantity,
    value,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    quantity?: number
    value?: number
    tone?: keyof typeof SUMMARY_TONES
}) {
    const styles = SUMMARY_TONES[tone]

    return (
        <Card className={cn("gap-0 py-4 shadow-sm transition-shadow hover:shadow-md", styles.ring)}>
            <CardContent className="flex items-center gap-3 px-4">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", styles.iconBg)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-muted-foreground truncate text-[11px] font-semibold uppercase tracking-wider">
                        {label}
                    </div>
                    <div className={cn("mt-1 text-sm tabular-nums", styles.value)}>
                        Số lượng: <span className="font-bold">{formatNumber(quantity || 0)}</span>
                    </div>
                    <div className={cn("text-sm tabular-nums", styles.value)}>
                        Giá trị: <span className="font-bold">{formatNumber(value || 0)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const SUMMARY_TONES = {
    info: {
        ring: "border-blue-200/60 dark:border-blue-900/40",
        iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
        value: "",
    },
    ok: {
        ring: "border-emerald-200/60 dark:border-emerald-900/40",
        iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        value: "text-emerald-600 dark:text-emerald-400",
    },
    bad: {
        ring: "border-rose-200/70 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10",
        iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
        value: "text-rose-600 dark:text-rose-400",
    },
    muted: {
        ring: "border-border/60",
        iconBg: "bg-muted text-muted-foreground",
        value: "text-muted-foreground",
    },
} as const

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}
