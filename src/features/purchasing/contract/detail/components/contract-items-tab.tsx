import { useState } from "react"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listContractItems } from "@/api/purchasing/contract-item"
import { PageSection } from "@/components/page-section"
import { ContractItemsProvider } from "@/features/purchasing/contract-item/components/contract-items-provider"
import { CreateContractItemButton } from "@/features/purchasing/contract-item/components/create-contract-item-button"
import { ContractItemTable } from "@/features/purchasing/contract-item/components/contract-item-table"
import { ContractItemDialogs } from "@/features/purchasing/contract-item/components/contract-item-dialogs"

type Props = {
    contract: any
}

export function ContractItemsTab({ contract }: Props) {
    const [keyword, setKeyword] = useState("")

    const { data, isLoading, error } = usePaginatedList(
        ["contract-items", contract.id, keyword],
        listContractItems,
        {
            page: 1,
            size: 200,
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
                className="p-0"
            >
                {(data) => (
                    <div className="space-y-4">
                        <ContractItemTable
                            data={data.items}
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