import { PageSection } from '@/components/page-section'
import { Button } from '@/components/ui/button'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listArLedgers } from '@/api/sale/ar-ledger'
import { ArLedgerTable } from './components/ar-ledger-table'
import { Route } from '@/routes/_authenticated/sales/ar-ledgers'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export default function ArLedgerPage() {

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
    } = useUrlListFilters(
        search,
        navigate,
        ['source_type', 'activity'], // multi
        ['from_date', 'to_date', 'customer_id'] // single
    )

    const showReturnToSummary = search.return_from === "ar-summary"
    const today = todayYmd()

    const { data, isLoading, error } = usePaginatedList(
        [
            'ar-ledgers',
            search.page,
            search.size,
            keyword,
            multiFilters.source_type,
            multiFilters.activity,
            singleFilters,
        ],
        listArLedgers,
        {
            page: search.page,
            size: search.size,
            keyword,
            source_type: multiFilters.source_type?.join(",") || undefined,
            activity: multiFilters.activity?.join(",") || undefined,
            from_date: singleFilters.from_date,
            to_date: singleFilters.to_date,
            customer_id: singleFilters.customer_id
                ? Number(singleFilters.customer_id)
                : undefined,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Công nợ phải thu"
            description="Sổ chi tiết công nợ phải thu khách hàng (tài khoản 131)."
            actions={
                showReturnToSummary ? (
                    <Button asChild variant="outline">
                        <Link
                            to="/sales/ar-summary"
                            search={{
                                page: search.return_page ?? 1,
                                size: search.return_size ?? 20,
                                keyword: search.return_keyword ?? "",
                                from_date: search.return_from_date ?? today,
                                to_date: search.return_to_date ?? today,
                                customer_id: search.return_customer_id
                                    ? String(search.return_customer_id)
                                    : undefined,
                                activity: search.return_activity,
                            }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Trở lại
                        </Link>
                    </Button>
                ) : null
            }
            data={data}
        >
            {(data) => (
                <ArLedgerTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}

                    filters={{
                        ...singleFilters,
                        source_type: multiFilters.source_type,
                        activity: multiFilters.activity,
                        customer_id: singleFilters.customer_id
                            ? Number(singleFilters.customer_id)
                            : undefined,
                    }}

                    onFiltersChange={(f) => {
                        setSingleFilters({
                            ...f,
                            customer_id: f.customer_id?.toString(),
                        })

                        setMultiFilters({
                            source_type: f.source_type,
                            activity: f.activity,
                        })
                    }}
                />
            )}
        </PageSection>
    )
}

function todayYmd() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
