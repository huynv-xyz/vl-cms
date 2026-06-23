import type React from "react"
import { useState } from "react"
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Boxes, FileText, type LucideIcon } from "lucide-react"

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
        ["product_id", "warehouse_id", "doc_type", "from_date", "to_date"],
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-ledger-report",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.doc_type,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listInventoryLedgerReport,
        {
            page: search.page,
            size: search.size,
            keyword,
            product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
            doc_type: requestFilters.doc_type,
            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
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
                            product_id: requestFilters.product_id ? Number(requestFilters.product_id) : undefined,
                            warehouse_id: requestFilters.warehouse_id ? Number(requestFilters.warehouse_id) : undefined,
                            doc_type: requestFilters.doc_type,
                            from_date: requestFilters.from_date,
                            to_date: requestFilters.to_date,
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
                    <InventoryLedgerSummary rows={data.items || []} />

                    <InventoryLedgerTable
                        data={data.items || []}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={setKeyword}
                        filters={{
                            product_id: singleFilters.product_id ? Number(singleFilters.product_id) : undefined,
                            warehouse_id: singleFilters.warehouse_id ? Number(singleFilters.warehouse_id) : undefined,
                            doc_type: singleFilters.doc_type,
                            from_date: singleFilters.from_date,
                            to_date: singleFilters.to_date,
                        }}
                        onFiltersChange={(next) =>
                            setSingleFilters({
                                product_id: next.product_id ? String(next.product_id) : undefined,
                                warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
                                doc_type: next.doc_type,
                                from_date: next.from_date,
                                to_date: next.to_date,
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

function InventoryLedgerSummary({ rows }: { rows: any[] }) {
    const quantityIn = rows.reduce((sum, row) => sum + Number(row.quantity_in || 0), 0)
    const quantityOut = rows.reduce((sum, row) => sum + Number(row.quantity_out || 0), 0)
    const latestBalance = rows.length ? Number(rows[rows.length - 1]?.balance_quantity || 0) : 0

    return (
        <div className="grid gap-3 md:grid-cols-4">
            <Metric icon={FileText} label="Số dòng đang xem" value={formatNumber(rows.length)} tone="info" />
            <Metric icon={ArrowDownLeft} label="Tổng nhập" value={formatNumber(quantityIn)} tone="ok" />
            <Metric icon={ArrowUpRight} label="Tổng xuất" value={formatNumber(quantityOut)} tone="bad" />
            <Metric icon={Boxes} label="Tồn dòng cuối" value={formatNumber(latestBalance)} tone="muted" />
        </div>
    )
}

function Metric({
    icon: Icon,
    label,
    value,
    tone = "muted",
}: {
    icon: LucideIcon
    label: string
    value: React.ReactNode
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
                    <div className={cn("mt-1 truncate text-xl font-bold tabular-nums", styles.value)}>
                        {value}
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
