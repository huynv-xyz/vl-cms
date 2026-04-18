import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"

import { getContract } from "@/api/purchasing/contract"
import { PageSection } from "@/components/page-section"
import { ContractInfoTable } from "./components/contract-info-table"
import { ContractTabs } from "./components"

export function ContractDetailPage() {
    const { id } = useParams({ strict: false })
    const contractId = Number(id)

    const query: any = useQuery({
        queryKey: ["contract-detail", contractId],
        queryFn: () => getContract(contractId),
        enabled: Number.isFinite(contractId) && contractId > 0,
    })

    const contract: any = query.data?.data ?? query.data

    return (
        <PageSection
            isLoading={query.isLoading}
            error={query.error}
            data={contract}
            title="Chi tiết hợp đồng"
            showBack
        >
            {(contract) => (
                <div className="space-y-4">
                    <ContractInfoTable contract={contract} />
                    <ContractTabs contract={contract} />
                </div>
            )}
        </PageSection>
    )
}

export default ContractDetailPage