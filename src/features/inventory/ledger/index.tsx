import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { Route } from "@/routes/_authenticated/inventory/ledgers"
import { listInventoryLedgerReport } from "@/api/inventory/ledger"
import { InventoryLedgerTable } from "./components/ledger-table"
import type React from "react"

export default function InventoryLedgerPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const { pagination, setPagination } = useUrlPagination(search, navigate)

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
        ["product_id", "warehouse_id", "doc_type", "from_date", "to_date"]
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
        }
    )

    return (
        <PageSection title="Sổ kho" isLoading={isLoading} error={error} data={data}>
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
            <Metric label="Số dòng đang xem" value={formatNumber(rows.length)} />
            <Metric label="Tổng nhập" value={formatNumber(quantityIn)} tone="ok" />
            <Metric label="Tổng xuất" value={formatNumber(quantityOut)} tone="bad" />
            <Metric label="Tồn dòng cuối" value={formatNumber(latestBalance)} />
        </div>
    )
}

function Metric({
    label,
    value,
    tone,
}: {
    label: string
    value: React.ReactNode
    tone?: "ok" | "bad"
}) {
    const valueClass =
        tone === "ok"
            ? "text-emerald-600"
            : tone === "bad"
                ? "text-rose-600"
                : ""

    return (
        <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`mt-1 font-semibold ${valueClass}`}>{value}</div>
        </div>
    )
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value || 0)
}
