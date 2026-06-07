import { PageSection } from "@/components/page-section"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { Route } from "@/routes/_authenticated/inventory/outbounds"
import {
    listVouchers,
    OUTBOUND_VOUCHER_TYPES,
} from "@/api/inventory/voucher"
import { OutboundTable } from "./components/outbound-table"

/**
 * Phân hệ Xuất kho khác (BA Spec M4 — FR-M4-02, FR-M4-04, FR-M4-05).
 * Bao gồm: xuất hủy, xuất hao hụt, hàng bán trả lại, hàng mua trả NCC.
 * Dùng chung endpoint /inventory/vouchers, filter theo voucher_type_code.
 */
export default function InventoryOutboundPage() {
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
            "product_id",
            "warehouse_id",
            "from_date",
            "to_date",
        ],
    )

    // Mặc định lọc các loại CT thuộc nhóm "Xuất khác" để không lẫn với PXK SX / Bán hàng
    const effectiveType = requestFilters.voucher_type ?? OUTBOUND_VOUCHER_TYPES.join(",")

    const { data, isLoading, error } = usePaginatedList(
        [
            "inventory-outbounds",
            search.page,
            search.size,
            keyword,
            effectiveType,
            requestFilters.status,
            requestFilters.product_id,
            requestFilters.warehouse_id,
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
            product_id: requestFilters.product_id
                ? Number(requestFilters.product_id)
                : undefined,
            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,
            from: requestFilters.from_date,
            to: requestFilters.to_date,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Xuất kho khác"
            description="Phiếu xuất kho ngoài bán hàng và sản xuất: hủy, hao hụt, trả NCC, hàng bán trả lại."
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <OutboundTable
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
                            product_id: singleFilters.product_id
                                ? Number(singleFilters.product_id)
                                : undefined,
                            warehouse_id: singleFilters.warehouse_id
                                ? Number(singleFilters.warehouse_id)
                                : undefined,
                            from_date: singleFilters.from_date,
                            to_date: singleFilters.to_date,
                        }}
                        onFiltersChange={(next) => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }))
                            setSingleFilters({
                                voucher_type: next.voucher_type,
                                status: next.status,
                                product_id: next.product_id
                                    ? String(next.product_id)
                                    : undefined,
                                warehouse_id: next.warehouse_id
                                    ? String(next.warehouse_id)
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
