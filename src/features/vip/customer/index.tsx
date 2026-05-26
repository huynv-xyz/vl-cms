import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { CustomerVipTable } from './components/customer-vip-table'
import { listCustomerVips } from '@/api/customer-vip'
import { Route } from '@/routes/_authenticated/vip/customer'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'

export default function CustomerVipPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
        multiFilters,
        setMultiFilters,
        requestFilters,
    } = useUrlListFilters(
        search,
        navigate,
        ['region', 'tier_code', 'group_code', 'calc_year', 'customer_type', 'customer_code'],
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'customer-vip',
            search.page,
            search.size,
            keyword,
            multiFilters.region,
            multiFilters.tier_code,
            multiFilters.group_code,
            multiFilters.calc_year,
            multiFilters.customer_type,
            multiFilters.customer_code,
        ],
        listCustomerVips,
        {
            page: search.page,
            size: search.size,
            keyword,
            region: requestFilters.region,
            tier_code: requestFilters.tier_code,
            group_code: requestFilters.group_code,
            calc_year: requestFilters.calc_year ? Number(requestFilters.calc_year) : undefined,
            customer_type: requestFilters.customer_type,
            customer_code: requestFilters.customer_code,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title='Khách hàng VIP'
            description='Danh sách khách hàng và thông tin xếp hạng VIP.'
            data={data}
        >
            {(data) => (
                <CustomerVipTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    filters={{
                        regions: multiFilters.region,
                        tier_codes: multiFilters.tier_code,
                        group_codes: multiFilters.group_code,
                        calc_years: multiFilters.calc_year,
                        customer_types: multiFilters.customer_type,
                        customer_codes: multiFilters.customer_code,
                    }}
                    onFiltersChange={(next) =>
                        setMultiFilters({
                            region: next.regions,
                            tier_code: next.tier_codes,
                            group_code: next.group_codes,
                            calc_year: next.calc_years,
                            customer_type: next.customer_types,
                            customer_code: next.customer_codes,
                        })
                    }
                />
            )}
        </PageSection>
    )
}
