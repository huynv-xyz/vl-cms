import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/inventory/transfers"
import {
    listVouchers,
    TRANSFER_VOUCHER_TYPES,
} from "@/api/inventory/voucher"
import { TransferTable } from "./components/transfer-table"

/**
 * Phân hệ Chuyển kho nội bộ (BA Spec M4 — FR-M4-03 + BR-10).
 * Mỗi phiếu chuyển kho thực chất là cặp (PXK kho A, PNK kho B) liên kết qua transfer_id.
 * Trang này hiển thị các PXK_TRANSFER + PXK_TRANSPORT, mỗi dòng kèm thông tin kho đích.
 */
export default function InventoryTransferPage() {
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
            "voucher_type",
            "status",
            "from_warehouse_id",
            "from_date",
            "to_date",
        ],
    )

    const effectiveType = requestFilters.voucher_type ?? TRANSFER_VOUCHER_TYPES.join(",")

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-transfers",
            search.page,
            search.size,
            keyword,
            effectiveType,
            requestFilters.status,
            requestFilters.from_warehouse_id,
            requestFilters.from_date,
            requestFilters.to_date,
        ],
        listVouchers,
        {
            page: search.page,
            size: search.size,
            keyword,
            type: effectiveType,
            status: requestFilters.status,
            warehouse_id: requestFilters.from_warehouse_id
                ? Number(requestFilters.from_warehouse_id)
                : undefined,
            from: requestFilters.from_date,
            to: requestFilters.to_date,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Chuyển kho nội bộ"
            description="Phiếu chuyển kho và vận chuyển nội bộ. Mỗi phiếu sinh PXK ở kho nguồn + PNK ở kho đích."
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <TransferTable
                        data={data.items}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}
                        keyword={keyword}
                        onKeywordChange={(value) => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }))
                            setKeyword(value)
                        }}
                        filters={{
                            voucher_type: singleFilters.voucher_type,
                            status: singleFilters.status,
                            from_warehouse_id: singleFilters.from_warehouse_id
                                ? Number(singleFilters.from_warehouse_id)
                                : undefined,
                            from_date: singleFilters.from_date,
                            to_date: singleFilters.to_date,
                        }}
                        onFiltersChange={(next) => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }))
                            setSingleFilters({
                                voucher_type: next.voucher_type,
                                status: next.status,
                                from_warehouse_id: next.from_warehouse_id
                                    ? String(next.from_warehouse_id)
                                    : undefined,
                                from_date: next.from_date,
                                to_date: next.to_date,
                            })
                        }}
                    />
                </div>
            )}
        </PageSection>
    )
}
