import { PageSection } from '@/components/page-section'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listEmployees } from '@/api/employee'
import { listSalesTargets } from '@/api/sales-target'
import { SalesTargetTable } from './components/sales-target-table'
import { SalesTargetDialogs } from './components/sales-target-dialogs'
import { SalesTargetsProvider } from './components/sales-targets-provider'
import { CreateSalesTargetButton } from './components/create-sales-target-button'
import { Route } from '@/routes/_authenticated/salary/sales-targets'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function SalesTargetPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        requestFilters,
    } = useUrlListFilters(search, navigate, ['period', 'employeeId'])

    const { data, isLoading, error } = usePaginatedList(
        ['sales-target', search.page, search.size, keyword, requestFilters],
        listSalesTargets,
        {
            page: search.page,
            size: search.size,
            keyword,
            period: requestFilters.period,
            employee_id: requestFilters.employeeId,
        },
    )
    const { data: employeesData } = useQuery({
        queryKey: ['sales-target-employees-map'],
        queryFn: () => listEmployees({ page: 1, size: 1000 }),
    })
    const employeeMap = useMemo(
        () => new Map((employeesData?.items ?? []).map((employee) => [employee.id, employee])),
        [employeesData],
    )

    return (
        <SalesTargetsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Chỉ tiêu"
                actions={<CreateSalesTargetButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <SalesTargetTable
                            data={data.items.map((item) => ({
                                ...item,
                                employee: item.employee ?? employeeMap.get(item.employee_id),
                            }))}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />
                        <SalesTargetDialogs />
                    </div>
                )}
            </PageSection>
        </SalesTargetsProvider>
    )
}
