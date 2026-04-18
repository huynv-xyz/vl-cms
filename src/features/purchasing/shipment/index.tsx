import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { ShipmentDialogs } from './components/shipment-dialogs'
import { ShipmentsProvider } from './components/shipments-provider'
import { CreateShipmentButton } from './components/create-shipment-button'
import { Route } from '@/routes/_authenticated/purchasing/shipments'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { listShipmentItems } from '@/api/purchasing/shipment_items'
import { ShipmentItemTable } from '../shipment-item/components/shipment-item-table'

export default function ShipmentPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
    } = useUrlListFilters(
        search,
        navigate,
        [] as const // 🔥 bỏ hết filter
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'shipment-item',
            search.page,
            search.size,
            keyword,
        ],
        listShipmentItems,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <ShipmentsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Danh sách hàng nhập"
                actions={<CreateShipmentButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">

                        <ShipmentItemTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}

                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <ShipmentDialogs contract={{} as any} />
                    </div>
                )}
            </PageSection>
        </ShipmentsProvider>
    )
}