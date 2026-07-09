import { useQuery } from '@tanstack/react-query'
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listEmployees, type EmployeeListParams } from '@/api/employee'
import { EmployeeTable } from './components/employee-table'
import { EmployeeDialogs } from './components/employee-dialogs'
import { EmployeesProvider } from './components/employees-provider'
import { CreateEmployeeButton } from './components/create-employee-button'
import { Route } from '@/routes/_authenticated/employees'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function EmployeePage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)
    const filters = useUrlListFilters(search, navigate, [], ['status'])

    const requestParams = {
        keyword: filters.keyword,
        status: filters.requestFilters.status,
    }

    const { data, isLoading, error } = usePaginatedList(
        ['employee', search.page, search.size, filters.keyword, filters.singleFilters.status],
        listEmployees,
        {
            page: search.page,
            size: search.size,
            ...requestParams,
        },
    )

    const { data: summary } = useQuery({
        queryKey: ['employee-summary', filters.keyword, filters.singleFilters.status],
        queryFn: () => fetchEmployeeSummary(requestParams),
    })

    return (
        <EmployeesProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title='Nhân viên'
                actions={<CreateEmployeeButton />}
                data={data}
            >
                {(data) => (
                    <div className='space-y-4'>
                        <EmployeeTable
                            data={data.items}
                            summary={summary}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={filters.keyword}
                            onKeywordChange={(value: string) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                filters.setKeyword(value)
                            }}
                            filters={{
                                status: filters.singleFilters.status,
                            }}
                            onFiltersChange={(next: { status?: string }) => {
                                setPagination((p) => ({ ...p, pageIndex: 0 }))
                                filters.setSingleFilters({
                                    status: next.status,
                                })
                            }}
                        />
                        <EmployeeDialogs />
                    </div>
                )}
            </PageSection>
        </EmployeesProvider>
    )
}

async function fetchEmployeeSummary(filters: Omit<EmployeeListParams, 'page' | 'size'>) {
    const baseParams = { ...filters, page: 1, size: 1 }
    const [totalRes, activeRes, inactiveRes] = await Promise.all([
        listEmployees(baseParams),
        filters.status && filters.status !== '1'
            ? Promise.resolve({ total: 0 })
            : listEmployees({ ...baseParams, status: '1' }),
        filters.status && filters.status !== '0'
            ? Promise.resolve({ total: 0 })
            : listEmployees({ ...baseParams, status: '0' }),
    ])

    return {
        total: totalRes.total ?? 0,
        active: activeRes.total ?? 0,
        inactive: inactiveRes.total ?? 0,
    }
}
