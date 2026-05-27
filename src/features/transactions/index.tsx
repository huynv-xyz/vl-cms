import { useQueryClient } from "@tanstack/react-query"
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { listTransactions } from '@/api/transactions'
import { TransactionTable } from './components/transaction-table'
import { ImportTransactionButton } from './components/import-transaction-button'
import { ExportTransactionButton } from './components/export-transaction-button'
import { Route } from '@/routes/_authenticated/transactions'

export default function TransactionPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const { keyword, setKeyword, multiFilters, setMultiFilters, requestFilters } =
        useUrlListFilters(search, navigate, [
            'customer_type',
            'vthh_con',
            'npp',
            'process_month',
        ])

    const { data, isLoading, error } = usePaginatedList(
        ['transactions'],
        listTransactions,
        {
            page: search.page,
            size: search.size,
            keyword,
            customer_type: requestFilters.customer_type,
            vthh_con: requestFilters.vthh_con,
            npp: requestFilters.npp,
            process_month: requestFilters.process_month,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title='Dữ liệu bán hàng'
            actions={
                <div className="flex flex-wrap items-center gap-2">
                    <ImportTransactionButton
                        onSuccess={(result) => {
                            alert(`Import thành công: ${result.inserted} dòng`)
                            queryClient.invalidateQueries({ queryKey: ['transactions'] })
                        }}
                        onError={(error) => {
                            alert(error.message)
                        }}
                    />
                    <ExportTransactionButton
                        keyword={keyword}
                        filters={{
                            customer_type: requestFilters.customer_type,
                            vthh_con: requestFilters.vthh_con,
                            npp: requestFilters.npp,
                            process_month: requestFilters.process_month,
                        }}
                    />
                </div>
            }
            data={data}
        >
            {(data) => (
                <TransactionTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    filters={{
                        //customer_types: multiFilters.customer_type,
                        //vthh_cons: multiFilters.vthh_con,
                        //npps: multiFilters.npp,
                        //process_months: multiFilters.process_month,
                    }}
                    onFiltersChange={(next) =>
                        setMultiFilters({
                            customer_type: next.customer_types,
                            vthh_con: next.vthh_cons,
                            npp: next.npps,
                            process_month: next.process_months,
                        })
                    }
                />
            )}
        </PageSection>
    )
}