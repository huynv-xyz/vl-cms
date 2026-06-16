import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { importOpeningStock, importPurchaseStock, listInventoryLots } from "@/api/inventory/lot"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { Route } from "@/routes/_authenticated/inventory/lots"
import { InventoryLotTable } from "./components/inventory-lot-table"
import { ExportInventoryLotsButton } from "./components/export-inventory-lots-button"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useRef, type ChangeEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { InventoryLot } from "./data/schema"
import { formatNumber } from "@/lib/utils"

export default function InventoryLotPage() {
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
        [
            "product_id",
            "warehouse_id",
            "source_type",
            "expiry_status",
            "from_date",
            "to_date",
        ]
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-lots",
            search.page,
            search.size,
            keyword,
            singleFilters.product_id,
            singleFilters.warehouse_id,
            singleFilters.source_type,
            singleFilters.expiry_status,
            singleFilters.from_date,
            singleFilters.to_date,
        ],
        listInventoryLots,
        {
            page: search.page,
            size: search.size,
            keyword,

            product_id: requestFilters.product_id
                ? Number(requestFilters.product_id)
                : undefined,

            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,

            source_type: requestFilters.source_type,
            expiry_status: requestFilters.expiry_status,
            from_date: requestFilters.from_date,
            to_date: requestFilters.to_date,
        }
    )

    const queryClient = useQueryClient()
    const openingFileRef = useRef<HTMLInputElement>(null)
    const purchaseFileRef = useRef<HTMLInputElement>(null)

    const importMutation = useMutation({
        mutationFn: importOpeningStock,
        onSuccess: async (res) => {
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })

            if (res.failed > 0) {
                toast.warning(`Import xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }

            toast.success(`Đã import ${res.success} dòng tồn đầu kỳ`)
        },
        onError: (e: any) => toast.error(e.message || "Không thể import tồn đầu kỳ"),
    })

    const importPurchaseMutation = useMutation({
        mutationFn: importPurchaseStock,
        onSuccess: async (res) => {
            await queryClient.invalidateQueries({ queryKey: ["inventory-lots"] })
            await queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })

            if (res.failed > 0) {
                toast.warning(`Import mua hàng xong ${res.success} dòng, lỗi ${res.failed} dòng`)
                return
            }

            toast.success(`Đã import ${res.success} dòng mua hàng`)
        },
        onError: (e: any) => toast.error(e.message || "Không thể import mua hàng"),
    })

    const handleOpeningFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        importMutation.mutate(file)
    }

    const handlePurchaseFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return
        importPurchaseMutation.mutate(file)
    }

    return (
        <>
            <PageSection
                title="Tồn kho theo lô (FIFO)"
                description="Quản lý tồn theo sản phẩm, kho, số lô, HSD và giá vốn để phục vụ FIFO."
                actions={
                    <div className="flex items-center gap-2">
                        <ExportInventoryLotsButton
                            keyword={keyword}
                            filters={{
                                product_id: requestFilters.product_id
                                    ? Number(requestFilters.product_id)
                                    : undefined,
                                warehouse_id: requestFilters.warehouse_id
                                    ? Number(requestFilters.warehouse_id)
                                    : undefined,
                                source_type: requestFilters.source_type,
                                expiry_status: requestFilters.expiry_status,
                                from_date: requestFilters.from_date,
                                to_date: requestFilters.to_date,
                            }}
                        />
                        <input
                            ref={openingFileRef}
                            type="file"
                            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={handleOpeningFileChange}
                        />
                        <input
                            ref={purchaseFileRef}
                            type="file"
                            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={handlePurchaseFileChange}
                        />
                        <Button
                            variant="outline"
                            disabled={importMutation.isPending}
                            onClick={() => openingFileRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {importMutation.isPending ? "Đang import..." : "Import tồn đầu kỳ"}
                        </Button>
                        <Button
                            variant="outline"
                            disabled={importPurchaseMutation.isPending}
                            onClick={() => purchaseFileRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {importPurchaseMutation.isPending ? "Đang import..." : "Import mua hàng"}
                        </Button>
                    </div>
                }
                isLoading={isLoading}
                error={error}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <LotWarningSummary data={data.items || []} />

                        <InventoryLotTable
                            data={data.items || []}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={setKeyword}

                            filters={{
                                product_id: singleFilters.product_id
                                    ? Number(singleFilters.product_id)
                                    : undefined,
                                warehouse_id: singleFilters.warehouse_id
                                    ? Number(singleFilters.warehouse_id)
                                    : undefined,
                                source_type: singleFilters.source_type,
                                expiry_status: singleFilters.expiry_status,
                                from_date: singleFilters.from_date,
                                to_date: singleFilters.to_date,
                            }}

                            onFiltersChange={(next) =>
                                setSingleFilters({
                                    product_id: next.product_id
                                        ? String(next.product_id)
                                        : undefined,
                                    warehouse_id: next.warehouse_id
                                        ? String(next.warehouse_id)
                                        : undefined,
                                    source_type: next.source_type,
                                    expiry_status: next.expiry_status,
                                    from_date: next.from_date,
                                    to_date: next.to_date,
                                })
                            }
                        />
                    </div>
                )}
            </PageSection>
        </>
    )
}

function LotWarningSummary({ data }: { data: InventoryLot[] }) {
    const remainingLots = data.filter((lot) => Number(lot.quantity_remaining ?? 0) > 0)
    const expired = remainingLots.filter((lot) => lot.expiry_status === "EXPIRED").length
    const nearExpiry = remainingLots.filter((lot) => lot.expiry_status === "NEAR_EXPIRY").length
    const noExpiry = remainingLots.filter((lot) => lot.expiry_status === "NO_EXPIRY").length

    return (
        <div className="grid gap-3 md:grid-cols-4">
            <LotMetric label="Lô còn tồn" value={formatNumber(remainingLots.length)} />
            <LotMetric label="Hết hạn" value={formatNumber(expired)} tone={expired > 0 ? "bad" : undefined} />
            <LotMetric label="Cận date 180 ngày" value={formatNumber(nearExpiry)} tone={nearExpiry > 0 ? "warn" : undefined} />
            <LotMetric label="Chưa có HSD" value={formatNumber(noExpiry)} tone={noExpiry > 0 ? "warn" : undefined} />
        </div>
    )
}

function LotMetric({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "bad" | "warn"
}) {
    const color =
        tone === "bad"
            ? "text-destructive"
            : tone === "warn"
                ? "text-amber-600"
                : "text-emerald-700"

    return (
        <div className="rounded-md border bg-background px-4 py-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
        </div>
    )
}
