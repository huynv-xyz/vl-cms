import { useState } from "react"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listShipmentItems } from "@/api/purchasing/shipment_items"
import { ShipmentsProvider } from "../../../shipment/components/shipments-provider"
import { ShipmentItemTable } from "../../../shipment-item/components/shipment-item-table"
import { ShipmentDialogs } from "../../../shipment/components/shipment-dialogs"
import { Contract } from "../../data/schema"
import { CreateShipmentButton } from "@/features/purchasing/shipment/components/create-shipment-button"

type Props = {
    contract: Contract
}

export function ShipmentsTab({ contract }: Props) {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 20,
    })
    const [keyword, setKeyword] = useState("")

    const page = pagination.pageIndex + 1
    const size = pagination.pageSize

    const { data, isLoading, error } = usePaginatedList(
        ["shipment-items", contract.id, page, size, keyword],
        listShipmentItems,
        {
            page,
            size,
            keyword,
            contract_id: contract.id,
        }
    )

    if (isLoading) {
        return <div className="text-sm">Đang tải...</div>
    }

    if (error) {
        return <div className="text-sm text-red-500">Lỗi tải dữ liệu.</div>
    }

    const pageData = (data as any)?.data ?? data

    return (
        <ShipmentsProvider>

            <div className="space-y-4">

                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">
                            Hàng nhập
                        </h3>
                        <p className="text-muted-foreground">
                            Danh sách hàng nhập theo hợp đồng
                        </p>
                    </div>
                    <CreateShipmentButton />
                </div>

                <ShipmentItemTable
                    data={pageData?.items ?? []}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    pageCount={pageData?.total_page ?? 0}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                />

                <ShipmentDialogs contract={contract} />
            </div>
        </ShipmentsProvider>
    )
}