import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { getTransactionSummary, listTransactions } from '@/api/transactions'
import { TransactionTable } from './components/transaction-table'
import { ImportTransactionButton } from './components/import-transaction-button'
import { ExportTransactionButton } from './components/export-transaction-button'
import { TransactionSummaryStrip } from './components/transaction-summary-strip'
import { Route } from '@/routes/_authenticated/transactions'

export default function TransactionPage() {
    const search = Route.useSearch()
    const navigate = Route.useNavigate()
    const queryClient = useQueryClient()

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
        ['customer_type', 'hdn_status', 'customer_code', 'customer_name', 'product_code', 'product_name', 'product_group_name'],
        ['region', 'document_date_from', 'document_date_to'],
    )

    const { data, isLoading, error } = usePaginatedList(
        [
            'transactions',
            search.page,
            search.size,
            keyword,
            multiFilters.customer_code,
            multiFilters.customer_name,
            multiFilters.product_code,
            multiFilters.product_name,
            multiFilters.product_group_name,
            multiFilters.customer_type,
            multiFilters.hdn_status,
            singleFilters.region,
            singleFilters.document_date_from,
            singleFilters.document_date_to,
        ],
        listTransactions,
        {
            page: search.page,
            size: search.size,
            keyword,
            customer_code: requestFilters.customer_code,
            customer_name: requestFilters.customer_name,
            product_code: requestFilters.product_code,
            product_name: requestFilters.product_name,
            product_group_name: requestFilters.product_group_name,
            customer_type: requestFilters.customer_type,
            hdn_status: requestFilters.hdn_status,
            region: requestFilters.region,
            document_date_from: requestFilters.document_date_from,
            document_date_to: requestFilters.document_date_to,
        },
    )

    const summaryParams = {
        keyword,
        customer_code: requestFilters.customer_code,
        customer_name: requestFilters.customer_name,
        product_code: requestFilters.product_code,
        product_name: requestFilters.product_name,
        product_group_name: requestFilters.product_group_name,
        customer_type: requestFilters.customer_type,
        hdn_status: requestFilters.hdn_status,
        region: requestFilters.region,
        document_date_from: requestFilters.document_date_from,
        document_date_to: requestFilters.document_date_to,
    }

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: [
            'transactions-summary',
            keyword,
            multiFilters.customer_code,
            multiFilters.customer_name,
            multiFilters.product_code,
            multiFilters.product_name,
            multiFilters.product_group_name,
            multiFilters.customer_type,
            multiFilters.hdn_status,
            singleFilters.region,
            singleFilters.document_date_from,
            singleFilters.document_date_to,
        ],
        queryFn: () => getTransactionSummary(summaryParams),
    })

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
                            queryClient.invalidateQueries({ queryKey: ['transactions-summary'] })
                        }}
                        onError={(error) => {
                            alert(error.message)
                        }}
                    />
                    <ExportTransactionButton
                        keyword={keyword}
                        filters={{
                            customer_type: requestFilters.customer_type,
                            customer_code: requestFilters.customer_code,
                            customer_name: requestFilters.customer_name,
                            product_code: requestFilters.product_code,
                            product_name: requestFilters.product_name,
                            product_group_name: requestFilters.product_group_name,
                            hdn_status: requestFilters.hdn_status,
                            region: requestFilters.region,
                            document_date_from: requestFilters.document_date_from,
                            document_date_to: requestFilters.document_date_to,
                        }}
                    />
                </div>
            }
            data={data}
        >
            {(data) => (
                <div className="space-y-4">
                    <TransactionSummaryStrip
                        revenue={summary?.revenue ?? 0}
                        saleQty={summary?.sale_qty ?? 0}
                        returnQty={summary?.return_qty ?? 0}
                        actualQty={summary?.actual_qty ?? 0}
                        isLoading={isSummaryLoading}
                    />
                    <TransactionTable
                        data={data.items}
                        totalRevenue={summary?.revenue ?? 0}
                        totalSaleQty={summary?.sale_qty ?? 0}
                        totalReturnQty={summary?.return_qty ?? 0}
                        totalActualQty={summary?.actual_qty ?? 0}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        pageCount={data.total_page}

                        keyword={keyword}
                        onKeywordChange={(value) => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }))
                            setKeyword(value)
                        }}

                        filters={{
                            customer_type: multiFilters.customer_type,
                            customer_code: multiFilters.customer_code,
                            customer_name: multiFilters.customer_name,
                            product_code: multiFilters.product_code,
                            product_name: multiFilters.product_name,
                            product_group_name: multiFilters.product_group_name,
                            hdn_status: multiFilters.hdn_status,
                            region: singleFilters.region,
                            document_date_from: singleFilters.document_date_from,
                            document_date_to: singleFilters.document_date_to,
                        }}

                        onFiltersChange={(next) => {
                            setPagination((p) => ({ ...p, pageIndex: 0 }))

                            setMultiFilters({
                                customer_type: next.customer_type,
                                customer_code: next.customer_code,
                                customer_name: next.customer_name,
                                product_code: next.product_code,
                                product_name: next.product_name,
                                product_group_name: next.product_group_name,
                                hdn_status: next.hdn_status,
                            })

                            setSingleFilters({
                                region: next.region,
                                document_date_from: next.document_date_from,
                                document_date_to: next.document_date_to,
                            })
                        }}
                    />
                </div>
            )}
        </PageSection>
    )
}
