import { useState } from "react"
import { usePaginatedList } from "@/hooks/use-paginated-list"
import { listShipmentItems } from "@/api/purchasing/shipment_items"
import { ShipmentsProvider } from "../../../shipment/components/shipments-provider"
import { ShipmentItemTable } from "../../../shipment-item/components/shipment-item-table"
import { ShipmentDialogs } from "../../../shipment/components/shipment-dialogs"
import { Contract } from "../../data/schema"
import { CreateShipmentButton } from "@/features/purchasing/shipment/components/create-shipment-button"
import { LoadingState } from "@/components/loading-state"

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
        return <LoadingState title="Đang tải hàng nhập" description="Đang lấy danh sách lô hàng của hợp đồng." />
    }

    if (error) {
        return <div className="text-base text-red-500">Lỗi tải dữ liệu.</div>
    }

    const pageData = (data as any)?.data ?? data

    return (
        <ShipmentsProvider>

            <div className="space-y-4">

                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h3 className="text-3xl font-bold tracking-tight">
                            Hàng nhập
                        </h3>
                        <p className="text-base text-muted-foreground">
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
