import { PageSection } from '@/components/page-section'
import { usePaginatedList } from '@/hooks/use-paginated-list'
import { listCashBankLedgers } from '@/api/sale/cash-bank-ledger'
import { Route } from '@/routes/_authenticated/sales/cash-bank-ledger'
import { useUrlPagination } from '@/hooks/use-url-pagination'
import { useUrlListFilters } from '@/hooks/use-url-list-filters'
import { CashBankLedgerTable } from './components/cash-bank-ledger-table'
import { ImportCashBankLedgerButton } from './components/cash-bank-ledger-import-button'

export default function CashBankLedgerPage() {

    const search = Route.useSearch()
    const navigate = Route.useNavigate()

    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const {
        keyword,
        setKeyword,
    } = useUrlListFilters(search, navigate, ['keyword'])

    const { data, isLoading, error } = usePaginatedList(
        ['cash-bank-ledger', search.page, search.size, keyword],
        listCashBankLedgers,
        {
            page: search.page,
            size: search.size,
            keyword,
        },
    )

    return (
        <PageSection
            isLoading={isLoading}
            error={error}
            title="Sổ công nợ"
            data={data}
            actions={
                <ImportCashBankLedgerButton />
            }
        >
            {(data) => (
                <CashBankLedgerTable
                    data={data.items}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={data.total_page}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                />
            )}
        </PageSection>
    )
}