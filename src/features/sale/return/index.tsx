import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'

import { ReturnTable } from './components/return-table'
import { ReturnDialogs } from './components/return-dialogs'
import { CreateReturnButton } from './components/create-return-button'
import { ReturnsProvider } from './components/returns-provider'

import { Route } from '@/routes/_authenticated/sales/returns'

import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

import { listReturns } from '@/api/sale/return'

export default function ReturnPage() {

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
        ['order_id', 'export_id']
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'returns',
            search.page,
            search.size,
            keyword,
            multiFilters.status,
            singleFilters.order_id,
            singleFilters.export_id
        ],
        listReturns,
        {
            page: search.page,
            size: search.size,
            keyword,
            status: requestFilters.status,

            order_id: requestFilters.order_id
                ? Number(requestFilters.order_id)
                : undefined,

            export_id: requestFilters.export_id
                ? Number(requestFilters.export_id)
                : undefined,
        },
    )

    return (
        <ReturnsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Trả hàng"
                actions={<CreateReturnButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">

                        <ReturnTable
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

                                export_id: singleFilters.export_id
                                    ? Number(singleFilters.export_id)
                                    : undefined,
                            }}

                            onFiltersChange={(next) => {

                                setMultiFilters({
                                    status: next.status,
                                })

                                setSingleFilters({
                                    order_id: next.order_id
                                        ? String(next.order_id)
                                        : undefined,

                                    export_id: next.export_id
                                        ? String(next.export_id)
                                        : undefined,
                                })
                            }}
                        />

                        <ReturnDialogs />

                    </div>
                )}
            </PageSection>
        </ReturnsProvider>
    )
}