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
        ['customer_type', 'hdn_status', 'customer_code', 'customer_name', 'product_code', 'product_name'],
        ['vthh_con', 'npp', 'process_month', 'region', 'document_date_from', 'document_date_to'],
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
            multiFilters.customer_type,
            multiFilters.hdn_status,
            singleFilters.vthh_con,
            singleFilters.npp,
            singleFilters.process_month,
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
            customer_type: requestFilters.customer_type,
            hdn_status: requestFilters.hdn_status,
            vthh_con: requestFilters.vthh_con,
            npp: requestFilters.npp,
            process_month: requestFilters.process_month,
            region: requestFilters.region,
            document_date_from: requestFilters.document_date_from,
            document_date_to: requestFilters.document_date_to,
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
                            customer_code: requestFilters.customer_code,
                            customer_name: requestFilters.customer_name,
                            product_code: requestFilters.product_code,
                            product_name: requestFilters.product_name,
                            vthh_con: requestFilters.vthh_con,
                            npp: requestFilters.npp,
                            process_month: requestFilters.process_month,
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
                    <TransactionTable
                        data={data.items}
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
                            hdn_status: multiFilters.hdn_status,
                            vthh_con: singleFilters.vthh_con,
                            npp: singleFilters.npp,
                            process_month: singleFilters.process_month,
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
                                hdn_status: next.hdn_status,
                            })

                            setSingleFilters({
                                vthh_con: next.vthh_con,
                                npp: next.npp,
                                process_month: next.process_month,
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
