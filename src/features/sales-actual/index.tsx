import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listSalesActuals } from '@/api/sales-actual'
import { SalesActualTable } from './components/sales-actual-table'
import { SalesActualsProvider } from './components/sales-actuals-provider'
import { Route } from '@/routes/_authenticated/salary/sales-actuals'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

function parseOptionalNumber(value?: string) {
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
}

export default function SalesActualPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
        requestFilters,
    } = useUrlListFilters(search, navigate, ['employeeId'], ['period'])

    const period = search.period ? Number(search.period) : undefined
    const employeeId = parseOptionalNumber(requestFilters.employeeId)

    const { data, isLoading, error } = usePaginatedList(
        ['sales-actual', search.page, search.size, keyword, period, employeeId],
        listSalesActuals,
        {
            page: search.page,
            size: search.size,
            keyword,
            period,
            employeeId,
        },
    )

    return (
        <SalesActualsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Doanh số thực hiện'
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <SalesActualTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                            filters={{
                                //periods: multiFilters.period,
                                employeeIds: multiFilters.employeeId,
                            }}
                            onFiltersChange={(next) =>
                                setMultiFilters({
                                    //period: next.periods,
                                    employeeId: next.employeeIds,
                                })
                            }
                        />
                    </div>
                )}
            </PageSection>
        </SalesActualsProvider>
    )
}