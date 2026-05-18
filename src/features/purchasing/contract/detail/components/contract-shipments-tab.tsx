import { useState } from "react"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listShipmentItems } from "@/api/purchasing/shipment_items"
import { ShipmentsProvider } from "../../../shipment/components/shipments-provider"
import { ShipmentItemTable } from "../../../shipment-item/components/shipment-item-table"
import { ShipmentDialogs } from "../../../shipment/components/shipment-dialogs"
import type { Contract } from "../../data/schema"
import { CreateShipmentButton } from "@/features/purchasing/shipment/components/create-shipment-button"
import { PageSection } from "@/components/page-section"

type Props = {
    contract: Contract
}

export function ShipmentsTab({ contract }: Props) {
    const [keyword, setKeyword] = useState("")

    const { data, isLoading, error } = usePaginatedList(
        ["shipment-items", contract.id, keyword],
        listShipmentItems,
        {
            page: 1,
            size: 200,
            keyword,
            contract_id: contract.id,
        }
    )

    return (
        <ShipmentsProvider>
            <PageSection
                isLoading={isLoading}
                error={error}
                title="Lô hàng"
                actions={<CreateShipmentButton />}
                data={data}
                className="p-0"
            >
                {(pageData) => (
                    <div className="space-y-4">
                        <ShipmentItemTable
                            data={pageData?.items ?? []}
                            keyword={keyword}
                            onKeywordChange={setKeyword}
                        />

                        <ShipmentDialogs contract={contract} />
                    </div>
                )}
            </PageSection>
        </ShipmentsProvider>
    )
}
