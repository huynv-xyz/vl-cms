import { usePaginatedList } from "@/hooks/use-paginated-list"
import { useUrlPagination } from "@/hooks/use-url-pagination"
import { useUrlListFilters } from "@/hooks/use-url-list-filters"
import { listContractItems } from "@/api/purchasing/contract-item"
import { ContractItemsProvider } from "./contract-items-provider"
import { ContractItemTable } from "./contract-item-table"
import { ContractItemDialogs } from "./contract-item-dialogs"
import { CreateContractItemButton } from "./create-contract-item-button"
import { PageSection } from "@/components/page-section"

type Props = {
    contract: any
    search: any
    navigate: any
}

export function ContractItemsTab({ contract, search, navigate }: Props) {
    const { pagination, setPagination } = useUrlPagination(search, navigate)

    const { keyword, setKeyword } = useUrlListFilters(search, navigate, ["keyword"])

    const { data, isLoading, error } = usePaginatedList(
        ["contract-items", contract.id, search.page, search.size, keyword],
        listContractItems,
        {
            page: search.page,
            size: search.size,
            keyword,
            contract_id: contract.id,
        }
    )

    return (
        <ContractItemsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Hàng hóa"
                actions={<CreateContractItemButton />}
                data={data}
            >
                {(data) => (
                    <div className="space-y-4">
                        <ContractItemTable
                            data={data.items}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={data.total_page}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <ContractItemDialogs contractId={contract.id} />
                    </div>
                )}
            </PageSection>
        </ContractItemsProvider>
    )
}