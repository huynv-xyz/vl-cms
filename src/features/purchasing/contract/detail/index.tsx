import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"

import { getContract } from "@/api/purchasing/contract"
import { PageSection } from "@/components/page-section"
import type { Contract } from "../data/schema"
import { ContractInfoTable } from "./components/contract-info-table"
import { ContractTabs } from "./components"

export function ContractDetailPage() {
    const { id } = useParams({ strict: false })
    const contractId = Number(id)

    const query = useQuery<Contract>({
        queryKey: ["contract-detail", contractId],
        queryFn: () => getContract(contractId),
        enabled: Number.isFinite(contractId) && contractId > 0,
    })

    const contract = query.data

    return (
        <PageSection
            isLoading={query.isLoading}
            error={query.error}
            data={contract}
            header={<div className="sr-only">Chi tiết hợp đồng</div>}
            className="gap-4"
        >
            {(contract) => (
                <div className="w-full space-y-4 text-base">
                    <ContractInfoTable contract={contract} />
                    <ContractTabs contract={contract} />
                </div>
            )}
        </PageSection>
    )
}

export default ContractDetailPage
