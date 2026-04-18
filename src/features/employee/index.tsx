import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listEmployees } from '@/api/employee'
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
    const filters = useUrlListFilters(search, navigate, ['status'])
    const status = filters.multiFilters.status

    const { data, isLoading, error } = usePaginatedList(
        ['employee', search.page, search.size, filters.keyword, filters.multiFilters.status],
        listEmployees,
        {
            page: search.page,
            size: search.size,
            keyword: filters.keyword,
            status: status?.join(','),
        },
    )

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
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={filters.keyword}
                            onKeywordChange={filters.setKeyword}
                            status={filters.multiFilters.status}
                            onStatusChange={(status: string[]) =>
                                filters.setMultiFilters({ status })
                            }
                        />
                        <EmployeeDialogs />
                    </div>
                )}
            </PageSection>
        </EmployeesProvider>
    )
}