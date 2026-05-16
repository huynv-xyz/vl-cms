import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listExports } from '@/api/sale/export'
import { ExportTable } from './components/export-table'
import { Route } from '@/routes/_authenticated/sales/exports'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function ExportPage() {

    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
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
        ['status'],
        ['order_id', 'delivery_id', 'warehouse_id']
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'exports',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            singleFilters.order_id,
            singleFilters.delivery_id,
            singleFilters.warehouse_id,
        ],
        listExports,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,
            order_id: requestFilters.order_id
                ? Number(requestFilters.order_id)
                : undefined,
            delivery_id: requestFilters.delivery_id
                ? Number(requestFilters.delivery_id)
                : undefined,
            warehouse_id: requestFilters.warehouse_id
                ? Number(requestFilters.warehouse_id)
                : undefined,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Phiếu xuất"
            data={data}
        >
            {(data) => (
                <ExportTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    filters={{
                        status: multiFilters.status,
                        order_id: singleFilters.order_id
                            ? Number(singleFilters.order_id)
                            : undefined,
                        delivery_id: singleFilters.delivery_id
                            ? Number(singleFilters.delivery_id)
                            : undefined,
                        warehouse_id: singleFilters.warehouse_id
                            ? Number(singleFilters.warehouse_id)
                            : undefined,
                    }}
                    onFiltersChange={(next) => {
                        setMultiFilters({
                            status: next.status,
                        })

                        setSingleFilters({
                            order_id: next.order_id ? String(next.order_id) : undefined,
                            delivery_id: next.delivery_id ? String(next.delivery_id) : undefined,
                            warehouse_id: next.warehouse_id ? String(next.warehouse_id) : undefined,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}
